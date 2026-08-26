"use client";

import React, { useState, useEffect } from 'react';
import CourseSelector from './selectors/CourseSelector';
import CreditLimitsSelector from './selectors/CreditLimitsSelector';
import CampusPreferencesSelector from './selectors/CampusPreferencesSelector';
import AdditionalPreferencesSelector from './selectors/AdditionalPreferencesSelector';
import WeekAvailability, { TimeInterval, DayName } from './selectors/WeekAvailability';
import ScheduleVisualization from './selectors/ScheduleVisualization';
import { displayCatalogTerm, pickDefaultCatalogTerm, sortCatalogTerms } from '@/utils/academicTerms';


// API configuration
const API_BASE_URL = `/api/v2/schedule-builder`;

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

  type Variant = {
    label: string;
    classes: ClassSession[];
  };
  
  const [scheduleVariants, setScheduleVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const parseTime = (t: string): number => {
    // "13:30:00" → 13.5
    const [h, m] = String(t).split(':').map(Number);
    return h + m/60;
  };
  
  const dayIndex = (dayName: string) =>
    ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
      .indexOf(dayName.trim());
  
  function mapAssignmentListToSessions(list: any[]): ClassSession[] {
    if (!Array.isArray(list)) return [];
    return list.flatMap(item => {
      const course = item?.course;
      if (!course) return [];
      const MeetingDays = course.MeetingDays;
      if (!MeetingDays || typeof MeetingDays !== 'string') return [];
      const startTime = course.startTime;
      const endTime = course.endTime;
      if (startTime == null || endTime == null) return [];

      return MeetingDays.split(',').map((dayStr: string) => ({
        id: `${item.id}-${dayStr.trim()}`,
        day: dayIndex(dayStr),
        startTime: parseTime(startTime),
        endTime: parseTime(endTime),
        courseCode: `${course.CourseSubject} ${course.CourseNumber}`,
        title: course.CourseTitle,
        credits: Number(course.CreditHours) || 0,
        location: course.Campus || course.MeetingTimes || '',
        instructor: course.Instructor || 'TBD',
        color: getRandomTailwindColor()
      }));
    });
  }

  // Seed from the calendar only when the modal opens, so adding courses isn't wiped.
  useEffect(() => {
    if (!isOpen) return;
    setGenerateError(null);
    setScheduleVariants([]);
    setSelectedVariant(null);
    if (existingClasses.length === 0) {
      setSelectedCourses([]);
      return;
    }
    const mapped = existingClasses.map(cls => ({
      id: cls.courseCode,
      code: cls.courseCode,
      title: cls.title,
      hasLab: false
    }));
    const unique = mapped.filter((c, i, arr) => arr.findIndex(x => x.code === c.code) === i);
    setSelectedCourses(unique);
  }, [isOpen]);

  // Fetch terms
  useEffect(() => {
    if (!isOpen) return;
    setTermsLoading(true);
    fetch(`${API_BASE_URL}/term-list`)
      .then(res => { if (!res.ok) throw new Error(); return res.json() as Promise<string[]>; })
      .then(list => {
        const sorted = sortCatalogTerms(list);
        setTerms(sorted);
        setSelectedTerm(prev => prev && sorted.includes(prev) ? prev : pickDefaultCatalogTerm(sorted));
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

const handleGenerate = async () => {
  if (!selectedCourses.length) {
    setGenerateError('Add at least one course before generating a schedule.');
    return;
  }
  if (!selectedTerm) {
    setGenerateError('Pick a term before generating a schedule.');
    return;
  }
  setIsGenerating(true);
  setGenerateError(null);
  try {
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
      considerProfessorRatings: preferences.considerRMP
    };

    const resp = await fetch(`${API_BASE_URL}/generate-custom-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const raw = await resp.json();
    if (!resp.ok) {
      throw new Error(raw?.error || 'Schedule generation failed');
    }
    if (!Array.isArray(raw)) {
      throw new Error('Unexpected response from the scheduler.');
    }

    const variants = raw.map((v: { variantLabel: string; schedule: { courseAssignmentList: any[] } }) => ({
      label: v.variantLabel,
      classes: mapAssignmentListToSessions(v.schedule?.courseAssignmentList)
    }));
    const usable = variants.filter(v => v.classes.length > 0);
    if (!usable.length) {
      throw new Error('The solver returned empty calendars. Try another term, add another campus, or turn off seat limits.');
    }
    setScheduleVariants(usable);
  } catch (err) {
    console.error(err);
    setGenerateError(err instanceof Error ? err.message : 'Schedule generation failed');
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
      {/* ==== VARIANT PREVIEW UI ==== */}
<div
  className={`px-6 py-4 max-h-[calc(100vh-200px)] overflow-auto ${
    scheduleVariants.length > 0 ? '' : 'hidden'
  }`}
>
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
        setScheduleVariants([]);
        setSelectedVariant(null);
        setSelectedCourses([]);  // ← wipe out all selected courses
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

{/* ==== ORIGINAL PREFERENCES UI ==== */}
<div
  className={`px-6 py-4 max-h-[calc(100vh-200px)] overflow-auto ${
    scheduleVariants.length === 0 ? '' : 'hidden'
  }`}
>
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
            {displayCatalogTerm(term, terms)}
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

{/* ==== FOOTER ==== */}
<div
  className={`px-6 py-3 bg-gray-50 border-t border-gray-200 ${
    scheduleVariants.length === 0 ? '' : 'hidden'
  }`}
>
  {generateError && (
    <p className="text-sm text-red-600 mb-2">{generateError}</p>
  )}
  <div className="flex justify-end">
  <button
    onClick={handleGenerate}
    disabled={isGenerating || selectedCourses.length === 0}
    className={`px-4 py-2 ${
      isGenerating || selectedCourses.length === 0 ? 'bg-gray-400' : 'bg-primary-blue hover:bg-blue-600'
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
</div>

  
    </div>
  </div>
);

};

export default AIScheduleGenerator;
