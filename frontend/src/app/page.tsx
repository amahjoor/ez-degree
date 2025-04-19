"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// API configuration
const API_BASE_URL = '/api';

export default function Home() {
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const router = useRouter();

  // Function to retry API connection
  const handleRetryConnection = () => {
    setIsApiAvailable(true);
  };

  // Navigation handlers
  const handleSearch = () => {
    router.push('/search');
  };

  const handlePlan = () => {
    router.push('/plan');
  };

  return (
    <main className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center px-4">
      <div className="z-10 max-w-3xl w-full">
        {/* API connection error message */}
        {!isApiAvailable && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2">API Connection Error</h2>
            <p className="mb-3">
              Unable to connect to the Course API. This is needed to show course information.
            </p>
            <div className="mb-3">
              <p className="font-semibold">Please ensure:</p>
              <ul className="list-disc ml-6 mt-1">
                <li>The API server is running with <code className="bg-red-50 px-2 py-1 rounded">uvicorn api.main:app --reload</code></li>
                <li>Your network connection is working</li>
                <li>The API is available at: <code className="bg-red-50 px-2 py-1 rounded">{API_BASE_URL}</code></li>
              </ul>
            </div>
            <div className="mt-4">
              <button 
                onClick={handleRetryConnection}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Hero content */}
        <div className="text-center">
          <h1 className="text-5xl mb-4 font-bold text-primary-green">Patriot Assist</h1>
          <p className="text-center text-xl mb-8">
            The ultimate tool for GMU students to graduate.
          </p>
          
          {/* Main action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-5 mt-6">
            <button 
              onClick={handleSearch}
              className="px-10 py-3 text-lg font-medium rounded-full bg-primary-blue text-white hover:bg-blue-700 shadow-lg transition-all"
            >
              Search
            </button>
            <button 
              onClick={handlePlan}
              className="px-10 py-3 text-lg font-medium rounded-full bg-primary-green text-white hover:bg-green-700 shadow-lg transition-all"
            >
              Plan
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
