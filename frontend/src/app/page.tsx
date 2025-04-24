"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// API configuration
const API_BASE_URL = '/api';

export default function Home() {
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
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

  // Toggle help modal visibility
  const toggleHelpModal = () => {
    setShowHelpModal(!showHelpModal);
    
    // Toggle body scroll lock when modal opens/closes
    if (!showHelpModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
  
  // Ensure body scroll is restored when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <main className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center px-4 relative">
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
          <h1 className="text-5xl mb-4 font-bold text-primary-green">4yrplan</h1>
          <p className="text-center text-xl mb-8">
            Plan out your college courses easier than ever.
          </p>
          
          {/* Main action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-5 mt-6">
            <button
              onClick={handleSearch}
              className="px-10 py-3 text-lg font-medium rounded-full bg-primary-blue text-white hover:bg-primary-blue/90 shadow-lg transition-all"
            >
              Search
            </button>
            <button
              onClick={handlePlan}
              className="px-10 py-3 text-lg font-medium rounded-full bg-primary-green text-white hover:bg-primary-green/90 shadow-lg transition-all"
            >
              Plan
            </button>
          </div>
        </div>
      </div>
      
      {/* Help button moved to bottom of page */}
      <div className="absolute bottom-0"> 
        <button
          onClick={toggleHelpModal}
          className="text-primary-blue hover:text-primary-blue/80 text-md font-medium"
        >
          How to use 4yrplan
        </button>
      </div>
      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-primary-green">How to Use 4yrplan</h2>
                <button 
                  onClick={toggleHelpModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold text-primary-blue mb-2">Getting Started</h3>
                <p>4yrplan helps you easily plan your college courses and track degree requirements. Here's features that what we offer:</p>
                
                <div className="mt-4 mb-6">
                  <h4 className="font-medium text-lg text-primary-green">1. Search for Courses</h4>
                  <p>Use the <strong>Search</strong> feature to find and see details on courses and professors. Details include course description, prerequisites, professor information, grade distribution, and more.</p>
                  
                  <h4 className="font-medium text-lg text-primary-green mt-4">2. Create Your Plan</h4>
                  <p>Use the <strong>Plan</strong> feature to build your academic plans. You can plan out for upcoming semesters or the full 4 years. Drag and drop courses from the degree requirements sidebar into your plan.</p>                  
                </div>

                <div className="bg-primary-blue/5 p-4 rounded-lg mt-6">
                  <p>If you have questions or feedback, please send an email to <a href="mailto:hi@4yrplan.com" className="text-primary-blue hover:underline">hi@4yrplan.com</a> :)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
