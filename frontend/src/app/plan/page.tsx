"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import SemesterPlanner, { SemesterPlannerHandle } from "../components/SemesterPlanner";
import DegreeRequirementsSidebar from "../components/DegreeRequirementsSidebar";
import WeeklyCalendar from "../components/WeeklyCalendar";

// API configuration
const API_BASE_URL = '/api';

export default function PlanPage() {
  // State to track API availability
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // State to track which view is active
  const [activeView, setActiveView] = useState<'long-term' | 'weekly'>('long-term');
  
  // Reference to SemesterPlanner for adding courses
  const semesterPlannerRef = useRef<SemesterPlannerHandle>(null);
  
  // Function to check if the API is available
  const checkApiConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to fetch health endpoint
      const healthResponse = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (healthResponse.ok) {
        setIsApiAvailable(true);
      } else {
        // If health endpoint fails, try the majors endpoint as backup
        try {
          const majorsResponse = await fetch(`${API_BASE_URL}/requirements/majors`, { 
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          });
          setIsApiAvailable(majorsResponse.ok);
        } catch (fallbackError) {
          console.error('API fallback check failed:', fallbackError);
          setIsApiAvailable(false);
        }
      }
    } catch (error) {
      console.error('API connection error:', error);
      setIsApiAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Check API connection on component mount
  useEffect(() => {
    checkApiConnection();
  }, [checkApiConnection]);

  // Function to handle adding a course from the requirements list
  const handleCourseSelect = (courseCode: string, courseTitle: string, courseCredits: number) => {
    // Add the selected course to the semester planner or weekly calendar
    if (activeView === 'long-term' && semesterPlannerRef.current) {
      semesterPlannerRef.current.addCourse(courseCode, courseTitle, courseCredits);
    }
    // For weekly view, we could implement a different way to add courses
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-gray-50">
      {/* API Error Message */}
      {!isApiAvailable && !isLoading && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded">
          <h3 className="font-bold mb-2">API Connection Error</h3>
          <p className="mb-3">
            Cannot load degree requirements. Please ensure the API server is running.
          </p>
          <button 
            onClick={checkApiConnection}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center h-24 m-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          <span className="ml-4">Checking API connection...</span>
        </div>
      )}

      {/* Main content */}
      {(isApiAvailable && !isLoading) && (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
          {/* Main planner area */}
          <div className="lg:w-3/4 flex flex-col overflow-hidden">
            {/* View Toggle */}
            <div className="flex items-center border-b border-gray-200 bg-white px-4">
              <button
                className={`py-3 px-5 ${
                  activeView === 'long-term' 
                    ? 'border-b-2 border-primary-blue text-primary-blue font-medium' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveView('long-term')}
              >
                4-Year Plan
              </button>
              <button
                className={`py-3 px-5 ${
                  activeView === 'weekly' 
                    ? 'border-b-2 border-primary-blue text-primary-blue font-medium' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveView('weekly')}
              >
                Weekly Schedule
              </button>
            </div>
            
            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
              {activeView === 'long-term' ? (
                <div className="p-4">
                  <SemesterPlanner ref={semesterPlannerRef} />
                </div>
              ) : (
                <WeeklyCalendar onCourseSelect={handleCourseSelect} />
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/4 border-l border-gray-200 h-full overflow-hidden">
            <DegreeRequirementsSidebar 
              isApiAvailable={isApiAvailable}
              onCourseSelect={handleCourseSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
} 