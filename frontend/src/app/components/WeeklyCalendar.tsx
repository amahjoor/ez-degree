"use client";

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import CourseSelectionModal from './CourseSelectionModal';
import { Course } from '@/types/course';

// API configuration
const API_BASE_URL = '/api';

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

interface WeeklyCalendarProps {
  onCourseSelect?: (courseCode: string, title: string, credits: number) => void;
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

// Generate a random pastel color for new courses
const getRandomColor = () => {
  const colors = [
    'bg-blue-100 border-blue-300',
    'bg-green-100 border-green-300',
    'bg-yellow-100 border-yellow-300',
    'bg-red-100 border-red-300',
    'bg-purple-100 border-purple-300',
    'bg-pink-100 border-pink-300',
    'bg-indigo-100 border-indigo-300',
    'bg-teal-100 border-teal-300'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ onCourseSelect }) => {
  const [classes, setClasses] = useState<ClassSession[]>([
    // Example classes with corrected positioning
    {
      id: 'math113-001',
      courseCode: 'MATH 113',
      title: 'Analytic Geometry and Calculus I',
      day: 0, // Monday
      startTime: 13, // 1pm
      endTime: 14.5, // 2:30pm
      location: 'Exploratory Hall 4106',
      instructor: 'Jane Doe',
      color: 'bg-green-100 border-green-300',
      credits: 4
    },
    {
      id: 'cs112-001',
      courseCode: 'CS 112',
      title: 'Introduction to Computer Programming',
      day: 2, // Wednesday
      startTime: 10, // 10am
      endTime: 11.5, // 11:30am
      location: 'Innovation Hall 222',
      instructor: 'John Smith',
      color: 'bg-blue-100 border-blue-300',
      credits: 4
    }
  ]);

  // State declarations
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<SchedulePreferences>({
    locations: {
      fairfax: true,
      arlington: false,
      virtual: false,
    },
    creditLimits: {
      min: 12,
      max: 18,
    },
    considerSeats: true,
    considerRMP: false,
  });
  
  // New state for AI class input
  const [desiredClasses, setDesiredClasses] = useState<string>("");
  
  // State for tracking AI schedule generation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // State for selected courses in AI generator
  const [selectedCourses, setSelectedCourses] = useState<{id: string, code: string, title: string}[]>([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<{id: string, code: string, title: string}[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // New filter states
  const [availableDays, setAvailableDays] = useState<boolean[]>([true, true, true, true, true]); // Monday-Friday
  const [timeRange, setTimeRange] = useState<{start: number, end: number}>({start: 8, end: 20}); // 8am-8pm
  const [semester, setSemester] = useState<string>("Spring 2025");
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
  const [draggedOverSlot, setDraggedOverSlot] = useState<{day: number, hour: number} | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am to 8pm

  // Define options for select components
  const timeOptions = hours.map(hour => ({
    value: hour,
    label: hour === 12 ? '12pm' : hour > 12 ? `${hour-12}pm` : `${hour}am`
  }));
  
  const semesterOptions = ["Summer 2025", "Fall 2025"].map(sem => ({
    value: sem,
    label: sem
  }));
  
  // Custom react-select styles
  const customSelectStyles = {
    control: (provided: any) => ({
      ...provided,
      borderColor: '#D1D5DB',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3B82F6'
      }
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
      color: state.isSelected ? 'white' : '#1F2937',
      cursor: 'pointer'
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999
    })
  };

  // Function to format time (e.g., 13.5 -> "1:30pm")
  const formatTime = (time: number) => {
    const hour = Math.floor(time);
    const minute = Math.round((time % 1) * 60);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${minute > 0 ? `:${minute.toString().padStart(2, '0')}` : ''}${ampm}`;
  };

  // Calculate class position and height
  const getClassStyle = (cls: ClassSession) => {
    // Each hour is represented by one row in our grid
    const startHourIndex = cls.startTime - hours[0]; // Convert to index in hours array
    const startRow = startHourIndex + 2; // +2 because of the header row
    
    // Calculate the duration in terms of rows
    const durationHours = cls.endTime - cls.startTime;
    
    return {
      gridRowStart: startRow,
      gridRowEnd: `span ${Math.round(durationHours)}`,
      gridColumnStart: cls.day + 1,
      gridColumnEnd: `span 1`,
      top: `${((cls.startTime - Math.floor(cls.startTime)) * 100)}%`,
      height: `calc(${durationHours * 100}% - 4px)`,
      margin: '2px 4px',
      position: 'relative' as const,
      zIndex: 10
    };
  };

  // Add new states for the course selection modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{day: number, hour: number} | null>(null);

  // Update handleAddClass to open the modal instead of directly adding a class
  const handleAddClass = (day: number, hour: number) => {
    setSelectedTimeSlot({ day, hour });
    setIsModalOpen(true);
  };
  
  // Add function to handle course selection from modal
  const handleCourseSelect = (course: Course) => {
    if (selectedTimeSlot) {
      const { day, hour } = selectedTimeSlot;
      const newClass = {
        id: `class-${Date.now()}`,
        day,
        startTime: hour,
        endTime: hour + 1.25, // 1 hour and 15 minutes for a class
        courseCode: course.course_code,
        title: course.title,
        credits: course.credits || 3,
        location: course.subject ? `${course.subject} Bldg` : 'TBD',
        instructor: 'TBD',
        color: getRandomTailwindColor(),
      };
      setClasses([...classes, newClass]);
      setIsModalOpen(false);
    }
  };

  // Generate a random Tailwind color class
  const getRandomTailwindColor = () => {
    const colors = [
      'bg-red-200', 'bg-blue-200', 'bg-green-200', 
      'bg-yellow-200', 'bg-purple-200', 'bg-pink-200',
      'bg-indigo-200', 'bg-teal-200', 'bg-orange-200'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Function to remove a class
  const handleRemoveClass = (id: string) => {
    setClasses(classes.filter(cls => cls.id !== id));
  };

  // Handle dropping courses onto a day/time slot
  const handleDragOver = (e: React.DragEvent, day: number, hour: number) => {
    e.preventDefault();
    e.stopPropagation();
    // Change the cursor to indicate drop is allowed
    e.dataTransfer.dropEffect = 'copy';
    setDraggedOverSlot({ day, hour });
  };
  
  const handleDragLeave = () => {
    setDraggedOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, day: number, hour: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverSlot(null);
    
    try {
      // Try to parse the dragged data from the DegreeRequirementsSidebar
      const data = e.dataTransfer.getData('text/plain');
      if (data) {
        const courseData = JSON.parse(data);
        if (courseData && courseData.code) {
          // Create a new class session from the dragged course
          const newClass: ClassSession = {
            id: `class-${Date.now()}-${courseData.code}`,
            courseCode: courseData.course_code || courseData.code,
            title: courseData.title || 'New Course',
            day: day,
            startTime: hour,
            endTime: hour + 1.5, // Default 1.5 hour class
            location: 'TBD',
            instructor: 'TBD',
            color: getRandomColor(),
            credits: courseData.credits || 3
          };
          
          setClasses(prev => [...prev, newClass]);
          
          console.log(`Added ${courseData.code} on ${days[day]} at ${formatTime(hour)}`);
        }
      }
    } catch (error) {
      console.error('Error handling course drop:', error);
    }
  };

  // Toggle day availability
  const toggleDay = (index: number) => {
    const newAvailableDays = [...availableDays];
    newAvailableDays[index] = !newAvailableDays[index];
    setAvailableDays(newAvailableDays);
  };

  // Update time range with react-select
  const handleTimeRangeChange = (type: 'start' | 'end', selectedOption: any) => {
    if (!selectedOption) return;
    
    const value = selectedOption.value;
    if (type === 'start' && value < timeRange.end) {
      setTimeRange(prev => ({ ...prev, start: value }));
    } else if (type === 'end' && value > timeRange.start) {
      setTimeRange(prev => ({ ...prev, end: value }));
    }
  };
  
  // Handle semester change
  const handleSemesterChange = (selectedOption: any) => {
    if (selectedOption) {
      setSemester(selectedOption.value);
    }
  };
  
  const semesterList = ["Summer 2025", "Fall 2025"];
  const [currentSemesterIndex, setCurrentSemesterIndex] = useState(0);

  const handlePrevSemester = () => {
    setCurrentSemesterIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextSemester = () => {
    setCurrentSemesterIndex(prev => (prev < semesterList.length - 1 ? prev + 1 : prev));
  };

  useEffect(() => {
    setSemester(semesterList[currentSemesterIndex]);
  }, [currentSemesterIndex]);

  // Effect to handle body scroll lock when modal is open
  useEffect(() => {
    if (isPreferencesOpen) {
      // Add class to prevent scrolling on body
      document.body.style.overflow = 'hidden';
      
      // Pre-populate selectedCourses with existing classes from the calendar
      const existingCourses = classes.map(cls => ({
        id: cls.id,
        code: cls.courseCode,
        title: cls.title
      }));
      
      // Filter out any duplicates (by id)
      const uniqueCourses = existingCourses.filter(
        (course, index, self) => index === self.findIndex(c => c.id === course.id)
      );
      
      setSelectedCourses(uniqueCourses);
    } else {
      // Remove class when modal is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to ensure we remove the class when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPreferencesOpen, classes]);

  // Effect to set up menu portal target on component mount
  useEffect(() => {
    // This ensures the dropdown menu has access to document.body
    document.body.classList.add('react-select-body');
    
    return () => {
      document.body.classList.remove('react-select-body');
    };
  }, []);

  // Options for credit limits
  const creditOptions = Array.from({ length: 18 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} credit${i === 0 ? '' : 's'}`
  }));

  // Add function to ensure every class has a color
  const ensureClassHasColor = (cls: ClassSession): ClassSession => {
    if (!cls.color || cls.color.trim() === '') {
      return {
        ...cls,
        color: getRandomTailwindColor()
      };
    }
    return cls;
  };

  // Effect to ensure all classes have colors
  useEffect(() => {
    // Check if any classes are missing colors and update them
    const allHaveColors = classes.every(cls => cls.color && cls.color.trim() !== '');
    if (!allHaveColors) {
      const updatedClasses = classes.map(cls => ensureClassHasColor(cls));
      setClasses(updatedClasses);
    }
  }, [classes]);

  return (
    <div className="bg-white h-full w-full overflow-hidden flex flex-col">
      {/* Fixed header with semester navigation and controls */}
      <div className="border-b border-gray-200 flex-shrink-0">
        <div className="p-4 flex items-center justify-between">
          {/* Semester Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevSemester}
              disabled={currentSemesterIndex === 0}
              className={`p-2 rounded-full hover:bg-gray-100 ${currentSemesterIndex === 0 ? 'text-gray-300' : 'text-gray-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold min-w-[150px] text-center">
              {semesterList[currentSemesterIndex]}
            </h2>
            <button
              onClick={handleNextSemester}
              disabled={currentSemesterIndex === semesterList.length - 1}
              className={`p-2 rounded-full hover:bg-gray-100 ${currentSemesterIndex === semesterList.length - 1 ? 'text-gray-300' : 'text-gray-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md border border-gray-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
            <button 
              onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
              className="px-3 py-2 bg-primary-blue hover:bg-primary-blue/90 text-white text-sm rounded-md border border-primary-blue flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI
            </button>
          </div>
        </div>

        {/* Expanded filters section */}
        {isFilterExpanded && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time range section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Time Availability</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-full">
                    <Select
                      value={timeOptions.find(option => option.value === timeRange.start)}
                      onChange={(option) => handleTimeRangeChange('start', option)}
                      options={timeOptions.filter(option => option.value < timeRange.end)}
                      placeholder="Start time"
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={customSelectStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                    />
                  </div>
                  <span className="text-gray-500">to</span>
                  <div className="w-full">
                    <Select
                      value={timeOptions.find(option => option.value === timeRange.end)}
                      onChange={(option) => handleTimeRangeChange('end', option)}
                      options={timeOptions.filter(option => option.value > timeRange.start)}
                      placeholder="End time"
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={customSelectStyles}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                    />
                  </div>
                </div>
              </div>
              
              {/* Days of week section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Available Days</h3>
                <div className="flex flex-wrap gap-2">
                  {days.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(index)}
                      className={`px-3 py-1.5 text-sm rounded-md ${
                        availableDays[index] 
                          ? 'bg-primary-blue text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Preferences Modal */}
        {isPreferencesOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={(e) => {
              // Close modal when clicking the overlay
              if (e.target === e.currentTarget) {
                setIsPreferencesOpen(false);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">AI Schedule Generation</h3>
                <button 
                  onClick={() => setIsPreferencesOpen(false)}
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
                              min={preferences.creditLimits.min}
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

                {/* Preferred Locations and Additional Considerations in same row */}
                <div className="flex flex-wrap gap-4">
                  {/* Campus Locations */}
                  <div className="min-w-[250px] flex-1">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preferred Locations</h4>
                    <div className="space-y-1">
                      {Object.entries(preferences.locations).map(([location, isSelected]) => (
                        <label key={location} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setPreferences(prev => ({
                              ...prev,
                              locations: {
                                ...prev.locations,
                                [location]: !isSelected
                              }
                            }))}
                            className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {location === 'fairfax' ? 'Fairfax Campus' :
                             location === 'arlington' ? 'Arlington Campus' : 'Virtual'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Additional Considerations */}
                  <div className="min-w-[250px]">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Considerations</h4>
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

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setIsGenerating(true);
                    // Simulate schedule generation
                    setTimeout(() => {
                      setIsGenerating(false);
                      setIsPreferencesOpen(false);
                      // TODO: This is where you would actually generate schedules with AI
                      // and display the results
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
        )}
      </div>
      
      {/* Scrollable calendar grid */}
      <div className="relative flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="grid grid-cols-6 min-h-full">
            {/* Only show columns for available days */}
            <div className="col-span-1 bg-gray-50 border-r border-gray-200 z-20 sticky left-0">
              <div className="h-12 flex items-center justify-center font-semibold border-b border-gray-200 bg-gray-100 sticky top-0">
                Time
              </div>
              {hours.map(hour => (
                <React.Fragment key={`hour-${hour}`}>
                  <div className="h-16 flex items-center justify-end pr-3 text-sm text-gray-500 border-b border-gray-200">
                    {hour % 12 || 12}{hour >= 12 ? 'pm' : 'am'}
                  </div>
                </React.Fragment>
              ))}
            </div>
            
            {/* Day columns - filtered by availability */}
            <div className={`col-span-5 grid bg-white relative`} 
              style={{ 
                gridTemplateColumns: `repeat(${availableDays.filter(Boolean).length}, minmax(0, 1fr))` 
              }}
            >
              {/* Day headers */}
              {days.map((day, index) => (
                availableDays[index] && (
                  <div 
                    key={`day-${index}`}
                    className="h-12 flex items-center justify-center font-semibold border-b border-gray-200 border-r border-gray-200 sticky top-0 bg-gray-100 z-10"
                  >
                    {day}
                  </div>
                )
              ))}
              
              {/* Time grid - generates the background grid, filtered by day availability */}
              {days.map((_, dayIndex) => (
                availableDays[dayIndex] && (
                  <div 
                    key={`day-col-${dayIndex}`} 
                    className="relative border-r border-gray-200"
                  >
                    {hours.map((hour) => (
                      <div
                        key={`slot-${dayIndex}-${hour}`}
                        className={`h-16 border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors ${
                          draggedOverSlot?.day === dayIndex && draggedOverSlot?.hour === hour
                            ? 'bg-blue-100 border border-blue-400'
                            : ''
                        }`}
                        onClick={() => handleAddClass(dayIndex, hour)}
                        onDragOver={(e) => handleDragOver(e, dayIndex, hour)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, dayIndex, hour)}
                      />
                    ))}
                  </div>
                )
              ))}
              
              {/* Class blocks - filtered and positioned based on availability */}
              {classes.map((cls) => {
                // Only show classes for available days
                if (!availableDays[cls.day]) return null;
                
                // Ensure class has a color
                const classWithColor = ensureClassHasColor(cls);
                
                // Count how many days are available before this class's day
                // to adjust the position in the grid
                const visibleDayIndex = availableDays
                  .slice(0, cls.day)
                  .filter(Boolean)
                  .length;
                  
                return (
                  <div
                    key={cls.id}
                    className={`absolute p-2 rounded-md border shadow-sm hover:shadow-md transition-shadow overflow-y-auto max-h-full hover:z-30 group ${classWithColor.color}`}
                    style={{
                      left: `${(visibleDayIndex * (100 / availableDays.filter(Boolean).length))}%`,
                      width: `calc(${100 / availableDays.filter(Boolean).length}% - 8px)`,
                      top: `calc(3rem + ${(cls.startTime - 8) * 4}rem)`,
                      height: `calc(${(cls.endTime - cls.startTime) * 4}rem - 4px)`,
                    }}
                  >
                    <div className="flex justify-between items-start h-full">
                      <div className="w-full overflow-y-auto scrollbar-thin">
                        <p className="font-bold text-sm">{cls.courseCode}</p>
                        <p className="text-xs truncate group-hover:text-clip group-hover:whitespace-normal">{cls.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{cls.location}</p>
                        <p className="text-xs text-gray-600 font-medium">{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</p>
                        {cls.credits && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-white bg-opacity-50 rounded text-xs font-medium">
                            {cls.credits} credit{cls.credits !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <button 
                        className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClass(cls.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Selection Modal */}
      <CourseSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectCourse={handleCourseSelect}
        semesterTitle={`${semester} - ${selectedTimeSlot ? `${days[selectedTimeSlot.day]} at ${formatTime(selectedTimeSlot.hour)}` : ''}`}
      />
    </div>
  );
};

export default WeeklyCalendar; 