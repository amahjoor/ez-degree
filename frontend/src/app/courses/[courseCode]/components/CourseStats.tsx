"use client";

import React, { useMemo } from 'react';
import { Professor } from '@/types/professor';

interface CourseStatsProps {
  mostCommonGrade: string;
  professors: Professor[];
}

// Utility functions for calculating statistics
const calculateAverageRating = (professors: Professor[]): number => {
  if (!professors || professors.length === 0) return 0;
  
  const sum = professors.reduce((acc, prof) => acc + prof.avgRating, 0);
  return Number((sum / professors.length).toFixed(1));
};

const calculateAverageDifficulty = (professors: Professor[]): number => {
  if (!professors || professors.length === 0) return 0;
  
  const sum = professors.reduce((acc, prof) => acc + prof.avgDifficulty, 0);
  return Number((sum / professors.length).toFixed(1));
};

export default function CourseStats({ mostCommonGrade, professors }: CourseStatsProps) {
  // Calculate average statistics
  const avgDifficulty = calculateAverageDifficulty(professors);
  const avgRating = calculateAverageRating(professors);

  return (
    <div className="p-6 mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h4 className="text-gray-500 text-sm">Avg Grade</h4>
          <p className="text-5xl font-bold">{mostCommonGrade !== 'N/A' ? mostCommonGrade : '—'}</p>
        </div>
        <div>
          <h4 className="text-gray-500 text-sm">Difficulty</h4>
          <p className="text-5xl font-semibold">{avgDifficulty}<span className="text-2xl font-normal">/5</span></p>
        </div>
        <div>
          <h4 className="text-gray-500 text-sm">Rating</h4>
          <p className="text-5xl font-semibold">{avgRating}<span className="text-2xl font-normal">/5</span></p>
        </div>
      </div>
    </div>
  );
} 