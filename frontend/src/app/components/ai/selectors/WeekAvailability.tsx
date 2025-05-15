"use client";

import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';

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
  
  // Default time range (used when initializing a day's time)
  const defaultTimeRange = {start: 6, end: 23}; // 6 AM to 11 PM
  
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

  // Use a ref to track if we've initialized from props
  const initializedRef = useRef(false);

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
    
    // Show time selector for this day if it's selected
    if (newSelectedDays[index]) {
      setShowDayTimeSelector(index);
    } else if (showDayTimeSelector === index) {
      setShowDayTimeSelector(null);
    }
    
    // Call the update function after state change
    setTimeout(handleUpdate, 0);
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

  // Format time for display (e.g., 13.5 -> "1:30 PM")
  const formatTimeForDisplay = (time: number) => {
    const hour = Math.floor(time);
    const minute = Math.round((time % 1) * 60);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}${minute > 0 ? `:${minute.toString().padStart(2, '0')}` : ''} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Available Days</h4>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            {days.map((day, index) => (
              <div key={day} className="flex items-center">
                <button
                  onClick={() => toggleDay(index)}
                  className={`px-4 py-2 text-sm ${
                    selectedDays[index] 
                      ? 'bg-primary-blue text-white rounded-l-md' 
                      : 'bg-gray-200 text-gray-500 rounded-md'
                  }`}
                >
                  {day.substring(0, 3)}
                </button>
                {selectedDays[index] && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDayTimeSelector(index);
                    }}
                    className={`p-2 rounded-r-md ${
                      showDayTimeSelector === index
                        ? 'bg-primary-blue text-white' 
                        : 'bg-blue-300 text-white'
                    }`}
                    title={`Set time for ${day}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Time selector positioned below the day buttons */}
          {showDayTimeSelector !== null && selectedDays[showDayTimeSelector] && (
            <div className="w-full mt-2 p-3 bg-white rounded-md border shadow-sm z-10 flex items-center">
              <span className="font-medium text-gray-700 mr-3">{days[showDayTimeSelector]}</span>
              <div className="flex-1 flex items-center">
                <div className="w-32">
                  <Select
                    value={timeOptions.find(option => option.value === dayTimeRanges[showDayTimeSelector].start)}
                    onChange={(option) => handleDayTimeChange(showDayTimeSelector, 'start', option)}
                    options={timeOptions.filter(option => option.value < dayTimeRanges[showDayTimeSelector].end)}
                    placeholder="Start"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      ...customSelectStyles,
                      control: (provided) => ({
                        ...provided,
                        minHeight: '36px',
                        height: '36px',
                        border: '1px solid #D1D5DB',
                        boxShadow: 'none',
                        borderRadius: '0.375rem'
                      }),
                      valueContainer: (provided) => ({
                        ...provided,
                        height: '36px',
                        padding: '0 8px',
                        display: 'flex',
                        alignItems: 'center'
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        padding: 0,
                        margin: 0
                      }),
                      // Hide the dropdown indicator (arrow)
                      dropdownIndicator: () => ({
                        display: 'none'
                      }),
                      indicatorSeparator: () => ({
                        display: 'none'
                      })
                    }}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                  />
                </div>
                <span className="text-gray-500 px-3">to</span>
                <div className="w-32">
                  <Select
                    value={timeOptions.find(option => option.value === dayTimeRanges[showDayTimeSelector].end)}
                    onChange={(option) => handleDayTimeChange(showDayTimeSelector, 'end', option)}
                    options={timeOptions.filter(option => option.value > dayTimeRanges[showDayTimeSelector].start)}
                    placeholder="End"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      ...customSelectStyles,
                      control: (provided) => ({
                        ...provided,
                        minHeight: '36px',
                        height: '36px',
                        border: '1px solid #D1D5DB',
                        boxShadow: 'none',
                        borderRadius: '0.375rem'
                      }),
                      valueContainer: (provided) => ({
                        ...provided,
                        height: '36px',
                        padding: '0 8px',
                        display: 'flex',
                        alignItems: 'center'
                      }),
                      singleValue: (provided) => ({
                        ...provided,
                        padding: 0,
                        margin: 0
                      }),
                      // Hide the dropdown indicator (arrow)
                      dropdownIndicator: () => ({
                        display: 'none'
                      }),
                      indicatorSeparator: () => ({
                        display: 'none'
                      })
                    }}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                  />
                </div>
                <button 
                  onClick={() => setShowDayTimeSelector(null)}
                  className="p-2 ml-3 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
