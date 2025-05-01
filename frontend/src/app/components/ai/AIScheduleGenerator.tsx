"use client";

import React, { useState, useEffect } from 'react';
import ProfessorsToAvoidSelector from './selectors/ProfessorsToAvoidSelector';
import CourseSelector from './selectors/CourseSelector';
import CreditLimitsSelector from './selectors/CreditLimitsSelector';
import CampusPreferencesSelector from './selectors/CampusPreferencesSelector';
import AdditionalPreferencesSelector from './selectors/AdditionalPreferencesSelector';
import WeekAvailability, { TimeInterval, DayName } from './selectors/WeekAvailability';
import ScheduleVisualization from './selectors/ScheduleVisualization';


// API configuration
const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v2/schedule-builder`;

// Local interfaces
export interface ClassSession {
  id: string;
  courseCode: string;
  title: string;
  day: number;
  startTime: number;
  endTime: number;
  location: string;
  instructor: string;
  color: string;
  credits?: number;
}

interface CourseInfo {
  id: string;
  code: string;
  title: string;
  hasLab: boolean;
}

interface SchedulePreferences {
  locations: { fairfax: boolean; arlington: boolean; virtual: boolean };
  creditLimits: { min: number; max: number };
  considerSeats: boolean;
  considerRMP: boolean;
  professorsToAvoid: string[];
  availability: Record<DayName, TimeInterval[]>;
}

interface AIScheduleGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: SchedulePreferences;
  setPreferences: React.Dispatch<React.SetStateAction<SchedulePreferences>>;
  onGenerateSchedule: (generatedClasses: ClassSession[]) => void;
  existingClasses?: ClassSession[];
}

interface ProfessorSuggestion {
  name: string;
  qualityRating: string;
  ratingCount: string;
  category: 'Lecture' | 'Laboratory';
}

const getRandomTailwindColor = () => {
  const colors = [
    'bg-red-200',
    'bg-blue-200',
    'bg-green-200',
    'bg-yellow-200',
    'bg-purple-200',
    'bg-pink-200',
    'bg-indigo-200',
    'bg-teal-200',
    'bg-orange-200',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const AIScheduleGenerator: React.FC<AIScheduleGeneratorProps> = ({
  isOpen,
  onClose,
  preferences,
  setPreferences,
  onGenerateSchedule,
  existingClasses = []
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedCourses, setSelectedCourses] = useState<CourseInfo[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [termsLoading, setTermsLoading] = useState<boolean>(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [availableProfessors, setAvailableProfessors] = useState<ProfessorSuggestion[]>([]);

  type Variant = {
    label: string;
    classes: ClassSession[];
  };
  
  const [scheduleVariants, setScheduleVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);

  const parseTime = (t: string): number => {
    // "13:30:00" → 13.5
    const [h, m] = t.split(':').map(Number);
    return h + m/60;
  };
  
  const dayIndex = (dayName: string) =>
    ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
      .indexOf(dayName.trim());
  
  function mapAssignmentListToSessions(list: any[]): ClassSession[] {
    return list.flatMap(item => {
      const {
        id,
        course: {
          MeetingDays,
          startTime,
          endTime,
          CourseSubject,
          CourseNumber,
          CourseTitle,
          CreditHours,
          Instructor,
          MeetingTimes
        }
      } = item;
  
      return MeetingDays.split(',').map((dayStr: string) => ({
        id: `${id}-${dayStr.trim()}`,
        day: dayIndex(dayStr),
        startTime: parseTime(startTime),
        endTime:   parseTime(endTime),
        courseCode: `${CourseSubject} ${CourseNumber}`,
        title: CourseTitle,
        credits: CreditHours,
        location: MeetingTimes,      // or format it however you like
        instructor: Instructor || 'TBD',
        color: getRandomTailwindColor()
      }));
    });
  }

  // Initialize courses from existingClasses
  useEffect(() => {
    if (!isOpen) return;
    if (existingClasses.length === 0) {
      setSelectedCourses([]);
      return;
    }
    const mapped = existingClasses.map(cls => ({
      id: cls.id,
      code: cls.courseCode,
      title: cls.title,
      hasLab: false
    }));
    const unique = mapped.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
    setSelectedCourses(unique);
  }, [isOpen, existingClasses]);

  // Fetch professors
  useEffect(() => {
    if (!isOpen || !selectedTerm || selectedCourses.length === 0) {
      setAvailableProfessors([]);
      return;
    }
    const queries = selectedCourses.map(c => `${selectedTerm}:${c.code}`);
    Promise.all(
      queries.map(q =>
        fetch(
          `${API_BASE_URL}/course-code-professor?TermAndCourseCode=${encodeURIComponent(q)}`
        ).then(r => {
          if (!r.ok) throw new Error();
          return r.json() as Promise<Record<'Lecture' | 'Laboratory', { professor: string; qualityRating: string; ratingCount: string; }[]>>;
        })
      )
    )
      .then(groupObjs => {
        const all: ProfessorSuggestion[] = [];
        groupObjs.forEach(obj => {
          (['Lecture','Laboratory'] as const).forEach(cat => {
            obj[cat]?.forEach(p => all.push({
              name: p.professor,
              qualityRating: p.qualityRating,
              ratingCount: p.ratingCount,
              category: cat
            }));
          });
        });
        setAvailableProfessors(all);
      })
      .catch(() => setAvailableProfessors([]));
  }, [isOpen, selectedTerm, selectedCourses]);

  // Fetch terms
  useEffect(() => {
    if (!isOpen) return;
    setTermsLoading(true);
    fetch(`${API_BASE_URL}/term-list`)
      .then(res => { if (!res.ok) throw new Error(); return res.json() as Promise<string[]>; })
      .then(list => {
        setTerms(list);
        if (list.length) setSelectedTerm(list[0]);
      })
      .catch(() => setTermsError('Could not fetch terms'))
      .finally(() => setTermsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreditLimitsChange = (creditLimits: { min: number; max: number }) =>
    setPreferences(prev => ({ ...prev, creditLimits }));

  const handleCampusPreferencesChange = (locations: { fairfax: boolean; arlington: boolean; virtual: boolean }) =>
    setPreferences(prev => ({ ...prev, locations }));

  const handleAdditionalPreferencesChange = (prefs: { considerSeats: boolean; considerRMP: boolean }) =>
    setPreferences(prev => ({ ...prev, considerSeats: prefs.considerSeats, considerRMP: prefs.considerRMP }));

  const handleAvailabilityChange = (availability: Record<DayName, TimeInterval[]>) =>
    setPreferences(prev => ({ ...prev, availability }));

  // Real schedule‐generation handler
const handleGenerate = async () => {
  setIsGenerating(true);
  try {
    // 1) build payload to match GenerateScheduleCustomModel
    const payload = {
      term: selectedTerm,
      availability: Object.fromEntries(
        Object.entries(preferences.availability ?? {}).map(([day, intervals]) => [
          day,
          { selected: intervals.length > 0, intervals: intervals.map(i => ({ start: i.start, end: i.end })) }
        ])
      ),
      courseCodes: selectedCourses.map(c => c.code),
      locationPreferences: Object.entries(preferences.locations)
        .filter(([, v]) => v)
        .map(([loc]) => loc),
      minCredits: preferences.creditLimits.min,
      maxCredits: preferences.creditLimits.max,
      ignoreSeatAvailability: !preferences.considerSeats,
      considerProfessorRatings: preferences.considerRMP,
      excludedProfessors: preferences.professorsToAvoid
    };

    // 2) POST to your Spring Boot endpoint
    const resp = await fetch(`${API_BASE_URL}/generate-custom-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error('Schedule generation failed');

       const raw = await resp.json() as {
           variantLabel: string;
           schedule: { courseAssignmentList: any[] };
         }[];
      
         // map into our internal shape
         const variants = raw.map(v => ({
           label: v.variantLabel,
           classes: mapAssignmentListToSessions(v.schedule.courseAssignmentList)
         }));
         setScheduleVariants(variants);
  } catch (err) {
    console.error(err);
    // TODO: show an error notification or set an error state
  } finally {
    setIsGenerating(false);
  }
};


return (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
        <h3 className="text-lg font-semibold">AI Schedule Generation</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      {scheduleVariants.length > 0 ? (
        // ==== VARIANT PREVIEW UI ====
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-auto">
          <h4 className="text-lg font-semibold mb-4">Choose a Schedule</h4>
          {scheduleVariants.map((v, i) => (
            <div key={i} className="mb-8">
              <label className="inline-flex items-center mb-2">
                <input
                  type="radio"
                  name="variant"
                  checked={selectedVariant === i}
                  onChange={() => setSelectedVariant(i)}
                  className="mr-2"
                />
                <span className="font-medium">{v.label}</span>
              </label>
              <ScheduleVisualization classes={v.classes} />
            </div>
          ))}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                // go back to preferences
                setScheduleVariants([]);
                setSelectedVariant(null);
              }}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (selectedVariant !== null) {
                  onGenerateSchedule(scheduleVariants[selectedVariant].classes);
                  onClose();
                }
              }}
              disabled={selectedVariant === null}
              className="px-4 py-2 bg-primary-blue text-white rounded disabled:opacity-50"
            >
              Use This Schedule
            </button>
          </div>
        </div>
      ) : (
        // ==== ORIGINAL PREFERENCES UI ====
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-auto">
          {/* Term selector */}
          <div className="mb-4">
            <h5 className="text-sm font-medium mb-2">Term</h5>
            {termsLoading ? (
              <p>Loading terms…</p>
            ) : termsError ? (
              <p className="text-red-500">{termsError}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {terms.map(term => (
                  <button
                    key={term}
                    onClick={() => setSelectedTerm(term)}
                    className={`px-3 py-1 rounded-md border ${
                      selectedTerm === term
                        ? 'bg-primary-blue text-white border-primary-blue'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <CourseSelector
                selectedCourses={selectedCourses}
                onChange={setSelectedCourses}
                selectedTerm={selectedTerm}
              />
              <ProfessorsToAvoidSelector
                suggestions={availableProfessors}
                selectedProfessors={preferences.professorsToAvoid}
                onChange={list => setPreferences(prev => ({ ...prev, professorsToAvoid: list }))}
                disabled={selectedCourses.length === 0}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <CreditLimitsSelector
                creditLimits={preferences.creditLimits}
                onChange={handleCreditLimitsChange}
                selectedCourses={selectedCourses}
                selectedTerm={selectedTerm}
              />
              <CampusPreferencesSelector
                locations={preferences.locations}
                onChange={handleCampusPreferencesChange}
              />
              <AdditionalPreferencesSelector
                preferences={{
                  considerSeats: preferences.considerSeats,
                  considerRMP: preferences.considerRMP
                }}
                onChange={handleAdditionalPreferencesChange}
              />
            </div>
          </div>

          {/* Availability Section */}
          <div className="mt-6">
            <WeekAvailability
              selectedAvailability={preferences.availability}
              onChange={handleAvailabilityChange}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      {scheduleVariants.length === 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`px-4 py-2 ${
              isGenerating ? 'bg-gray-400' : 'bg-primary-blue hover:bg-blue-600'
            } text-white rounded flex items-center`}
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating…
              </>
            ) : (
              'Generate Schedules'
            )}
          </button>
        </div>
      )}
    </div>
  </div>
);

};

export default AIScheduleGenerator;
