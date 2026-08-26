"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CourseOverlayProps, CourseDetails, SectionInfo } from './types';
import type { ClassSession } from '../SemesterCalendar';
import { getRandomColor } from '../SemesterCalendar';
import { displayCatalogTerm } from '@/utils/academicTerms';


const API_BASE_URL = `/api/v2/schedule-builder`;

export default function CourseOverlay({
  courseCode,
  position,
  onClose,
  onAddSessions,
  currentSemester,
  availableDays,
  dayTimeRanges,
}: CourseOverlayProps) {
  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState<'summary' | 'add'>('summary');

  // --- COURSE SUMMARY STATES ---
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState<CourseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- ADD-CLASS STATES ---
  const [codeData, setCodeData] = useState<SectionInfo[]>([]);
  const [codeDataLoading, setCodeDataLoading] = useState(false);
  const [codeDataError, setCodeDataError] = useState<string | null>(null);
  const semesterLabel = currentSemester ? displayCatalogTerm(currentSemester) : '';

  // Normalize professors array to avoid undefined
  const professors = courseData?.professors ?? [];

  // --- Fetch Course Details ---
  useEffect(() => {
    if (activeTab !== 'summary') return;
    const fetchCourseDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/${encodeURIComponent(courseCode)}`);
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

  // Auto-load sections when switching to Add Class tab and currentSemester is available
  useEffect(() => {
    if (activeTab !== 'add' || !currentSemester) return;
    
    setCodeDataLoading(true);
    setCodeDataError(null);
    fetch(
      `${API_BASE_URL}/get-course-code-data` +
      `?Term=${encodeURIComponent(currentSemester)}` +
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
  }, [activeTab, currentSemester, courseCode]);

  // --- Compute Most Common Grade & Review Count ---
  const computeGradeStats = () => {
    if (professors.length === 0) return { mostCommonGrade: 'N/A', totalReviews: 0 };
    
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
    
    return { mostCommonGrade, totalReviews };
  };

  const { mostCommonGrade, totalReviews } = computeGradeStats();

  // --- Helper Functions ---
  const parseTimeToDecimal = (t: string | undefined | null) => {
    if (!t || typeof t !== 'string') return 0;
    
    try {
      const [time, meridiem] = t.split(' ');
      if (!time || !meridiem) return 0;
      
      let [hh, mm] = time.split(':').map(Number);
      if (isNaN(hh) || isNaN(mm)) return 0;
      
      if (meridiem === 'PM' && hh < 12) hh += 12;
      if (meridiem === 'AM' && hh === 12) hh = 0;
      return hh + mm / 60;
    } catch (error) {
      console.error('Error parsing time:', t, error);
      return 0;
    }
  };
  const dayIndexMap: Record<string, number> = {
    Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4,
  };

  // Helper function to check if a section conflicts with user's time availability
  const checkTimeConflict = (section: SectionInfo): boolean => {
    if (!availableDays || !dayTimeRanges || !section.MeetingDays || !section.MeetingTimes) {
      return false;
    }

    try {
      const days = section.MeetingDays.split(',').map(d => d.trim());
      const timeParts = section.MeetingTimes.split(' - ').map(t => t.trim());
      
      if (timeParts.length !== 2) {
        console.error('Invalid meeting times format in checkTimeConflict:', section.MeetingTimes);
        return false;
      }
      
      const [startTime, endTime] = timeParts;
      const sectionStart = parseTimeToDecimal(startTime);
      const sectionEnd = parseTimeToDecimal(endTime);

      // Check each day the section meets
      for (const dayName of days) {
        const dayIndex = dayIndexMap[dayName];
        if (dayIndex == null) continue;

        // If this day is not available for the user, it's a conflict
        if (!availableDays[dayIndex]) {
          return true;
        }

        // Check if section time conflicts with user's available time range for this day
        const userDayRange = dayTimeRanges[dayIndex];
        if (sectionStart < userDayRange.start || sectionEnd > userDayRange.end) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error parsing section time:', error);
      return false;
    }
  };



  const handleSectionClick = (item: SectionInfo) => {
    // Check if this section has time conflicts
    if (checkTimeConflict(item)) {
      return; // Don't add conflicting sections
    }

    // Validate required data
    if (!item.MeetingDays || !item.MeetingTimes) {
      console.error('Invalid section data:', item);
      return;
    }

    const sessions: ClassSession[] = [];
    const days = item.MeetingDays.split(',').map((d) => d.trim());
    const timeParts = item.MeetingTimes.split(' - ').map((s) => s.trim());
    
    if (timeParts.length !== 2) {
      console.error('Invalid meeting times format:', item.MeetingTimes);
      return;
    }
    
    const [start, end] = timeParts;
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
    // Pass the current semester along with the sessions
    onAddSessions(sessions, currentSemester);
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
      
      // Don't close if clicking on the overlay itself or course chips
      if (t.closest('.course-overlay') || t.closest('.course-chip')) return;
      
      // Don't close if clicking on time availability controls
      if (t.closest('.time-dropdown-container')) return;
      
      // Don't close if clicking on day toggle buttons or filter controls
      if (t.closest('[data-day-toggle]') || 
          t.closest('[data-filter-control]') || 
          t.closest('[data-semester-nav]')) return;
      
      // Don't close if clicking on any specific filter controls
      if (t.closest('button[title*="Set time"]') || // Time selector buttons
          t.closest('select') || // Any select dropdowns in filters
          t.closest('.react-select-container')) return; // React-select components
      
      onClose();
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
              {mostCommonGrade && mostCommonGrade !== 'N/A' && (
                <div className="bg-primary-blue text-white text-2xl font-bold px-4 py-2 rounded-lg">
                  {mostCommonGrade}
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
                {totalReviews > 0 && (
                  <span className="text-xs text-gray-500">
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
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
          {!currentSemester ? (
            <p className="text-gray-500">No semester selected</p>
          ) : codeDataLoading ? (
            <p>Loading sections for {semesterLabel}...</p>
          ) : codeDataError ? (
            <p className="text-red-500 text-sm">{codeDataError}</p>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-2">
                Showing sections for <span className="font-medium">{semesterLabel}</span>
              </div>
              
              {/* Sections list or empty state */}
              <div className="max-h-64 overflow-y-auto border-t pt-2">
                {codeData.length > 0 ? (
                  codeData.map((item,i) => {
                    const hasConflict = checkTimeConflict(item);
                    return (
                      <div 
                        key={i} 
                        onClick={() => handleSectionClick(item)} 
                        className={`py-2 px-3 border-b last:border-none transition-colors ${
                          hasConflict 
                            ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                            : 'cursor-pointer hover:bg-gray-100'
                        }`}
                      >
                        <div className={`font-medium ${hasConflict ? 'text-gray-500' : ''}`}>
                          {`${item.CourseSubject} ${item.CourseNumber}-${item.CourseSection}`}
                          {hasConflict && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                              Time Conflict
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${hasConflict ? 'text-gray-500' : 'text-gray-600'}`}>
                          {item.MeetingDays || 'TBA'} @ {item.MeetingTimes || 'TBA'}
                        </div>
                        <div className={`text-xs mt-1 ${hasConflict ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.Instructor}
                        </div>
                        {hasConflict && (
                          <div className="text-xs text-gray-500 mt-1">
                            Conflicts with your available time
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 px-4 text-center">
                    <p className="text-gray-500 text-sm font-medium mb-1">No sections available</p>
                    <p className="text-gray-400 text-xs">
                      {courseCode} is not offered in {semesterLabel}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
