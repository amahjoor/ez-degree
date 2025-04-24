"use client";

import React, { useState, useEffect } from 'react';

// API configuration
const API_BASE_URL = '/api';

// Define ClassSession interface locally instead of importing it
interface ClassSession {
  id: string;
  courseCode: string;
  title: string;
  day: number; // 0-4 for Monday-Friday
  startTime: number; // Hour in 24h format (8-20)
  endTime: number; // Hour in 24h format (9-21)
  location: string;
  instructor: string;
  color: string;
  credits?: number;
}

interface SchedulePreferences {
  locations: {
    fairfax: boolean;
    arlington: boolean;
    virtual: boolean;
  };
  creditLimits: {
    min: number;
    max: number;
  };
  considerSeats: boolean;
  considerRMP: boolean;
}

interface AIScheduleGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: SchedulePreferences;
  setPreferences: React.Dispatch<React.SetStateAction<SchedulePreferences>>;
  onGenerateSchedule: (generatedClasses: ClassSession[]) => void;
  existingClasses?: ClassSession[];
}

const AIScheduleGenerator: React.FC<AIScheduleGeneratorProps> = ({
  isOpen,
  onClose,
  preferences,
  setPreferences,
  onGenerateSchedule,
  existingClasses = []
}) => {
  // State for AI class input
  const [desiredClasses, setDesiredClasses] = useState<string>("");
  
  // State for tracking AI schedule generation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // State for selected courses in AI generator
  const [selectedCourses, setSelectedCourses] = useState<{id: string, code: string, title: string}[]>([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<{id: string, code: string, title: string}[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Pre-populate selected courses from existingClasses when the modal opens
  useEffect(() => {
    if (isOpen && existingClasses.length > 0) {
      const coursesFromExisting = existingClasses.map(cls => ({
        id: cls.id,
        code: cls.courseCode,
        title: cls.title
      }));
      
      // Filter out any duplicates (by id)
      const uniqueCourses = coursesFromExisting.filter(
        (course, index, self) => index === self.findIndex(c => c.id === course.id)
      );
      
      setSelectedCourses(uniqueCourses);
    }
  }, [isOpen, existingClasses]);

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={(e) => {
        // Close modal when clicking the overlay
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">AI Schedule Generation</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Desired Classes and Credit Limits in same row */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Desired Classes */}
            <div className="flex-1 min-w-[250px]">
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
                                setSelectedCourses([...selectedCourses, course]);
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
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center"
                      >
                        <span className="mr-1">{course.code}</span>
                        <button
                          onClick={() => setSelectedCourses(selectedCourses.filter(c => c.id !== course.id))}
                          className="text-blue-500 hover:text-blue-700"
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

            {/* Credit Limits */}
            <div className="min-w-[240px]">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Semester Credit Limits</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex h-10 w-full max-w-[110px] overflow-hidden rounded-md border border-gray-300 focus-within:border-primary-blue focus-within:ring-1 focus-within:ring-primary-blue">
                    <div className="relative flex-grow">
                      <input
                        type="number"
                        value={preferences.creditLimits.min}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value <= preferences.creditLimits.max) {
                            setPreferences(prev => ({
                              ...prev,
                              creditLimits: {
                                ...prev.creditLimits,
                                min: value
                              }
                            }));
                          }
                        }}
                        min="0"
                        max="18"
                        className="w-[85px] h-full pl-2 pr-12 py-2 border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">credits</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-300">
                      <button 
                        type="button"
                        className="h-5 px-2 hover:bg-gray-100 active:bg-gray-200 text-gray-600 focus:outline-none flex items-center justify-center"
                        onClick={() => {
                          const newValue = preferences.creditLimits.min + 1;
                          if (newValue <= preferences.creditLimits.max) {
                            setPreferences(prev => ({
                              ...prev,
                              creditLimits: {
                                ...prev.creditLimits,
                                min: newValue
                              }
                            }));
                          }
                        }}
                      >
                        <span className="text-sm font-medium leading-none">+</span>
                      </button>
                      <div className="border-t border-gray-300"></div>
                      <button 
                        type="button"
                        className="h-5 px-2 hover:bg-gray-100 active:bg-gray-200 text-gray-600 focus:outline-none flex items-center justify-center"
                        onClick={() => {
                          const newValue = preferences.creditLimits.min - 1;
                          if (newValue >= 0) {
                            setPreferences(prev => ({
                              ...prev,
                              creditLimits: {
                                ...prev.creditLimits,
                                min: newValue
                              }
                            }));
                          }
                        }}
                      >
                        <span className="text-sm font-medium leading-none">−</span>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Minimum</div>
                </div>
                <div>
                  <div className="flex h-10 w-full max-w-[110px] overflow-hidden rounded-md border border-gray-300 focus-within:border-primary-blue focus-within:ring-1 focus-within:ring-primary-blue">
                    <div className="relative flex-grow">
                      <input
                        type="number"
                        value={preferences.creditLimits.max}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= preferences.creditLimits.min) {
                            setPreferences(prev => ({
                              ...prev,
                              creditLimits: {
                                ...prev.creditLimits,
                                max: value
                              }
                            }));
                          }
                        }}
                        min="0"
                        max="21"
                        className="w-[85px] h-full pl-2 pr-12 py-2 border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">credits</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-300">
                      <button 
                        type="button"
                        className="h-5 px-2 hover:bg-gray-100 active:bg-gray-200 text-gray-600 focus:outline-none flex items-center justify-center"
                        onClick={() => {
                          const newValue = preferences.creditLimits.max + 1;
                          if (newValue <= 21) {
                            setPreferences(prev => ({
                              ...prev,
                              creditLimits: {
                                ...prev.creditLimits,
                                max: newValue
                              }
                            }));
                          }
                        }}
                      >
                        <span className="text-sm font-medium leading-none">+</span>
                      </button>
                      <div className="border-t border-gray-300"></div>
                      <button 
                        type="button"
                        className="h-5 px-2 hover:bg-gray-100 active:bg-gray-200 text-gray-600 focus:outline-none flex items-center justify-center"
                        onClick={() => {
                          const newValue = preferences.creditLimits.max - 1;
                          if (newValue >= preferences.creditLimits.min) {
                            setPreferences(prev => ({
                              ...prev,
                              creditLimits: {
                                ...prev.creditLimits,
                                max: newValue
                              }
                            }));
                          }
                        }}
                      >
                        <span className="text-sm font-medium leading-none">−</span>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Maximum</div>
                </div>
              </div>
            </div>
          </div>

          {/* Campus & Other Preferences */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Campus Preferences */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Campus Preferences</h4>
                <div className="flex flex-wrap gap-2">
                  {['fairfax', 'arlington', 'virtual'].map((location) => (
                    <button
                      key={location}
                      onClick={() => setPreferences(prev => ({
                        ...prev,
                        locations: {
                          ...prev.locations,
                          [location]: !prev.locations[location as keyof typeof prev.locations]
                        }
                      }))}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        preferences.locations[location as keyof typeof preferences.locations] 
                          ? 'bg-primary-blue text-white' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      type="button"
                    >
                      {location.charAt(0).toUpperCase() + location.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right column - Additional Preferences */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Seat availability</span>
                    <button 
                      onClick={() => setPreferences(prev => ({
                        ...prev,
                        considerSeats: !prev.considerSeats
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${preferences.considerSeats ? 'bg-primary-blue' : 'bg-gray-200'}`}
                      role="switch"
                      aria-checked={preferences.considerSeats}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${preferences.considerSeats ? 'translate-x-[24px]' : 'translate-x-[3px]'}`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">RMP professor ratings</span>
                    <button 
                      onClick={() => setPreferences(prev => ({
                        ...prev,
                        considerRMP: !prev.considerRMP
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${preferences.considerRMP ? 'bg-primary-blue' : 'bg-gray-200'}`}
                      role="switch"
                      aria-checked={preferences.considerRMP}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${preferences.considerRMP ? 'translate-x-[24px]' : 'translate-x-[3px]'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => {
              setIsGenerating(true);
              // Simulate schedule generation
              setTimeout(() => {
                setIsGenerating(false);
                onClose();
                // TODO: This is where you would actually generate schedules with AI
                // and display the results
                onGenerateSchedule([]);
              }, 2000);
            }}
            disabled={isGenerating}
            className={`px-4 py-2 ${isGenerating ? 'bg-gray-400' : 'bg-primary-blue hover:bg-blue-600'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue flex items-center`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              "Generate Schedules"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIScheduleGenerator; 