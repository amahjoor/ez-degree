// src/app/components/ai/selectors/ScheduleVisualization.tsx
"use client";

import React from 'react';
import { ClassSession } from '../AIScheduleGenerator';

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

interface Props {
  classes: ClassSession[];
}

export default function ScheduleVisualization({ classes }: Props) {
  if (!classes.length) return <p>No schedules to display.</p>;

  // Determine time range (fall back to 8–18 if out of bounds)
  const startTimes = classes.map(c => c.startTime);
  const endTimes   = classes.map(c => c.endTime);
  const minHour = Math.floor(Math.min(8, ...startTimes));
  const maxHour = Math.ceil(Math.max(18, ...endTimes));
  const totalHours = maxHour - minHour;

  return (
    <div className="relative w-full h-[600px] border">
      {/* Day headers */}
      <div className="absolute top-0 left-12 right-0 h-8 grid grid-cols-7 bg-gray-50 border-b">
        {days.map(d => (
          <div key={d} className="flex items-center justify-center text-sm font-medium">
            {d.slice(0,3)}
          </div>
        ))}
      </div>

      {/* Time labels */}
      <div className="absolute top-8 left-0 w-12 bottom-0 flex flex-col">
        {Array.from({ length: totalHours + 1 }).map((_, i) => (
          <div
            key={i}
            className="h-[calc(100%/(totalHours))] text-xs flex items-start justify-end pr-1"
          >
            {minHour + i}:00
          </div>
        ))}
      </div>

      {/* Grid background */}
      <div
        className="absolute top-8 left-12 right-0 bottom-0 grid"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${totalHours}, 1fr)`
        }}
      >
        {Array.from({ length: totalHours }).map((_, row) =>
          days.map((_, col) => (
            <div
              key={`${row}-${col}`}
              className="border-t border-l last:border-r border-gray-200"
            />
          ))
        )}
      </div>

      {/* Class blocks */}
      {classes.map(cls => {
        const topPct = ((cls.startTime - minHour) / totalHours) * 100;
        const heightPct = ((cls.endTime - cls.startTime) / totalHours) * 100;
        const leftPct = (cls.day / 7) * 100;
        const widthPct = 100 / 7;

        return (
          <div
            key={cls.id}
            className="absolute p-1 text-xs rounded shadow"
            style={{
              top: `calc(${topPct}% + 8px)`,     // + header height
              left: `${leftPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
              backgroundColor: cls.color
            }}
          >
            <div className="font-bold leading-none">{cls.courseCode}</div>
            <div className="leading-none">
              {`${cls.startTime.toFixed(2)} - ${cls.endTime.toFixed(2)}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
