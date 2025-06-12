"use client";

import React, { useState, useEffect, useRef } from 'react';

export type DayName =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface TimeInterval {
  start: string; // "HH:MM" 24h
  end: string;   // "HH:MM"
}

export interface WeekAvailabilityProps {
  selectedAvailability: Record<DayName, TimeInterval[]>;
  onChange: (availability: Record<DayName, TimeInterval[]>) => void;
}

// Array of days, used for mapping (removed Saturday and Sunday)
const days: DayName[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday'
];

// Convert time from string format "HH:MM" to an hour number with decimals (e.g., "13:30" -> 13.5)
function timeStringToNumber(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
}

// Convert time from number format to string "HH:MM" (e.g., 13.5 -> "13:30")
function numberToTimeString(time: number): string {
  const hours = Math.floor(time);
  const minutes = Math.round((time % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default function WeekAvailability({
  selectedAvailability,
  onChange
}: WeekAvailabilityProps) {
  // State for selected days (true = available, false = unavailable)
  const [selectedDays, setSelectedDays] = useState<boolean[]>(Array(5).fill(false));
  
  // State for per-day time ranges (initialize with default for all days)
  const [dayTimeRanges, setDayTimeRanges] = useState<Array<{start: number, end: number}>>([
    {start: 6, end: 23},
    {start: 6, end: 23},
    {start: 6, end: 23},
    {start: 6, end: 23},
    {start: 6, end: 23}
  ]);
  
  // Track which day's time selector is shown
  const [showDayTimeSelector, setShowDayTimeSelector] = useState<number | null>(null);
  
  // Track active time dropdown
  const [activeTimeDropdown, setActiveTimeDropdown] = useState<{day: number, type: 'start' | 'end'} | null>(null);

  // Use a ref to track if we've initialized from props
  const initializedRef = useRef(false);

  // Generate time options that include 6 AM through 11 PM (6-23)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM through 11 PM (23)
  
  // Define options for select components
  const timeOptions = hours.map(hour => ({
    value: hour,
    label: hour === 12 ? '12pm' : hour > 12 ? `${hour-12}pm` : `${hour}am`
  }));
  // Add 11pm only if it's not already included
  if (!timeOptions.some(option => option.value === 23)) {
    timeOptions.push({ value: 23, label: '11pm' });
  }

  // Initialize from props - only run once
  useEffect(() => {
    if (initializedRef.current) return;
    
    // Set selected days based on availability
    const newSelectedDays = days.map(day => 
      (selectedAvailability[day] || []).length > 0
    );
    setSelectedDays(newSelectedDays);
    
    // Set time ranges for each day based on availability
    const newDayTimeRanges = [...dayTimeRanges];
    
    days.forEach((day, index) => {
      const intervals = selectedAvailability[day] || [];
      if (intervals.length > 0) {
        const startTime = timeStringToNumber(intervals[0].start);
        const endTime = timeStringToNumber(intervals[0].end);
        newDayTimeRanges[index] = { start: startTime, end: endTime };
      }
    });
    
    setDayTimeRanges(newDayTimeRanges);
    initializedRef.current = true;
  }, [selectedAvailability]);

  // All possible days (needed for complete availability object)
  const allDays: DayName[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  // When user makes changes, update parent with the new availability
  const handleUpdate = () => {
    const newAvailability: Record<DayName, TimeInterval[]> = {} as any;
    
    // Add all days to the object, even those not in our UI list
    allDays.forEach(day => {
      newAvailability[day] = [];
    });
    
    // Then update the ones we display in UI
    days.forEach((day, index) => {
      if (selectedDays[index]) {
        // Use day-specific time range
        const timeSettings = dayTimeRanges[index];
        
        newAvailability[day] = [{
          start: numberToTimeString(timeSettings.start),
          end: numberToTimeString(timeSettings.end)
        }];
      }
    });
    
    onChange(newAvailability);
  };

  // Toggle day selection
  const toggleDay = (index: number) => {
    const newSelectedDays = [...selectedDays];
    newSelectedDays[index] = !newSelectedDays[index];
    setSelectedDays(newSelectedDays);
    
    // Call the update function after state change
    setTimeout(handleUpdate, 0);
  };

  // Toggle day time selector
  const toggleDayTimeSelector = (dayIndex: number) => {
    setShowDayTimeSelector(showDayTimeSelector === dayIndex ? null : dayIndex);
  };

  // Handle day-specific time change
  const handleDayTimeChange = (dayIndex: number, type: 'start' | 'end', selectedOption: any) => {
    if (!selectedOption) return;
    
    const newDayTimeRanges = [...dayTimeRanges];
    
    // Update the time range for the specific day
    newDayTimeRanges[dayIndex] = {
      ...newDayTimeRanges[dayIndex],
      [type]: selectedOption.value
    };
    
    setDayTimeRanges(newDayTimeRanges);
    
    // Call the update function after state change
    setTimeout(handleUpdate, 0);
  };

  // Click outside handler for time dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeTimeDropdown) {
        // Close dropdown if clicking outside
        const target = event.target as Element;
        if (!target.closest('.time-dropdown-container')) {
          setActiveTimeDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeTimeDropdown]);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Available Days</h4>
        <div className="flex items-center gap-2 flex-wrap">
          {days.map((day, index) => (
            <div key={day} className="flex items-center">
              {!selectedDays[index] ? (
                // Inactive day button
                <button
                  onClick={() => toggleDay(index)}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-500 rounded-md"
                >
                  {day.substring(0, 3)}
                </button>
              ) : (
                // Active day button with clock icon or time selectors
                <div className="flex items-center">
                  <button
                    onClick={() => toggleDay(index)}
                    className="px-4 py-2 text-sm bg-primary-blue text-white rounded-l-md hover:bg-blue-400 transition-colors"
                  >
                    {day.substring(0, 3)}
                  </button>
                  {showDayTimeSelector === index ? (
                    // Time selection mode - replaces just the clock section
                    <div className="bg-primary-blue text-white rounded-r-md px-2 py-2 flex items-center text-xs relative time-dropdown-container h-[36px]">
                      {/* Start time dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveTimeDropdown(
                            activeTimeDropdown?.day === index && activeTimeDropdown?.type === 'start' 
                              ? null 
                              : {day: index, type: 'start'}
                          )}
                          className="bg-white text-black text-xs rounded px-1.5 py-0.5 w-10 hover:bg-gray-100 border-none focus:outline-none focus:ring-1 focus:ring-blue-500 h-5 flex items-center justify-center"
                        >
                          {timeOptions.find(opt => opt.value === dayTimeRanges[index].start)?.label || '6am'}
                        </button>
                        {activeTimeDropdown?.day === index && activeTimeDropdown?.type === 'start' && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-32 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded">
                            {timeOptions.filter(option => option.value < dayTimeRanges[index].end).map(option => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  handleDayTimeChange(index, 'start', { value: option.value });
                                  setActiveTimeDropdown(null);
                                }}
                                className="w-full text-left px-3 py-1 text-xs text-black hover:bg-blue-50 focus:bg-blue-100 focus:outline-none whitespace-nowrap"
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <span className="mx-1 text-white text-xs">to</span>
                      
                      {/* End time dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveTimeDropdown(
                            activeTimeDropdown?.day === index && activeTimeDropdown?.type === 'end' 
                              ? null 
                              : {day: index, type: 'end'}
                          )}
                          className="bg-white text-black text-xs rounded px-1.5 py-0.5 w-10 hover:bg-gray-100 border-none focus:outline-none focus:ring-1 focus:ring-blue-500 h-5 flex items-center justify-center"
                        >
                          {timeOptions.find(opt => opt.value === dayTimeRanges[index].end)?.label || '11pm'}
                        </button>
                        {activeTimeDropdown?.day === index && activeTimeDropdown?.type === 'end' && (
                          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-32 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded">
                            {timeOptions.filter(option => option.value > dayTimeRanges[index].start).map(option => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  handleDayTimeChange(index, 'end', { value: option.value });
                                  setActiveTimeDropdown(null);
                                }}
                                className="w-full text-left px-3 py-1 text-xs text-black hover:bg-blue-50 focus:bg-blue-100 focus:outline-none whitespace-nowrap"
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => {
                          setShowDayTimeSelector(null);
                          setActiveTimeDropdown(null);
                        }}
                        className="p-0.5 ml-1 hover:bg-white hover:bg-opacity-20 rounded h-4 w-4 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    // Clock icon
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDayTimeSelector(index);
                      }}
                      className="p-2 rounded-r-md bg-primary-blue text-white hover:bg-blue-400 transition-colors"
                      title={`Set time for ${day}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
