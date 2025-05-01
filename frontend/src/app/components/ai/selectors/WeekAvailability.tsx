"use client";

import React, { useState } from 'react';

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


const days: DayName[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function WeekAvailability({
  selectedAvailability,
  onChange
}: WeekAvailabilityProps) {
  // Build a default Monday–Friday 08:00–22:00, weekends empty
  const defaultAvail: Record<DayName, TimeInterval[]> = {} as any;
  days.forEach((day, idx) => {
    defaultAvail[day] =
      idx < 5 ? [{ start: '08:00', end: '22:00' }] : [];
  });

  // Determine if prop is "empty"
  const propEmpty =
    !selectedAvailability ||
    days.every(day => (selectedAvailability[day] || []).length === 0);

  const initialAvail = propEmpty
    ? defaultAvail
    : days.reduce((acc, day) => {
        acc[day] = selectedAvailability[day] ?? [];
        return acc;
      }, {} as Record<DayName, TimeInterval[]>);

  const [localAvail, setLocalAvail] = useState<Record<DayName, TimeInterval[]>>(initialAvail);

  const toggleDay = (day: DayName) => {
    const updated = { ...localAvail };
    updated[day] = updated[day].length ? [] : [{ start: '08:00', end: '17:00' }];
    setLocalAvail(updated);
    onChange(updated);
  };

  const updateInterval = (
    day: DayName,
    idx: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const updated = { ...localAvail };
    updated[day] = updated[day].map((intv, i) =>
      i === idx ? { ...intv, [field]: value } : intv
    );
    setLocalAvail(updated);
    onChange(updated);
  };

  const addInterval = (day: DayName) => {
    const updated = { ...localAvail };
    updated[day] = [...(updated[day] || []), { start: '08:00', end: '17:00' }];
    setLocalAvail(updated);
    onChange(updated);
  };

  const removeInterval = (day: DayName, idx: number) => {
    const updated = { ...localAvail };
    updated[day] = updated[day].filter((_, i) => i !== idx);
    setLocalAvail(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Weekly Availability</h4>
      {days.map(day => (
        <div key={day} className="border rounded p-3">
          <label className="inline-flex items-center mb-2">
            <input
              type="checkbox"
              checked={localAvail[day]?.length > 0}
              onChange={() => toggleDay(day)}
              className="form-checkbox h-5 w-5 text-primary-blue"
            />
            <span className="ml-2 font-medium">{day}</span>
          </label>

          {localAvail[day]?.length > 0 && (
            <div className="space-y-2">
              {localAvail[day].map((intv, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={intv.start}
                    onChange={e => updateInterval(day, idx, 'start', e.target.value)}
                    className="w-24 px-2 py-1 border rounded"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={intv.end}
                    onChange={e => updateInterval(day, idx, 'end', e.target.value)}
                    className="w-24 px-2 py-1 border rounded"
                  />
                  <button
                    onClick={() => removeInterval(day, idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => addInterval(day)}
                className="text-sm text-primary-blue hover:underline"
              >
                + Add interval
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
