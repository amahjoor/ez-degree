"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SkeletonTable } from './ui/SkeletonTable';
import PaginationControls from "./PaginationControls";
import { Course, Subject } from "@/types/course";
import { Professor } from "@/types/professor";

// API configuration
const API_BASE_URL = '/api';

interface SharedSearchTableProps {
  mode: 'courses' | 'professors';
  isApiAvailable: boolean;
  onApiConnectionRetry: () => void;
}

const SharedSearchTable: React.FC<SharedSearchTableProps> = ({ 
  mode,
  isApiAvailable, 
  onApiConnectionRetry 
}) => {
  // Common state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 10;

  // Course-specific state
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);
  const subjectSearchInputRef = useRef<HTMLInputElement>(null);

  // Professor-specific state
  const [professors, setProfessors] = useState<Professor[]>([]);

  // Reset page when search mode changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
    setSelectedSubjects([]);
    setLoading(true);
  }, [mode]);

  // Fetch subjects for course search
  useEffect(() => {
    if (!isApiAvailable || mode !== 'courses') return;

    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/subjects/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch subjects: ${response.statusText}`);
        }
        const data = await response.json();
        setSubjects(data);
      } catch (err) {
        setError("Failed to load subjects. Make sure the API server is running.");
        console.error(err);
      }
    };

    fetchSubjects();
  }, [isApiAvailable, mode]);

  // Fetch data based on mode
  useEffect(() => {
    if (!isApiAvailable) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Calculate pagination parameters
        const skip = (currentPage - 1) * itemsPerPage;
        const limit = itemsPerPage;
        
        if (mode === 'courses') {
          // Fetch courses
          let url = `${API_BASE_URL}/courses/?skip=${skip}&limit=${limit}`;
          
          if (searchTerm) {
            url += `&search=${encodeURIComponent(searchTerm)}`;
          }
          
          if (selectedSubjects.length > 0) {
            selectedSubjects.forEach(subject => {
              url += `&subject=${encodeURIComponent(subject)}`;
            });
          }
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          setCourses(data.courses);
          setTotalItems(data.total);
        } else {
          // Fetch professors
          const url = `${API_BASE_URL}/professors?skip=${skip}&limit=${limit}${
            searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
          }`;
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          setProfessors(data.professors);
          setTotalItems(data.total);
        }
      } catch (err) {
        console.error(`Error fetching ${mode}:`, err);
        setError(err instanceof Error ? err.message : `Failed to fetch ${mode}`);
        if (mode === 'courses') {
          setCourses([]);
        } else {
          setProfessors([]);
        }
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mode, searchTerm, selectedSubjects, currentPage, isApiAvailable]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubjects]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
        setIsSubjectDropdownOpen(false);
        setSubjectSearchTerm(''); // Clear search term when closing dropdown
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isSubjectDropdownOpen && subjectSearchInputRef.current) {
      subjectSearchInputRef.current.focus();
    }
  }, [isSubjectDropdownOpen]);

  // Filter subjects based on search term
  const filteredSubjects = React.useMemo(() => {
    if (!subjectSearchTerm) return subjects;
    return subjects.filter(subject => 
      subject.id.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
      subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase())
    );
  }, [subjects, subjectSearchTerm]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Toggle subject selection
  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // If API is not available, show a helpful error message
  if (!isApiAvailable) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 mb-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">API Connection Error</h2>
        <p className="mb-4">
          Unable to connect to the API. This is needed to show {mode} information.
        </p>
        <div className="mb-4">
          <p className="font-semibold">Please ensure:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>The API server is running with <code className="bg-red-50 px-2 py-1 rounded">uvicorn api.main:app --reload</code></li>
            <li>Your network connection is working</li>
            <li>The API is available at: <code className="bg-red-50 px-2 py-1 rounded">{API_BASE_URL}</code></li>
          </ul>
        </div>
        <div className="mt-6">
          <button 
            onClick={onApiConnectionRetry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div className="flex flex-col md:flex-row md:w-full md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex w-full md:mr-4">
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
              placeholder={mode === 'courses' ? "Search for courses..." : "Search professors by name or department..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          {/* Subject Filter Dropdown - Only for courses */}
          {mode === 'courses' && (
            <div className="relative flex-shrink-0" ref={subjectDropdownRef}>
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
              >
                {selectedSubjects.length === 0 ? (
                  "Filter by Subject"
                ) : (
                  `${selectedSubjects.length} Subject${selectedSubjects.length > 1 ? 's' : ''}`
                )}
              </button>
              
              {isSubjectDropdownOpen && (
                <div className="absolute right-0 z-10 mt-1 w-72 bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                  <div className="px-3 py-2 border-b">
                    <input
                      ref={subjectSearchInputRef}
                      type="text"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                      placeholder="Search subjects..."
                      value={subjectSearchTerm}
                      onChange={(e) => setSubjectSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && subjectSearchTerm) {
                          const matchingSubject = filteredSubjects.find(subject => 
                            subject.id.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
                            subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase())
                          );
                          
                          if (matchingSubject) {
                            toggleSubjectSelection(matchingSubject.id);
                            setSubjectSearchTerm('');
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="py-1 max-h-40 overflow-y-auto">
                    {filteredSubjects.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No subjects found</div>
                    ) : (
                      filteredSubjects.map((subject) => (
                        <div
                          key={subject.id}
                          onClick={() => toggleSubjectSelection(subject.id)}
                          className={`px-3 py-2 flex items-center hover:bg-gray-100 cursor-pointer ${
                            selectedSubjects.includes(subject.id)
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-blue focus:ring-primary-blue border-gray-300 rounded"
                            checked={selectedSubjects.includes(subject.id)}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="ml-3 block truncate text-sm">
                            {subject.id} - {subject.name}
                          </span>
                          <span className="ml-auto text-xs text-gray-500">
                            {subject.course_count} courses
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedSubjects.length > 0 && (
                    <div className="px-3 py-2 border-t">
                      <button
                        type="button"
                        className="text-xs text-primary-blue hover:text-blue-700"
                        onClick={() => setSelectedSubjects([])}
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display - Only for courses */}
      {mode === 'courses' && selectedSubjects.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {selectedSubjects.map(subjectId => {
            const subject = subjects.find(s => s.id === subjectId);
            return (
              <span 
                key={subjectId}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-primary-blue"
              >
                {subject?.id || subjectId}
                <button 
                  type="button" 
                  className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary-blue hover:text-blue-600 focus:outline-none"
                  onClick={() => setSelectedSubjects(prev => prev.filter(id => id !== subjectId))}
                >
                  <span className="sr-only">Remove filter for {subjectId}</span>
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            );
          })}
          <button 
            onClick={() => setSelectedSubjects([])}
            className="text-xs text-primary-blue hover:text-blue-700 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      <div className="mt-4">
        {loading ? (
          <SkeletonTable 
            rows={10} 
            columns={mode === 'courses' ? 4 : 6} 
            hasHeader={true} 
            className="animate-pulse" 
          />
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {mode === 'courses' ? (
                      // Course table headers
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">
                          Course Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credits
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                      </>
                    ) : (
                      // Professor table headers
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Would Take Again</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mode === 'courses' ? (
                    // Course rows
                    courses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                          No courses found. Try adjusting your search criteria.
                        </td>
                      </tr>
                    ) : (
                      courses.map((course) => (
                        <tr key={course.course_code} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-blue font-mono">
                            <Link href={`/courses/${encodeURIComponent(course.course_code)}`}>
                              {course.course_code}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {course.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {course.credits}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {course.subject}
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    // Professor rows
                    professors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                          No professors found. Try adjusting your search criteria.
                        </td>
                      </tr>
                    ) : (
                      professors.map((professor) => (
                        <tr 
                          key={`${professor.firstName}-${professor.lastName}-${professor.department}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link 
                              href={`/professors/${professor.url?.split('/').pop() || ''}`}
                              className="text-sm font-medium text-primary-blue hover:text-blue-700"
                            >
                              {professor.firstName} {professor.lastName}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{professor.department}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{professor.avgRating.toFixed(1)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{professor.avgDifficulty.toFixed(1)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {professor.wouldTakeAgainPercent === -1 ? 'N/A' : `${professor.wouldTakeAgainPercent}%`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {Object.keys(professor.reviews).length} {Object.keys(professor.reviews).length > 1 ? 'courses' : 'course'}
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationControls 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default SharedSearchTable; 