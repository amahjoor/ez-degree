"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import SemesterPlanner, { SemesterPlannerHandle } from "../components/FourYearPlanner";
import DegreeRequirementsSidebar from "../components/sidebar/DegreeRequirementsSidebar";
import WeeklyCalendar, { WeeklyCalendarHandle } from '../components/SemesterCalendar';
import { SkeletonCard } from '../components/ui';
import { plannerSlotFromCatalogTerm } from '@/utils/academicTerms';
import { useAuth } from '../account/AuthContext';
import type { CourseEntry } from '../components/FourYearPlanner';
import type { ClassSession } from '../components/SemesterCalendar';

const API_BASE_URL = '/api';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function PlanPage() {
  const { user } = useAuth();
  const weeklyCalendarRef = useRef<WeeklyCalendarHandle>(null);
  const fourYearRef = useRef<Record<string, CourseEntry[]>>({});
  const weeklyRef = useRef<ClassSession[]>([]);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'login'>('idle');
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
  const [currentSemester, setCurrentSemester] = useState<string>('');
  
  // State to track time availability data
  const [availableDays, setAvailableDays] = useState<boolean[]>([true, true, true, true, true]);
  const [dayTimeRanges, setDayTimeRanges] = useState<Array<{start: number, end: number}>>([
    {start: 6, end: 23},
    {start: 6, end: 23},
    {start: 6, end: 23},
    {start: 6, end: 23},
    {start: 6, end: 23}
  ]);
  
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

  const queueSave = useCallback(() => {
    if (!user) {
      setSaveStatus('login');
      return;
    }
    if (!hydratedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/me/plan', {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            fourYear: fourYearRef.current,
            weekly: weeklyRef.current,
          }),
        });
        setSaveStatus(res.ok ? 'saved' : 'error');
      } catch {
        setSaveStatus('error');
      }
    }, 800);
  }, [user]);

  const handlePlanChange = useCallback((plan: Record<string, CourseEntry[]>) => {
    fourYearRef.current = plan;
    queueSave();
  }, [queueSave]);

  const handleScheduleChange = useCallback((sessions: ClassSession[]) => {
    weeklyRef.current = sessions;
    queueSave();
  }, [queueSave]);

  useEffect(() => {
    if (!user || isLoading || !isApiAvailable) {
      hydratedRef.current = false;
      if (!user) setSaveStatus('login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/me/plan', { headers: authHeaders() });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const fourYear = data.fourYear || {};
        const weekly = data.weekly || [];
        fourYearRef.current = fourYear;
        weeklyRef.current = weekly;
        semesterPlannerRef.current?.setPlan(fourYear);
        weeklyCalendarRef.current?.setClasses(weekly);
        setTimeout(() => {
          if (!cancelled) hydratedRef.current = true;
        }, 50);
        setSaveStatus('saved');
      } catch {
        if (!cancelled) setSaveStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isLoading, isApiAvailable]);

  // Update current semester and time availability when on weekly view
  useEffect(() => {
    if (activeView === 'weekly' && weeklyCalendarRef.current) {
      const semester = weeklyCalendarRef.current.getCurrentSemester();
      setCurrentSemester(semester);
      
      // Get time availability data
      const currentAvailableDays = weeklyCalendarRef.current.getAvailableDays();
      const currentDayTimeRanges = weeklyCalendarRef.current.getDayTimeRanges();
      setAvailableDays(currentAvailableDays);
      setDayTimeRanges(currentDayTimeRanges);
      
      // Set up an interval to sync the data periodically
      const interval = setInterval(() => {
        if (weeklyCalendarRef.current) {
          const currentSem = weeklyCalendarRef.current.getCurrentSemester();
          setCurrentSemester(currentSem);
          
          const newAvailableDays = weeklyCalendarRef.current.getAvailableDays();
          const newDayTimeRanges = weeklyCalendarRef.current.getDayTimeRanges();
          setAvailableDays(newAvailableDays);
          setDayTimeRanges(newDayTimeRanges);
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
              <p className="text-sm text-gray-500 px-3">
                {saveStatus === 'saving' && 'Saving…'}
                {saveStatus === 'saved' && 'Saved to your account'}
                {saveStatus === 'error' && 'Could not save'}
                {saveStatus === 'login' && (
                  <a href="/account/login" className="text-primary-blue underline">Log in to save</a>
                )}
              </p>
              
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
              <SemesterPlanner ref={semesterPlannerRef} onPlanChange={handlePlanChange} />
            </div>

            {/* Semester Schedule */}
            <div className={activeView === 'weekly' ? 'block' : 'hidden'}>
              <WeeklyCalendar ref={weeklyCalendarRef} onScheduleChange={handleScheduleChange} />
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
                    const mapping = plannerSlotFromCatalogTerm(term);
                    if (mapping) {
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
                availableDays={activeView === 'weekly' ? availableDays : undefined}
                dayTimeRanges={activeView === 'weekly' ? dayTimeRanges : undefined}
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