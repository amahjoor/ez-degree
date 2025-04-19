"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DegreeRequirements from "../components/DegreeRequirements";
import SemesterPlanner from "../components/SemesterPlanner";

// API configuration
const API_BASE_URL = '/api';

export default function PlanPage() {
  // State to track API availability
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'requirements' | 'planner'>('requirements');
  
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

  return (
    <main className="flex flex-col p-4 md:p-8">
      <h1 className="text-3xl font-bold text-center mb-2">Degree Planning</h1>
      <p className="text-center text-gray-600 mb-6">
        Plan your courses and track your degree progress
      </p>
      
      {/* Content Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex -mb-px justify-center">
            <button
              className={`py-4 px-6 font-medium text-lg border-b-2 ${
                activeTab === 'requirements'
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
              onClick={() => setActiveTab('requirements')}
            >
              Degree Requirements
            </button>
            <button
              className={`py-4 px-6 font-medium text-lg border-b-2 ${
                activeTab === 'planner'
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
              onClick={() => setActiveTab('planner')}
            >
              Semester Planner
            </button>
          </div>
        </div>
      </div>
      
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
      
      {/* Tab content */}
      {(isApiAvailable && !isLoading) && (
        <div className="w-full">
          {activeTab === 'requirements' ? (
            <DegreeRequirements 
              isApiAvailable={isApiAvailable} 
            />
          ) : (
            <SemesterPlanner />
          )}
        </div>
      )}
    </main>
  );
} 