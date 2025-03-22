'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Define types for our data
type Major = {
  id: string;
  name: string;
};

type Course = {
  code: string;
  title: string;
  credits: number;
  alternatives: any[];
};

type Category = {
  name: string;
  total_credits: number;
  courses: Course[];
};

type Requirements = {
  degree_name: string;
  total_credits: number;
  categories: Category[];
};

export default function RequirementsPage() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);

  // Fetch list of majors
  useEffect(() => {
    async function fetchMajors() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/requirements/majors`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Major requirements API endpoint not found');
          } else {
            throw new Error(`Failed to fetch majors: ${response.statusText}`);
          }
        }
        const data = await response.json();
        setMajors(data.majors);
        setIsApiAvailable(true);
      } catch (error) {
        console.error('Error fetching majors:', error);
        setIsApiAvailable(false);
        setError('Error connecting to the requirements API. Please ensure the server is running.');
      } finally {
        setLoading(false);
      }
    }

    fetchMajors();
  }, []);

  // Fetch requirements for selected major
  useEffect(() => {
    if (!selectedMajor || !isApiAvailable) return;

    async function fetchRequirements() {
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`${API_BASE_URL}/requirements/majors/${selectedMajor}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Requirements for ${selectedMajor} not found`);
          } else {
            throw new Error(`Failed to fetch requirements: ${response.statusText}`);
          }
        }
        const data = await response.json();
        setRequirements(data);
        
        // Initialize all categories as expanded using indexes
        const initialExpandedState = {} as {[key: string]: boolean};
        data.categories.forEach((category: Category, index: number) => {
          initialExpandedState[`category-${index}`] = true;
        });
        setExpandedCategories(initialExpandedState);
      } catch (error: any) {
        setError(error.message || 'Error loading requirements. Please try again later.');
        console.error('Error fetching requirements:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequirements();
  }, [selectedMajor, isApiAvailable]);

  // Toggle category expansion
  const toggleCategory = (categoryIndex: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [`category-${categoryIndex}`]: !prev[`category-${categoryIndex}`]
    }));
  };

  // If API is not available, show a more helpful error message
  if (!isApiAvailable && !loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">GMU Degree Requirements</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
          <h2 className="text-lg font-bold">API Connection Error</h2>
          <p className="mt-2">Unable to connect to the requirements API. Please ensure:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>The API server is running</li>
            <li>Try refreshing the page</li>
            <li>Contact the administrator if the problem persists</li>
          </ul>
          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-green-600 hover:text-green-800">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">GMU Degree Requirements</h1>
      
      {/* Major selection */}
      <div className="mb-8">
        <label htmlFor="major-select" className="block text-lg font-medium mb-2">
          Select a Major:
        </label>
        <select
          id="major-select"
          value={selectedMajor}
          onChange={(e) => setSelectedMajor(e.target.value)}
          className="w-full md:w-1/2 p-2 border rounded-md bg-white"
          disabled={loading}
        >
          <option value="">-- Select a Major --</option>
          {majors.map((major) => (
            <option key={major.id} value={major.id}>
              {major.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <span className="ml-4 text-lg">Loading...</span>
        </div>
      )}

      {/* Requirements display */}
      {!loading && requirements && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-2">{requirements.degree_name}</h2>
          <p className="text-lg mb-6">Total Credits: {requirements.total_credits}</p>
          
          <div className="space-y-6">
            {requirements.categories.map((category, categoryIndex) => (
              <div key={`category-${categoryIndex}`} className="border rounded-md overflow-hidden">
                <div 
                  className="bg-gray-100 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleCategory(categoryIndex)}
                >
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                  <div className="flex items-center">
                    <span className="mr-3">{category.total_credits} credits</span>
                    <svg 
                      className={`w-6 h-6 transform transition-transform ${expandedCategories[`category-${categoryIndex}`] ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {expandedCategories[`category-${categoryIndex}`] && (
                  <div className="p-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credits
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {category.courses.map((course, courseIndex) => (
                          <tr key={`category-${categoryIndex}-course-${courseIndex}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {course.code}
                            </td>
                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                              {course.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {course.credits}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <Link href="/" className="text-green-600 hover:text-green-800">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
} 