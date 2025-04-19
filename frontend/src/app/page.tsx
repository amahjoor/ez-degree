"use client";

import { useState } from "react";
import Link from "next/link";
import CourseSearch from "./components/CourseSearch";
import DegreeRequirements from "./components/DegreeRequirements";
import Professors from "./components/Professors";

// API configuration
const API_BASE_URL = '/api';

export default function Home() {
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'requirements' | 'professors'>('courses');

  // Function to retry API connection
  const handleRetryConnection = () => {
    setIsApiAvailable(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-5xl mb-10 text-center font-bold text-primary-green">iWannaGraduate</h1>
        <p className="text-center text-lg mb-8">
          The ultimate tool to navigate your degree requirements and plan your path to graduation.
        </p>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'courses'
                ? 'bg-white border-l border-t border-r border-gray-200 text-primary-blue'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
            onClick={() => setActiveTab('courses')}
          >
            Course Search
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'requirements'
                ? 'bg-white border-l border-t border-r border-gray-200 text-primary-blue'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
            onClick={() => setActiveTab('requirements')}
          >
            Degree Requirements
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'professors'
                ? 'bg-white border-l border-t border-r border-gray-200 text-primary-blue'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
            onClick={() => setActiveTab('professors')}
          >
            Professors
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'courses' ? (
          <CourseSearch 
            isApiAvailable={isApiAvailable} 
            onApiConnectionRetry={handleRetryConnection} 
          />
        ) : activeTab === 'requirements' ? (
          <DegreeRequirements isApiAvailable={isApiAvailable} />
        ) : activeTab === 'professors' ? (
          <Professors />
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">Select a tab above to view content.</p>
          </div>
        )}
      </div>
    </main>
  );
}
