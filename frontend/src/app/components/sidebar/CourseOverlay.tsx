"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CourseOverlayProps, CourseDetails, SectionInfo } from './types';
import type { ClassSession } from '../SemesterCalendar';
import { getRandomColor } from '../SemesterCalendar';

const CourseOverlay: React.FC<CourseOverlayProps> = ({
  courseCode,
  position,
  onClose,
  onAddSessions,
}) => {

<<<<<<< Updated upstream
const CourseOverlay: React.FC<CourseOverlayProps> = ({ courseCode, onClose, position }) => {
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
=======
  // --- TABS ---
  const [activeTab, setActiveTab] = useState<'summary' | 'add'>('add');

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

  // Fetch course details when switching into summary
>>>>>>> Stashed changes
  useEffect(() => {
    async function fetchCourseDetails() {
      try {
        setLoading(true);
        const response = await fetch(`http://127.0.0.1:8000/courses/${courseCode}`);
        if (!response.ok) {
          throw new Error("Failed to fetch course data");
        }
        const data = await response.json();
        setCourseData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError("Failed to load course details");
        setLoading(false);
      }
    }
<<<<<<< Updated upstream
    
    fetchCourseDetails();
  }, [courseCode]);
  
  // Calculate total reviews and most common grade if available
=======

    setCourseData(prev =>
      prev && ({ ...prev, mostCommonGrade: mcg, totalReviews: total })
    );
  }, [courseData?.professors]);

  const professors = courseData?.professors ?? [];

  const parseTimeToDecimal = (t: string) => {
    // e.g. "01:30 PM" → 13.5
    const [time, meridiem] = t.split(' ');
    let [hh, mm] = time.split(':').map(Number);
    if (meridiem === 'PM' && hh < 12) hh += 12;
    if (meridiem === 'AM' && hh === 12) hh = 0;
    return hh + mm/60;
  };
  
  const dayIndexMap: Record<string,number> = {
    Monday: 0, Tuesday: 1, Wednesday: 2,
    Thursday: 3, Friday: 4
  };

  const fetchAndAdd = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v2/schedule-builder/get-course-code-data`
      + `?Term=${encodeURIComponent(selectedTerm)}`
      + `&CourseCode=${encodeURIComponent(courseCode)}`
      );
      if (!resp.ok) throw new Error(resp.statusText);
      const data = await resp.json() as Array<{
        CourseTitle: string;
        CourseSubject: string;
        CourseNumber: string;
        CourseSection: string;
        CreditHours: string;
        CRN: string;
        MeetingDays: string;
        MeetingTimes: string;
        Campus: string;
        Instructor: string;
      }>;
  
      // flatten into ClassSession[]
      const sessions: ClassSession[] = [];
      data.forEach(item => {
        const days = item.MeetingDays.split(',').map(d => d.trim());
        const [start, end] = item.MeetingTimes.split(' - ').map(s => s.trim());
        days.forEach(dayName => {
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
            color: getRandomColor(),     // import or re-use your existing getRandomColor()
            credits: Number(item.CreditHours),
          });
        });
      });
  
      onAddSessions(sessions);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };
  

  // Fetch term list on mount
>>>>>>> Stashed changes
  useEffect(() => {
    if (courseData?.professors) {
      // Calculate most common grade
      const grades: Record<string, number> = {};
      let totalReviews = 0;
      
      courseData.professors.forEach(professor => {
        if (professor.reviews) {
          professor.reviews.forEach((review) => {
            if (review.grade) {
              grades[review.grade] = (grades[review.grade] || 0) + 1;
            }
            totalReviews++;
          });
        }
      });
<<<<<<< Updated upstream
      
      let mostCommonGrade = "N/A";
      let maxCount = 0;
      
      Object.entries(grades).forEach(([grade, count]) => {
        if (count > maxCount) {
          mostCommonGrade = grade;
          maxCount = count;
        }
=======

    return () => { cancelled = true; };
  }, []);


  const handleSectionClick = (item: typeof codeData[0]) => {
    const sessions: ClassSession[] = [];
    // split out each meeting day, parse times:
    const days = item.MeetingDays.split(',').map(d => d.trim());
    const [start, end] = item.MeetingTimes.split(' - ').map(s => s.trim());
  
    days.forEach(dayName => {
      const day = dayIndexMap[dayName];
      if (day == null) return;
      sessions.push({
        id:      `${item.CourseNumber}-${item.CourseSection}-${day}`,
        courseCode: `${item.CourseSubject} ${item.CourseNumber}`,
        title:   item.CourseTitle,
        day,
        startTime: parseTimeToDecimal(start),
        endTime:   parseTimeToDecimal(end),
        location:  item.Campus,
        instructor: item.Instructor,
        color:     getRandomColor(),
        credits:   Number(item.CreditHours),
      });
    });
  
    onAddSessions(sessions);
    onClose();
  };

  // Handler for Get Data button
  const fetchCourseCodeData = () => {
    if (!selectedTerm) return;
    setCodeDataLoading(true);
    setCodeDataError(null);
    setCodeData([]);

    const url =
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v2/schedule-builder/get-course-code-data` +
      `?Term=${encodeURIComponent(selectedTerm)}` +
      `&CourseCode=${encodeURIComponent(courseCode)}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch course-code-data');
        return res.json(); // expecting JSON array
      })
      .then((data: any[]) => {
        setCodeData(data);
      })
      .catch(() => {
        setCodeDataError('Failed to load course code data');
      })
      .finally(() => {
        setCodeDataLoading(false);
>>>>>>> Stashed changes
      });
      
      setCourseData(prev => ({
        ...prev!,
        mostCommonGrade,
        totalReviews
      }));
    }
  }, [courseData?.professors]);
  
  // Calculate adjusted overlay position to ensure it stays within viewport
  const adjustPosition = () => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate initial position
    let x = position.x;
    let y = position.y;
    
    // Default offset values
    const offsetY = 10;
    const width = 400; // max width of overlay
    const height = 300; // estimated height of overlay
    
    // Adjust horizontal position if it would extend beyond right edge
    if (x + width/2 > viewportWidth) {
      x = viewportWidth - width/2 - 10; // 10px padding from right edge
    }
    
    // Adjust horizontal position if it would extend beyond left edge
    if (x - width/2 < 0) {
      x = width/2 + 10; // 10px padding from left edge
    }
    
    // Adjust vertical position based on available space
    // If not enough space above, show below the element
    if (y - height < 20) { // 20px minimum from top of viewport
      return {
        top: `${y + offsetY}px`,
        left: `${x}px`,
        transform: 'translate(-50%, 0)',
        marginTop: '0',
      };
    } else {
      // Default: show above the element
      return {
        top: `${y}px`,
        left: `${x}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: `-${offsetY}px`,
      };
    }
  };
  
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    maxWidth: '400px',
    width: '100%',
    ...adjustPosition()
  };
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.course-overlay') && !target.closest('.course-chip')) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  return (
    <div 
      className="course-overlay bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={overlayStyle}
    >
      <div className="relative">
        <button 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : courseData ? (
          <div>
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
            
            {/* Course details */}
            <div className="p-4">
              <h4 className="font-medium text-base mb-2">{courseData.title}</h4>
              
              {courseData.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {courseData.description}
                </p>
              )}
              
              {/* Professors preview */}
              {courseData.professors && courseData.professors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Top Professors:</p>
                  <div className="space-y-1">
                    {courseData.professors.slice(0, 2).map((prof, idx) => (
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
              
              {/* Footer with link to full page */}
              <div className="mt-4 flex justify-between items-center pt-2 border-t border-gray-100">
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
          </div>
        ) : (
          <div className="p-4 text-gray-500">No course data available</div>
<<<<<<< Updated upstream
        )}
      </div>
=======
        )
      ) : (
        // --- ADD CLASS TAB ---
        <div className="p-4 space-y-4">
          {termsLoading ? (
            <p>Loading terms…</p>
          ) : termsError ? (
            <p className="text-red-500">{termsError}</p>
          ) : (
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Select a term</option>
              {terms.map(term => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          )}

        <button
          onClick={fetchCourseCodeData}
          disabled={termsLoading}
          className="px-4 py-2 bg-primary-blue text-white rounded"
        >
          {loading ? 'Adding…' : 'Add Class'}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}

          {codeDataLoading && <p>Loading data…</p>}
          {codeDataError && <p className="text-red-500">{codeDataError}</p>}

          {codeData.length > 0 && (
            <div className="max-h-48 overflow-y-auto border-t pt-2">
              {codeData.map((row, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSectionClick(row)}
                  className="cursor-pointer py-2 px-3 hover:bg-gray-100 border-b last:border-none"
                >
                  <div className="font-medium text-gray-900">
                    {`${row.CourseSubject} ${row.CourseNumber}-${row.CourseSection}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {row.MeetingDays} @ {row.MeetingTimes}
                  </div>
                  <div className="text-sm text-gray-600">
                    {row.Seats}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
>>>>>>> Stashed changes
    </div>
  );
};

export default CourseOverlay; 