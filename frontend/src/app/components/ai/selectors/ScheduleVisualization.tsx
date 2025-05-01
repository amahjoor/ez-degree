"use client";

import React from 'react';
import { ClassSession } from '../AIScheduleGenerator';

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function ScheduleVisualization({ classes }: { classes: ClassSession[] }) {
  if (!classes.length) return <p>No schedules to display.</p>;

  const sorted = [...classes].sort(
    (a, b) => a.day - b.day || a.startTime - b.startTime
  );

  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Day</th>
            <th className="px-4 py-2 border">Time</th>
            <th className="px-4 py-2 border">Course</th>
            <th className="px-4 py-2 border">Title</th>
            <th className="px-4 py-2 border">Location</th>
            <th className="px-4 py-2 border">Instructor</th>
            <th className="px-4 py-2 border">Credits</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(cls => (
            <tr key={cls.id}>
              <td className="px-4 py-2 border">{days[cls.day]}</td>
              <td className="px-4 py-2 border">
                {`${cls.startTime.toFixed(2)} - ${cls.endTime.toFixed(2)}`}
              </td>
              <td className="px-4 py-2 border">{cls.courseCode}</td>
              <td className="px-4 py-2 border">{cls.title}</td>
              <td className="px-4 py-2 border">{cls.location}</td>
              <td className="px-4 py-2 border">{cls.instructor}</td>
              <td className="px-4 py-2 border">{cls.credits ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
