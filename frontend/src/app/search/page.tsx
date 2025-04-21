"use client";

import { useState } from "react";
import SharedSearchTable from "../components/SharedSearchTable";
import { SkeletonCard } from '../components/ui';

// API configuration
const API_BASE_URL = '/api';

export default function SearchPage() {
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'professors'>('courses');

  // Function to retry API connection
  const handleRetryConnection = () => {
    setIsApiAvailable(true);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* API Error Message - similar to plan page */}
      {!isApiAvailable && !isLoading && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded">
          <h3 className="font-bold mb-2">API Connection Error</h3>
          <p className="mb-3">
            Cannot load search results. Please ensure the API server is running.
          </p>
          <button 
            onClick={handleRetryConnection}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      )}
      
      {/* Loading indicator - similar to plan page */}
      {isLoading && (
        <div className="p-4 space-y-4">
          <SkeletonCard hasHeader={true} hasImage={false} contentLines={1} className="h-32" />
          <SkeletonCard hasHeader={true} hasImage={false} contentLines={6} className="h-96" />
        </div>
      )}

      {/* Main content */}
      {(isApiAvailable && !isLoading) && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* View Toggle - similar styling to plan page */}
          <div className="bg-blue-50 border-b border-blue-100 flex-shrink-0">
            <div className="flex">
              <button
                className={`px-5 py-3 font-medium ${
                  activeTab === 'courses' 
                    ? 'text-primary-blue border-b-2 border-primary-blue' 
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }`}
                onClick={() => setActiveTab('courses')}
              >
                <h2 className="font-medium text-lg truncate">
                  Search for Courses
                </h2>
              </button>
              <button
                className={`px-5 py-3 font-medium ${
                  activeTab === 'professors' 
                    ? 'text-primary-blue border-b-2 border-primary-blue' 
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }`}
                onClick={() => setActiveTab('professors')}
              >
                <h2 className="font-medium text-lg truncate">
                  Search for Professors
                </h2>
              </button>
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              <SharedSearchTable 
                mode={activeTab}
                isApiAvailable={isApiAvailable}
                onApiConnectionRetry={handleRetryConnection}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 