"use client";

import React from 'react';

interface GradeDistributionPanelProps {
  gradeDistribution: Record<string, number>;
  onViewFullDistribution: () => void;
}

export default function GradeDistributionPanel({ 
  gradeDistribution, 
  onViewFullDistribution 
}: GradeDistributionPanelProps) {
  return (
    <div className="rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Grade Distribution</h3>
      <div className="space-y-4">
        {/* Grade A */}
        <div className="flex items-center mb-3">
          <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
            <div 
              className="bg-green-500 h-7 rounded-full rounded-r-none" 
              style={{ width: `${Math.max(gradeDistribution.A || 0, 1)}%` }}
            ></div>
          </div>
          <div className="ml-4 flex items-center">
            <span className="text-base font-medium w-10 text-right">{gradeDistribution.A || 0}%</span>
            <span className="text-lg font-bold ml-4">A</span>
          </div>
        </div>

        {/* Grade B */}
        <div className="flex items-center mb-3">
          <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
            <div 
              className="bg-blue-500 h-7 rounded-full rounded-r-none" 
              style={{ width: `${Math.max(gradeDistribution.B || 0, 1)}%` }}
            ></div>
          </div>
          <div className="ml-4 flex items-center">
            <span className="text-base font-medium w-10 text-right">{gradeDistribution.B || 0}%</span>
            <span className="text-lg font-bold ml-4">B</span>
          </div>
        </div>

        {/* Grade C */}
        <div className="flex items-center mb-3">
          <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
            <div 
              className="bg-yellow-500 h-7 rounded-full rounded-r-none" 
              style={{ width: `${Math.max(gradeDistribution.C || 0, 1)}%` }}
            ></div>
          </div>
          <div className="ml-4 flex items-center">
            <span className="text-base font-medium w-10 text-right">{gradeDistribution.C || 0}%</span>
            <span className="text-lg font-bold ml-4">C</span>
          </div>
        </div>

        {/* Grade D */}
        <div className="flex items-center mb-3">
          <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
            <div 
              className="bg-orange-500 h-7 rounded-full rounded-r-none" 
              style={{ width: `${Math.max(gradeDistribution.D || 0, 1)}%` }}
            ></div>
          </div>
          <div className="ml-4 flex items-center">
            <span className="text-base font-medium w-10 text-right">{gradeDistribution.D || 0}%</span>
            <span className="text-lg font-bold ml-4">D</span>
          </div>
        </div>

        {/* Grade F */}
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
            <div 
              className="bg-red-500 h-7 rounded-full rounded-r-none" 
              style={{ width: `${Math.max(gradeDistribution.F || 0, 1)}%` }}
            ></div>
          </div>
          <div className="ml-4 flex items-center">
            <span className="text-base font-medium w-10 text-right">{gradeDistribution.F || 0}%</span>
            <span className="text-lg font-bold ml-4">F</span>
          </div>
        </div>

        <div className="mt-3">
          <button 
            onClick={onViewFullDistribution}
            className="text-blue-500 hover:underline text-sm font-medium"
          >
            View full grade distribution
          </button>
        </div>
      </div>
    </div>
  );
} 