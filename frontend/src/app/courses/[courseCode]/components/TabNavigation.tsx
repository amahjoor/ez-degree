"use client";

import React from 'react';

export type TabType = 'overview' | 'professors' | 'grade';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex -mb-px">
        <button
          className={`py-4 px-6 text-center border-b-2 font-medium text-lg ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onTabChange('overview')}
        >
          Overview
        </button>
        <button
          className={`py-4 px-6 text-center border-b-2 font-medium text-lg ${
            activeTab === 'professors'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onTabChange('professors')}
        >
          Professors
        </button>
        <button
          className={`py-4 px-6 text-center border-b-2 font-medium text-lg ${
            activeTab === 'grade'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onTabChange('grade')}
        >
          Grades
        </button>
      </nav>
    </div>
  );
} 