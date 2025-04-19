"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import DegreeRequirements from "../components/DegreeRequirements";
import SemesterPlanner, { SemesterPlannerHandle } from "../components/SemesterPlanner";
import DegreeRequirementsSidebar from "../components/DegreeRequirementsSidebar";

// API configuration
const API_BASE_URL = '/api';

export default function PlanPage() {
  // State to track API availability
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFullDegreeRequirements, setShowFullDegreeRequirements] = useState<boolean>(false);
  
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
    // Add the selected course to the semester planner
    if (semesterPlannerRef.current) {
      semesterPlannerRef.current.addCourse(courseCode, courseTitle, courseCredits);
    }
  };

  // Handle drop events from degree sidebar to semester planner
  const handlePlannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      // Get the course data from the drag event
      const courseData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Add to semester planner if valid data is received
      if (courseData && courseData.code && semesterPlannerRef.current) {
        semesterPlannerRef.current.addCourse(
          courseData.code, 
          courseData.title, 
          courseData.credits
        );
      }
    } catch (error) {
      console.error('Error handling course drop:', error);
    }
  };

  // Allow drag over to enable dropping
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <main className="flex flex-col p-4 md:p-8">
      <h1 className="text-3xl font-bold text-center mb-2">Degree Planning</h1>
      <p className="text-center text-gray-600 mb-6">
        Plan your courses and track your degree progress
      </p>
      
      {/* API Error Message */}
      {!isApiAvailable && !isLoading && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
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
        <div className="flex justify-center items-center h-24 mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          <span className="ml-4">Checking API connection...</span>
        </div>
      )}
      
      {/* View toggle */}
      <div className="flex justify-end mb-4">
        <button
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          onClick={() => setShowFullDegreeRequirements(!showFullDegreeRequirements)}
        >
          {showFullDegreeRequirements ? "Back to Planner" : "View Full Degree Requirements"}
        </button>
      </div>

      {/* Main content */}
      {(isApiAvailable && !isLoading) && (
        <div className="w-full">
          {showFullDegreeRequirements ? (
            <DegreeRequirements isApiAvailable={isApiAvailable} />
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <div 
                className="lg:w-2/3"
                onDragOver={(e) => e.preventDefault()}
              >
                <SemesterPlanner ref={semesterPlannerRef} />
              </div>
              <div className="lg:w-1/3 mt-6 lg:mt-0">
                <DegreeRequirementsSidebar 
                  isApiAvailable={isApiAvailable}
                  onCourseSelect={handleCourseSelect}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
} 