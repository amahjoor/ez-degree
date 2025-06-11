"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import SemesterPlanner, { SemesterPlannerHandle } from "../components/FourYearPlanner";
import DegreeRequirementsSidebar from "../components/sidebar/DegreeRequirementsSidebar";
import WeeklyCalendar, { WeeklyCalendarHandle } from '../components/SemesterCalendar';
import { SkeletonCard } from '../components/ui';

// API configuration
const API_BASE_URL = '/api';

export default function PlanPage() {
  const weeklyCalendarRef = useRef<WeeklyCalendarHandle>(null);
  // State to track API availability
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // State to track which view is active
  const [activeView, setActiveView] = useState<'long-term' | 'weekly'>('long-term');
  
  // Reference to SemesterPlanner for adding courses
  const semesterPlannerRef = useRef<SemesterPlannerHandle>(null);
  
  // State to track sidebar collapse
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // State to track current semester for the course overlay
  const [currentSemester, setCurrentSemester] = useState<string>('Summer 2025');
  
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

  // Update current semester when on weekly view
  useEffect(() => {
    if (activeView === 'weekly' && weeklyCalendarRef.current) {
      const semester = weeklyCalendarRef.current.getCurrentSemester();
      setCurrentSemester(semester);
      
      // Set up an interval to sync the semester periodically
      const interval = setInterval(() => {
        if (weeklyCalendarRef.current) {
          const currentSem = weeklyCalendarRef.current.getCurrentSemester();
          setCurrentSemester(currentSem);
        }
      }, 1000); // Check every second
      
      return () => clearInterval(interval);
    }
  }, [activeView]);



  // Function to handle adding a course from the requirements list
  const handleCourseSelect = (courseCode: string, courseTitle: string, courseCredits: number) => {
    if (activeView === 'long-term' && semesterPlannerRef.current) {
      semesterPlannerRef.current.addCourse(courseCode, courseTitle, courseCredits);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
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
        <div className="p-4 space-y-4">
          <SkeletonCard hasHeader={true} hasImage={false} contentLines={1} className="h-32" />
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-3/4">
              <SkeletonCard hasHeader={true} hasImage={false} contentLines={6} className="h-96" />
            </div>
            <div className="md:w-1/4">
              <SkeletonCard hasHeader={true} hasImage={false} contentLines={3} className="h-96" />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {(isApiAvailable && !isLoading) && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* View Toggle and Sidebar Control */}
          <div className="bg-primary-blue/5 border-b border-primary-blue/10 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex">
                <button
                  className={`px-5 py-3 font-medium ${
                    activeView === 'long-term' 
                      ? 'text-primary-blue border-b-2 border-primary-blue' 
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                  }`}
                  onClick={() => setActiveView('long-term')}
                >
                  <h2 className="font-medium text-lg truncate">
                    4-Year Plan
                  </h2>
                </button>
                <button
                  className={`px-5 py-3 font-medium ${
                    activeView === 'weekly' 
                      ? 'text-primary-blue border-b-2 border-primary-blue' 
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                  }`}
                  onClick={() => setActiveView('weekly')}
                >
                  <h2 className="font-medium text-lg truncate">
                    Semester Schedule
                  </h2>
                </button>
              </div>
              
              {/* Sidebar Toggle Button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`flex items-center px-5 py-3 ${
                  isSidebarCollapsed ? 'text-gray-500 hover:text-gray-700' : 'text-primary-blue'
                } mr-2`}
                title={isSidebarCollapsed ? "Show requirements sidebar" : "Hide requirements sidebar"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isSidebarCollapsed ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
                  />
                </svg>
                <h2 className="font-medium text-lg truncate">
                  Requirements
                </h2>
              </button>
            </div>
          </div>
            
          {/* Content and Sidebar Container */}
          <div className="flex flex-1 overflow-hidden">
            {/* Main content area */}
            <div className="flex-1 h-full overflow-hidden">
            <div className="h-full overflow-auto">
            {/* 4-Year Plan */}
            <div className={activeView === 'long-term' ? 'block' : 'hidden'}>
              <SemesterPlanner ref={semesterPlannerRef} />
            </div>

            {/* Semester Schedule */}
            <div className={activeView === 'weekly' ? 'block' : 'hidden'}>
              <WeeklyCalendar ref={weeklyCalendarRef} />
            </div>
        </div>
            </div>
            
            {/* Sidebar - preserve state but toggle display instantly */}
            <div className={`${isSidebarCollapsed ? 'w-0 overflow-hidden border-0' : 'w-1/4 border-l border-gray-200'} h-full`}>
              <div className={`${isSidebarCollapsed ? 'invisible' : 'visible'} w-full h-full`}>
              <DegreeRequirementsSidebar
                onCourseSelect={handleCourseSelect}
                onAddSessions={(sessions, term) => {
                  if (activeView === 'weekly' && weeklyCalendarRef.current) {
                    // Add to weekly calendar regardless of term for now
                    // In a more advanced implementation, you could switch to the correct term view
                    weeklyCalendarRef.current.addSessions(sessions);
                  } else if (activeView === 'long-term' && semesterPlannerRef.current && term) {
                    // Add to 4-year plan - map term to year/semester
                    const termMapping: Record<string, { year: number; semester: string }> = {
                      'Summer 2025': { year: 1, semester: 'Summer' },
                      'Fall 2025': { year: 1, semester: 'Fall' },
                      'Spring 2026': { year: 1, semester: 'Spring' },
                      // Add more mappings as needed
                    };
                    
                    const mapping = termMapping[term];
                    if (mapping) {
                      // Add each session as a course to the appropriate semester
                      sessions.forEach(session => {
                        semesterPlannerRef.current?.addCourse(
                          session.courseCode,
                          session.title,
                          session.credits || 3,
                          mapping.year,
                          mapping.semester
                        );
                      });
                    }
                  }
                }}
                currentSemester={activeView === 'weekly' ? currentSemester : undefined}
                isApiAvailable={isApiAvailable}
                onApiConnectionRetry={checkApiConnection}
              />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 