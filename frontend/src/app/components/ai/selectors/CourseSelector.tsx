"use client";

import React, { useEffect, useState } from 'react';

// API configuration for lookup
const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v2/schedule-builder`;

export interface CourseInfo {
  id: string;
  code: string;
  title: string;
  hasLab: boolean;
}

interface CourseAmount {
  Lecture: { courses: number; credits: string };
  Laboratory: { courses: number; credits: string };
}

interface CourseSelectorProps {
  selectedCourses: CourseInfo[];
  onChange: (courses: CourseInfo[]) => void;
  selectedTerm: string;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({
  selectedCourses,
  onChange,
  selectedTerm
}) => {
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CourseInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Map course.id → credit/amount data
  const [courseDetailsMap, setCourseDetailsMap] = useState<
    Record<string, CourseAmount>
  >({});

  // 1) Debounced course‐lookup
  useEffect(() => {
    if (courseSearchTerm.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    const handle = setTimeout(async () => {
      try {
        const resp = await fetch(
          `${API_BASE_URL}/course-lookup?PartialCourseCode=${encodeURIComponent(
            courseSearchTerm.trim()
          )}`
        );
        if (!resp.ok) throw new Error('Lookup failed');
        const codes: string[] = await resp.json();
        setSearchResults(
          codes.map(c => {
            const [codePart, labPart] = c.split(' - Lab: ');
            return {
              id: c,
              code: codePart,
              title: codePart,
              hasLab: labPart === 'true'
            };
          })
        );
      } catch {
        setSearchError('Lookup error');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [courseSearchTerm]);

  // 2) Whenever selectedCourses or selectedTerm changes, fetch credit/amount
  useEffect(() => {
    selectedCourses.forEach(course => {
      // Only fetch once per course
      if (!courseDetailsMap[course.id]) {
        const param = `${selectedTerm}:${course.code}`;
        fetch(
          `${API_BASE_URL}/credit-course-amount?TermAndCourseCode=${encodeURIComponent(
            param
          )}`
        )
          .then(res => {
            if (!res.ok) throw new Error('Credit lookup failed');
            return res.json() as Promise<CourseAmount>;
          })
          .then(data => {
            setCourseDetailsMap(prev => ({
              ...prev,
              [course.id]: data
            }));
          })
          .catch(() => {
            // on error, you could set a placeholder or leave undefined
          });
      }
    });
  }, [selectedCourses, selectedTerm, courseDetailsMap]);

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        Classes You Want
      </h4>
      <div className="relative">
        <input
          type="text"
          value={courseSearchTerm}
          onChange={e => setCourseSearchTerm(e.target.value)}
          placeholder="Type course code..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-blue"
        />

        {courseSearchTerm.trim().length >= 3 && (
          <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-48 overflow-y-auto">
            {isSearching ? (
              <div className="flex justify-center items-center p-4">
                <svg
                  className="animate-spin h-5 w-5 text-primary-blue"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : searchError ? (
              <div className="p-3 text-sm text-red-500 text-center">
                {searchError}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                No courses found
              </div>
            ) : (
              searchResults.map(course => {
                const already = selectedCourses.some(c => c.id === course.id);
                return (
                  <div
                    key={course.id}
                    className={`px-3 py-2 border-b last:border-none flex justify-between items-center ${
                      already
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-blue-50 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!already) {
                        onChange([...selectedCourses, course]);
                        setCourseSearchTerm('');
                        setSearchResults([]);
                      }
                    }}
                  >
                    <div>
                      <span className="font-medium text-primary-blue">
                        {course.code}
                      </span>
                      <div className="text-xs text-gray-500">
                        Has Lab: {course.hasLab ? 'Yes' : 'No'}
                      </div>
                    </div>
                    {already && (
                      <span className="text-gray-400 text-sm">Added</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {selectedCourses.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          {selectedCourses.map(course => {
            const details = courseDetailsMap[course.id];
            return (
              <div
                key={course.id}
                className="bg-green-50 border border-green-200 px-3 py-2 rounded-md"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{course.code}</span>
                  <button
                    onClick={() =>
                      onChange(
                        selectedCourses.filter(c => c.id !== course.id)
                      )
                    }
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>

                {details?.Lecture && details?.Laboratory ? (
                <div className="mt-1 text-sm text-gray-700 space-y-1">
                  <div>
                    <strong>Lecture:</strong> {details.Lecture.courses} course
                    {details.Lecture.courses !== 1 && 's'} – {details.Lecture.credits} credits
                  </div>
                  <div>
                    <strong>Lab:</strong> {details.Laboratory.courses} course
                    {details.Laboratory.courses !== 1 && 's'} – {details.Laboratory.credits} credits
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-sm text-gray-500">Loading credits…</div>
              )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseSelector;
