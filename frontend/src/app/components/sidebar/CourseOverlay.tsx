"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CourseOverlayProps, CourseDetails, SectionInfo } from './types';
import type { ClassSession } from '../SemesterCalendar';
import { getRandomColor } from '../SemesterCalendar';


const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v2/schedule-builder`;

export default function CourseOverlay({
  courseCode,
  position,
  onClose,
  onAddSessions,
}: CourseOverlayProps) {
  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState<'summary' | 'add'>('summary');

  // --- COURSE SUMMARY STATES ---
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState<CourseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- ADD-CLASS STATES ---
  const [terms, setTerms] = useState<string[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>('');

  const [codeData, setCodeData] = useState<SectionInfo[]>([]);
  const [codeDataLoading, setCodeDataLoading] = useState(false);
  const [codeDataError, setCodeDataError] = useState<string | null>(null);

  // Normalize professors array to avoid undefined
  const professors = courseData?.professors ?? [];

  // --- Fetch Course Details ---
  useEffect(() => {
    if (activeTab !== 'summary') return;
    const fetchCourseDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/courses/${courseCode}`);
        if (!res.ok) throw new Error('Failed to fetch course data');
        const data: CourseDetails = await res.json();
        setCourseData(data);
      } catch (e) {
        console.error(e);
        setError('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetails();
  }, [courseCode, activeTab]);

  useEffect(() => {
    if (activeTab !== 'add') return;
    setTermsLoading(true);
    setTermsError(null);
  
    fetch(`${API_BASE_URL}/term-list`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch term list');
        return res.json() as Promise<string[]>;
      })
      .then((termsData) => {
        setTerms(termsData);
      })
      .catch(err => {
        console.error(err);
        setTermsError('Failed to load term list');
      })
      .finally(() => {
        setTermsLoading(false);
      });
  }, [activeTab]);

  // --- Compute Most Common Grade & Review Count ---
  useEffect(() => {
    if (professors.length === 0) return;
    const gradesCount: Record<string, number> = {};
    let totalReviews = 0;
    professors.forEach((prof) => {
      const reviews = prof.reviews ?? [];
      reviews.forEach((review) => {
        if (review.grade) gradesCount[review.grade] = (gradesCount[review.grade] || 0) + 1;
        totalReviews++;
      });
    });
    let mostCommonGrade = 'N/A';
    let maxCount = 0;
    Object.entries(gradesCount).forEach(([grade, count]) => {
      if (count > maxCount) {
        mostCommonGrade = grade;
        maxCount = count;
      }
    });
    setCourseData((prev) => prev && ({ ...prev, mostCommonGrade, totalReviews }));
  }, [professors]);

  // --- Helper Functions ---
  const parseTimeToDecimal = (t: string) => {
    const [time, meridiem] = t.split(' ');
    let [hh, mm] = time.split(':').map(Number);
    if (meridiem === 'PM' && hh < 12) hh += 12;
    if (meridiem === 'AM' && hh === 12) hh = 0;
    return hh + mm / 60;
  };
  const dayIndexMap: Record<string, number> = {
    Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4,
  };



  const handleSectionClick = (item: SectionInfo) => {
    const sessions: ClassSession[] = [];
    const days = item.MeetingDays.split(',').map((d) => d.trim());
    const [start, end] = item.MeetingTimes.split(' - ').map((s) => s.trim());
    days.forEach((dayName) => {
      const day = dayIndexMap[dayName];
      if (day == null) return;
      sessions.push({
        id: `${item.CourseNumber}-${item.CourseSection}-${day}`,
        courseCode: `${item.CourseSubject} ${item.CourseNumber}`,
        title: item.CourseTitle,
        day,
        startTime: parseTimeToDecimal(start),
        endTime: parseTimeToDecimal(end),
        location: item.Campus,
        instructor: item.Instructor,
        color: getRandomColor(),
        credits: Number(item.CreditHours),
      });
    });
    onAddSessions(sessions);
    onClose();
  };

  // --- Positioning & Outside Click ---
  const adjustPosition = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = position.x, y = position.y;
    const offsetY = 10, width = 400, height = 400; // Increased height estimate for more accurate positioning
    
    // Horizontal positioning
    if (x + width/2 > vw) x = vw - width/2 - 10;
    if (x - width/2 < 0) x = width/2 + 10;
    
    // Vertical positioning - improved logic to prevent bleeding off top
    const spaceAbove = y - height - offsetY;
    const spaceBelow = vh - y - offsetY;
    
    // If there's not enough space above (including a 60px safety margin for tabs), position below
    if (spaceAbove < 60) {
      return { 
        top: `${y + offsetY}px`, 
        left: `${x}px`, 
        transform: 'translate(-50%, 0)' 
      };
    } else {
      return { 
        top: `${y - offsetY}px`, 
        left: `${x}px`, 
        transform: 'translate(-50%, -100%)' 
      };
    }
  };
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.course-overlay') && !t.closest('.course-chip')) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', 
    zIndex: 9999, 
    maxWidth: '400px', 
    width: '100%',
    maxHeight: '80vh', // Prevent modal from being taller than 80% of viewport
    overflow: 'hidden', // Prevent content overflow
    ...adjustPosition(),
  };

  // --- Render ---
  return (
    <div className="course-overlay bg-white rounded-lg shadow-xl border border-gray-200" style={overlayStyle}>
      {/* Tabs with close button */}
      <div className="flex border-b items-center">
        <button onClick={() => setActiveTab('summary')} className={`flex-1 py-2 ${activeTab==='summary'? 'font-bold border-b-2 border-primary-blue':''}`}>Summary</button>
        <button onClick={() => setActiveTab('add')} className={`flex-1 py-2 ${activeTab==='add'? 'font-bold border-b-2 border-primary-blue':''}`}>Add Class</button>
        <button 
          className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {activeTab === 'summary' ? (
        loading ? (
          <div className="p-4 animate-pulse">Loading…</div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : courseData ? (
          <>
            {/* Header with course code and grade */}
            <div className="flex justify-between items-center bg-primary-blue/5 p-4 border-b border-primary-blue/10">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{courseData.course_code}</h3>
                <p className="text-gray-600 text-sm">{courseData.credits} credits</p>
              </div>
              {courseData.mostCommonGrade && courseData.mostCommonGrade !== 'N/A' && (
                <div className="bg-primary-blue text-white text-2xl font-bold px-4 py-2 rounded-lg">
                  {courseData.mostCommonGrade}
                </div>
              )}
            </div>

            {/* Course details - scrollable content */}
            <div className="p-4 overflow-y-auto max-h-60">
              <h4 className="font-medium text-base mb-2">{courseData.title}</h4>
              {courseData.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {courseData.description}
                </p>
              )}

              {/* Professors preview */}
              {professors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Top Professors:</p>
                  <div className="space-y-1">
                    {professors.slice(0, 2).map((prof, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm">{prof.firstName} {prof.lastName}</span>
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span className="text-sm font-medium">{prof.avgRating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with link to full page - fixed at bottom */}
            <div className="p-4 pt-2 border-t border-gray-100 bg-white">
              <div className="flex justify-between items-center">
                {courseData.totalReviews !== undefined && (
                  <span className="text-xs text-gray-500">
                    {courseData.totalReviews} {courseData.totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                )}
                <Link
                  href={`/courses/${encodeURIComponent(courseData.course_code)}`}
                  className="text-primary-blue hover:text-blue-700 text-sm font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 text-gray-500">No data available</div>
        )
      ) : (
        <div className="p-4 space-y-4">
          {termsLoading ? (
            <p>Loading terms…</p>
          ) : termsError ? (
            <p className="text-red-500">{termsError}</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Select a term:</p>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {terms.map(term => (
                  <button
                    key={term}
                    onClick={() => {
                      setSelectedTerm(term);
                      // Auto-load sections when term is selected
                      if (term) {
                        setCodeDataLoading(true);
                        setCodeDataError(null);
                        fetch(
                          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v2/schedule-builder/get-course-code-data` +
                          `?Term=${encodeURIComponent(term)}` +
                          `&CourseCode=${encodeURIComponent(courseCode)}`
                        )
                        .then(resp => {
                          if (!resp.ok) throw new Error(resp.statusText);
                          return resp.json();
                        })
                        .then((data: SectionInfo[]) => {
                          setCodeData(data);
                        })
                        .catch(e => {
                          console.error(e);
                          setCodeDataError('Failed to load course code data');
                        })
                        .finally(() => {
                          setCodeDataLoading(false);
                        });
                      }
                    }}
                    disabled={codeDataLoading}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedTerm === term
                        ? 'bg-primary-blue text-white shadow-sm'
                        : codeDataLoading 
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {codeDataLoading && selectedTerm === term ? 'Loading...' : term}
                  </button>
                ))}
              </div>
            </div>
          )}
          {codeDataError && <p className="text-red-500 text-sm mt-2">{codeDataError}</p>}    
          {/* Sections list or empty state */}
          {selectedTerm && !codeDataLoading && !codeDataError && (
            <div className="max-h-48 overflow-y-auto border-t pt-2">
              {codeData.length > 0 ? (
                codeData.map((item,i) => (
                  <div key={i} onClick={() => handleSectionClick(item)} className="cursor-pointer py-2 px-3 hover:bg-gray-100 border-b last:border-none">
                    <div className="font-medium">{`${item.CourseSubject} ${item.CourseNumber}-${item.CourseSection}`}</div>
                    <div className="text-sm text-gray-600">{item.MeetingDays} @ {item.MeetingTimes}</div>
                  </div>
                ))
              ) : (
                <div className="py-8 px-4 text-center">
                  <p className="text-gray-500 text-sm font-medium mb-1">No sections available</p>
                  <p className="text-gray-400 text-xs">
                    {courseCode} is not offered in {selectedTerm}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
