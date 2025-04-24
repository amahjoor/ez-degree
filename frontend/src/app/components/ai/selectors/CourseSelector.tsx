"use client";

import React, { useState } from 'react';

// API configuration
const API_BASE_URL = '/api';

interface CourseInfo {
  id: string;
  code: string;
  title: string;
}

interface CourseSelectorProps {
  selectedCourses: CourseInfo[];
  onChange: (courses: CourseInfo[]) => void;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({
  selectedCourses,
  onChange
}) => {
  // State for course search
  const [courseSearchTerm, setCourseSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<CourseInfo[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
        Classes You Want
        <div className="relative ml-1 group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute left-0 -bottom-1 transform translate-y-full w-64 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
            The AI will prioritize these courses and fill remaining credits with suggested courses based on your requirements.
          </div>
        </div>
      </h4>
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={courseSearchTerm}
            onChange={(e) => {
              setCourseSearchTerm(e.target.value);
              // Search with debounce
              const searchValue = e.target.value.trim();
              if (searchValue.length > 2) {
                setIsSearching(true);
                setSearchError(null);
                
                // Use the same API as CourseSelectionModal
                const fetchCourses = async () => {
                  try {
                    // Construct URL with search parameters
                    let url = `${API_BASE_URL}/courses/?limit=20`;
                    
                    if (searchValue) {
                      url += `&search=${encodeURIComponent(searchValue)}`;
                    }
                    
                    const response = await fetch(url);
                    
                    if (!response.ok) {
                      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    // Format courses to match our state structure
                    const formattedCourses = data.courses.map((course: any) => ({
                      id: course.course_code,
                      code: course.course_code,
                      title: course.title
                    }));
                    
                    setSearchResults(formattedCourses);
                  } catch (err) {
                    console.error("Error fetching courses:", err);
                    setSearchError("Failed to fetch courses");
                    setSearchResults([]);
                  } finally {
                    setIsSearching(false);
                  }
                };
                
                // Debounce the API call
                const timeoutId = setTimeout(() => {
                  fetchCourses();
                }, 300);
                
                return () => clearTimeout(timeoutId);
              } else {
                setSearchResults([]);
                setIsSearching(false);
              }
            }}
            placeholder="Search by course code or title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-blue"
          />
          {courseSearchTerm.trim().length > 2 && (
            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-48 overflow-y-auto">
              {isSearching ? (
                <div className="flex justify-center items-center p-4">
                  <svg className="animate-spin h-5 w-5 text-primary-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : searchError ? (
                <div className="p-3 text-sm text-red-500 text-center">
                  {searchError}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No courses found matching "{courseSearchTerm}"
                </div>
              ) : (
                searchResults.map(course => (
                  <div 
                    key={course.id}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      if (!selectedCourses.some(c => c.id === course.id)) {
                        onChange([...selectedCourses, course]);
                      }
                      setCourseSearchTerm("");
                      setSearchResults([]);
                    }}
                  >
                    <div className="font-medium text-primary-blue">{course.code}</div>
                    <div className="text-xs text-gray-500">{course.title}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        {selectedCourses.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCourses.map(course => (
              <div 
                key={course.id} 
                className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm flex items-center"
              >
                <span className="mr-1">{course.code}</span>
                <button
                  onClick={() => onChange(selectedCourses.filter(c => c.id !== course.id))}
                  className="text-green-500 hover:text-green-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSelector; 