"use client";

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import CourseSelectionModal from './CourseSelectionModal';
import { Course } from '@/types/course';

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
  
  // Effect to set up menu portal target on component mount
  useEffect(() => {
    // This ensures the dropdown menu has access to document.body
    document.body.classList.add('react-select-body');
    
    return () => {
      document.body.classList.remove('react-select-body');
    };
  }, []);

  return (
    <div className="bg-white h-full w-full overflow-hidden flex flex-col">
      {/* Updated header with semester selection */}
      <div className="border-b border-gray-200">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-full sm:w-48">
              <Select
                value={semesterOptions.find(option => option.value === semester)}
                onChange={handleSemesterChange}
                options={semesterOptions}
                placeholder="Select semester"
                className="react-select-container"
                classNamePrefix="react-select"
                styles={customSelectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-800 ml-0 sm:ml-1">Weekly Schedule</h2>
          </div>
          <button 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="self-end sm:self-auto px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded border border-gray-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {isFilterExpanded ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        <div className={`px-4 pb-3 ${isFilterExpanded ? 'hidden' : 'block'}`}>
          <p className="text-sm text-gray-500">Click on a time slot to add a class or drag courses from requirements</p>
        </div>
        
        {/* Expanded filters section */}
        {isFilterExpanded && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
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
      </div>
      
      <div className="relative grid grid-cols-6 flex-1 overflow-y-auto">
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
            
            // Count how many days are available before this class's day
            // to adjust the position in the grid
            const visibleDayIndex = availableDays
              .slice(0, cls.day)
              .filter(Boolean)
              .length;
              
            return (
              <div
                key={cls.id}
                className={`absolute p-2 rounded-md border shadow-sm hover:shadow-md transition-shadow overflow-y-auto max-h-full hover:z-30 group ${cls.color}`}
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