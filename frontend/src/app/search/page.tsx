"use client";

import { useState } from "react";
import Link from "next/link";
import CourseSearch from "../components/CourseSearch";
import Professors from "../components/Professors";

// API configuration
const API_BASE_URL = '/api';

export default function SearchPage() {
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'professors'>('courses');

  // Function to retry API connection
  const handleRetryConnection = () => {
    setIsApiAvailable(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="flex justify-center mb-8">
          <h1 className="text-3xl font-bold text-primary-green">Search</h1>
        </div>

        {/* Search Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex -mb-px">
              <button
                className={`py-4 px-6 font-medium text-lg border-b-2 ${
                  activeTab === 'courses'
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
                onClick={() => setActiveTab('courses')}
              >
                Search for Courses
              </button>
              <button
                className={`py-4 px-6 font-medium text-lg border-b-2 ${
                  activeTab === 'professors'
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
                onClick={() => setActiveTab('professors')}
              >
                Search for Professors
              </button>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'courses' ? (
          <CourseSearch 
            isApiAvailable={isApiAvailable} 
            onApiConnectionRetry={handleRetryConnection} 
          />
        ) : (
          <Professors />
        )}
      </div>
    </main>
  );
} 