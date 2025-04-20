"use client";

import React, { useState, useEffect } from 'react';

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

  const [draggedOverSlot, setDraggedOverSlot] = useState<{day: number, hour: number} | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am to 8pm

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

  // Handle adding a class to a time slot
  const handleAddClass = (day: number, hour: number) => {
    // In a real app, this would open a modal to select a course
    console.log(`Add class on ${days[day]} at ${formatTime(hour)}`);
    
    // For now, we'll just simulate adding a class
    const newClass: ClassSession = {
      id: `class-${Date.now()}`,
      courseCode: 'NEW 101',
      title: 'New Course',
      day: day,
      startTime: hour,
      endTime: hour + 1.5,
      location: 'TBD',
      instructor: 'TBD',
      color: 'bg-purple-100 border-purple-300'
    };
    
    setClasses([...classes, newClass]);
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
            courseCode: courseData.code,
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

  return (
    <div className="bg-white h-full w-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Spring 2025 Weekly Schedule</h2>
        <p className="text-sm text-gray-500">Click on a time slot to add a class</p>
      </div>
      
      <div className="relative grid grid-cols-6 flex-1 overflow-y-auto">
        {/* Time column */}
        <div className="col-span-1 bg-gray-50 border-r border-gray-200 z-20 sticky left-0">
          <div className="h-12 flex items-center justify-center font-semibold border-b border-gray-200 bg-gray-50">
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
        
        {/* Day columns */}
        <div className="col-span-5 grid grid-cols-5 bg-white relative">
          {/* Day headers */}
          {days.map((day, index) => (
            <div 
              key={`day-${index}`}
              className="h-12 flex items-center justify-center font-semibold border-b border-gray-200 sticky top-0 bg-white z-10"
            >
              {day}
            </div>
          ))}
          
          {/* Time grid - generates the background grid */}
          {days.map((_, dayIndex) => (
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
          ))}
          
          {/* Class blocks */}
          {classes.map((cls) => {
            const style = getClassStyle(cls);
            return (
              <div
                key={cls.id}
                className={`absolute p-2 rounded-md border ${cls.color} shadow-sm hover:shadow transition-shadow overflow-hidden`}
                style={{
                  left: `${(cls.day * 20)}%`,
                  width: 'calc(20% - 8px)',
                  top: `calc(3rem + ${(cls.startTime - 8) * 4}rem)`,
                  height: `calc(${(cls.endTime - cls.startTime) * 4}rem - 4px)`,
                }}
              >
                <div className="flex justify-between items-start h-full">
                  <div className="w-full">
                    <p className="font-bold text-sm">{cls.courseCode}</p>
                    <p className="text-xs truncate">{cls.title}</p>
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
  );
};

export default WeeklyCalendar; 