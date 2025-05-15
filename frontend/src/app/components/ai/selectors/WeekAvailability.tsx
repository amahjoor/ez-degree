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
  
  // State for time range
  const [timeRange, setTimeRange] = useState<{start: number, end: number}>({
    start: 8, // 8 AM
    end: 20  // 8 PM
  });

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
    
    // Set time range based on first available day
    for (const day of days) {
      const intervals = selectedAvailability[day] || [];
      if (intervals.length > 0) {
        const startTime = timeStringToNumber(intervals[0].start);
        const endTime = timeStringToNumber(intervals[0].end);
        setTimeRange({ start: startTime, end: endTime });
        break;
      }
    }
    
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
        newAvailability[day] = [{
          start: numberToTimeString(timeRange.start),
          end: numberToTimeString(timeRange.end)
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

  // Handle time range change
  const handleTimeChange = (type: 'start' | 'end', selectedOption: any) => {
    if (!selectedOption) return;
    
    setTimeRange(prev => ({
      ...prev,
      [type]: selectedOption.value
    }));
    
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

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Available Days</h4>
        <div className="flex flex-wrap gap-2">
          {days.map((day, index) => (
            <button
              key={day}
              onClick={() => toggleDay(index)}
              className={`px-3 py-1.5 text-sm rounded-md ${
                selectedDays[index] 
                  ? 'bg-primary-blue text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {day.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Time Range</h4>
        <div className="flex items-center space-x-3">
          <div className="w-full">
            <Select
              value={timeOptions.find(option => option.value === timeRange.start)}
              onChange={(option) => handleTimeChange('start', option)}
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
              onChange={(option) => handleTimeChange('end', option)}
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
    </div>
  );
}
