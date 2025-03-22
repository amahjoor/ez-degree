"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

// API configuration
const API_BASE_URL = '/api';

interface Course {
  course_code: string;
  title: string;
  credits: number;
  description: string;
  subject: string;
}

interface Subject {
  id: string;
  name: string;
  course_count: number;
}

// Degree requirements types
type Major = {
  id: string;
  name: string;
};

type Concentration = {
  id: string;
  name: string;
};

type RequirementCourse = {
  code: string;
  title: string;
  credits: number;
  alternatives: any[];
};

type Category = {
  name: string;
  total_credits: number;
  courses: RequirementCourse[];
};

type Requirements = {
  degree_name: string;
  total_credits: number;
  categories: Category[];
  concentrations?: any[];
};

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);
  const subjectSearchInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const itemsPerPage = 10;

  // Degree requirements states
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [selectedConcentration, setSelectedConcentration] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [requirementsLoading, setRequirementsLoading] = useState<boolean>(false);
  const [requirementsError, setRequirementsError] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState<'courses' | 'requirements'>('courses');

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/subjects/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch subjects: ${response.statusText}`);
        }
        const data = await response.json();
        setSubjects(data);
        setIsApiAvailable(true);
      } catch (err) {
        setError("Failed to load subjects. Make sure the API server is running.");
        console.error(err);
        setIsApiAvailable(false);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch majors on component mount
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
        setRequirementsError('Error connecting to the requirements API. Please ensure the server is running.');
      } finally {
        setLoading(false);
      }
    }

    fetchMajors();
  }, []);

  // Fetch concentrations when a major is selected
  useEffect(() => {
    if (!selectedMajor || !isApiAvailable) {
      setConcentrations([]);
      setSelectedConcentration('');
      return;
    }

    async function fetchConcentrations() {
      try {
        const response = await fetch(`${API_BASE_URL}/requirements/majors/${selectedMajor}/concentrations`);
        
        if (!response.ok) {
          if (response.status === 404) {
            // It's OK if no concentrations are found - just set an empty array
            setConcentrations([]);
            return;
          } else {
            throw new Error(`Failed to fetch concentrations: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        setConcentrations(data.concentrations || []);
      } catch (error) {
        console.error('Error fetching concentrations:', error);
        setConcentrations([]);
      }
    }

    fetchConcentrations();
  }, [selectedMajor, isApiAvailable]);

  // Fetch requirements for selected major
  useEffect(() => {
    if (!selectedMajor || !isApiAvailable) return;

    async function fetchRequirements() {
      setRequirementsLoading(true);
      setRequirementsError('');
      
      try {
        // Add concentration_id as a query parameter if selected
        let url = `${API_BASE_URL}/requirements/majors/${selectedMajor}`;
        if (selectedConcentration) {
          url += `?concentration_id=${selectedConcentration}`;
        }
        
        const response = await fetch(url);
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
        setRequirementsError(error.message || 'Error loading requirements. Please try again later.');
        console.error('Error fetching requirements:', error);
      } finally {
        setRequirementsLoading(false);
      }
    }

    fetchRequirements();
  }, [selectedMajor, selectedConcentration, isApiAvailable]);

  // Toggle category expansion
  const toggleCategory = (categoryIndex: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [`category-${categoryIndex}`]: !prev[`category-${categoryIndex}`]
    }));
  };

  // Handle major selection change
  const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMajor(e.target.value);
    setSelectedConcentration(''); // Clear concentration when major changes
    setActiveTab('requirements'); // Switch to requirements tab
  };

  // Fetch courses when search, subject filters, or page changes
  useEffect(() => {
    if (!isApiAvailable) return;

    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Calculate pagination parameters
        const skip = (currentPage - 1) * itemsPerPage;
        const limit = itemsPerPage;
        
        // Construct URL with search, subject, and pagination parameters
        let url = `${API_BASE_URL}/courses/?skip=${skip}&limit=${limit}`;
        
        if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }
        
        if (selectedSubjects.length > 0) {
          selectedSubjects.forEach(subject => {
            url += `&subject=${encodeURIComponent(subject)}`;
          });
        }
        
        console.log(`Fetching courses from: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setCourses(data.courses);
        setTotalCourses(data.total);
        setIsApiAvailable(true);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch courses");
        setIsApiAvailable(false);
        setCourses([]);
        setTotalCourses(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [searchTerm, selectedSubjects, currentPage, isApiAvailable]);

  // Handle page change
  const handlePageChange = (page: number) => {
    window.scrollTo(0, 0); // Scroll to top when changing pages
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCourses / itemsPerPage);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const displayRange = 2; // Number of pages to show before and after current page
    
    // Always show page 1
    pageNumbers.push(1);
    
    // Calculate range of pages to show
    let rangeStart = Math.max(2, currentPage - displayRange);
    let rangeEnd = Math.min(totalPages - 1, currentPage + displayRange);
    
    // If current page is close to start, show more pages after
    if (currentPage - displayRange < 2) {
      rangeEnd = Math.min(totalPages - 1, rangeEnd + (2 - (currentPage - displayRange)));
    }
    
    // If current page is close to end, show more pages before
    if (currentPage + displayRange > totalPages - 1) {
      rangeStart = Math.max(2, rangeStart - ((currentPage + displayRange) - (totalPages - 1)));
    }
    
    // Add ellipsis if needed
    if (rangeStart > 2) {
      pageNumbers.push("...");
    }
    
    // Add range of pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis if needed
    if (rangeEnd < totalPages - 1) {
      pageNumbers.push("...");
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubjects]);

  // Function to retry API connection
  const handleRetryConnection = () => {
    setLoading(true);
    setError(null);
    setIsApiAvailable(true);
  };

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
  const filteredSubjects = useMemo(() => {
    if (!subjectSearchTerm) return subjects;
    return subjects.filter(subject => 
      subject.id.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
      subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase())
    );
  }, [subjects, subjectSearchTerm]);

  // Toggle subject selection
  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Handle subject search Enter key
  const handleSubjectSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && subjectSearchTerm) {
      // Find the first matching subject
      const matchingSubject = filteredSubjects.find(subject => 
        subject.id.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
        subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase())
      );
      
      if (matchingSubject) {
        toggleSubjectSelection(matchingSubject.id);
        setSubjectSearchTerm('');
      }
    }
  };

  // If API is not available, show a more helpful error message
  if (!isApiAvailable) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <h1 className="text-5xl mb-10 text-center font-bold">iWannaGraduate</h1>
          
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 mb-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">API Connection Error</h2>
            <p className="mb-4">
              Unable to connect to the Course API. This is needed to show course information.
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
                onClick={handleRetryConnection}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm"
              >
                Retry Connection
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Link href="/courses" className="group border bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all">
              <h2 className="text-2xl font-semibold mb-2 text-green-600 group-hover:text-green-700">
                Course Search
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  →
                </span>
              </h2>
              <p>
                Search for courses by subject, keyword, or course code. View detailed information about each course.
              </p>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Regular render with courses
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-5xl mb-10 text-center font-bold text-green-600">iWannaGraduate</h1>
        <p className="text-center text-lg mb-8">
          The ultimate tool to navigate your degree requirements and plan your path to graduation.
        </p>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'courses'
                ? 'bg-white border-l border-t border-r border-gray-200 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
            onClick={() => setActiveTab('courses')}
          >
            Course Search
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'requirements'
                ? 'bg-white border-l border-t border-r border-gray-200 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
            onClick={() => setActiveTab('requirements')}
          >
            Degree Requirements
          </button>
        </div>

        {activeTab === 'courses' ? (
          <>
            <div className="mb-8 bg-white shadow rounded-lg p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/2">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Courses
                  </label>
                  <input
                    type="text"
                    id="search"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter course code, title, or keywords"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="md:w-1/2">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Subject
                  </label>
                  <div ref={subjectDropdownRef} className="relative">
                    <div 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex justify-between items-center"
                      onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                    >
                      <span className="truncate">
                        {selectedSubjects.length === 0 
                          ? "All Subjects" 
                          : selectedSubjects.length === 1
                            ? subjects.find(s => s.id === selectedSubjects[0])?.id || "All Subjects"
                            : `${selectedSubjects.length} subjects selected`
                        }
                      </span>
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    
                    {isSubjectDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        <div className="sticky top-0 z-10 bg-white p-2">
                          <input
                            ref={subjectSearchInputRef}
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Search subjects"
                            value={subjectSearchTerm}
                            onChange={(e) => setSubjectSearchTerm(e.target.value)}
                            onKeyDown={handleSubjectSearchKeyDown}
                          />
                          <div className="mt-2 flex justify-between">
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-800"
                              onClick={() => setSelectedSubjects([])}
                            >
                              Clear all
                            </button>
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-800"
                              onClick={() => setSelectedSubjects(subjects.map(s => s.id))}
                            >
                              Select all
                            </button>
                          </div>
                        </div>
                        <div>
                          {filteredSubjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                              onClick={() => toggleSubjectSelection(subject.id)}
                            >
                              <input
                                type="checkbox"
                                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={selectedSubjects.includes(subject.id)}
                                readOnly
                              />
                              <span>{subject.id} - {subject.name} ({subject.course_count})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Course Results {!loading && (() => {
                    const start = (currentPage - 1) * itemsPerPage + 1;
                    const end = Math.min(currentPage * itemsPerPage, totalCourses);
                    return `(${start}-${end} of ${totalCourses})`;
                  })()}
                </h2>
                {!loading && totalCourses > 0 && (
                  <p className="text-gray-600">
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                  <p className="mt-2">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No courses found. Try adjusting your search criteria.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {courses.map((course) => (
                          <tr key={course.course_code} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
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
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        
                        {getPageNumbers().map((page, idx) => (
                          page === "..." ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={`page-${page}`}
                              onClick={() => handlePageChange(page as number)}
                              className={`relative inline-flex items-center px-4 py-2 border ${
                                currentPage === page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              } text-sm font-medium`}
                            >
                              {page}
                            </button>
                          )
                        ))}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Degree Requirements UI */}
            <div className="mb-8 bg-white shadow rounded-lg p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/2">
                  <label htmlFor="major-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select a Major:
                  </label>
                  <select
                    id="major-select"
                    value={selectedMajor}
                    onChange={handleMajorChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={requirementsLoading}
                  >
                    <option value="">-- Select a Major --</option>
                    {majors.map((major) => (
                      <option key={major.id} value={major.id}>
                        {major.name}
                      </option>
                    ))}
                  </select>
                </div>
                {concentrations.length > 0 && (
                  <div className="md:w-1/2">
                    <label htmlFor="concentration-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Select a Concentration:
                    </label>
                    <select
                      id="concentration-select"
                      value={selectedConcentration}
                      onChange={(e) => setSelectedConcentration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={requirementsLoading}
                    >
                      <option value="">-- All Requirements --</option>
                      {concentrations.map((concentration) => (
                        <option key={concentration.id} value={concentration.id}>
                          {concentration.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Error message */}
            {requirementsError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
                <p>{requirementsError}</p>
              </div>
            )}

            {/* Loading indicator */}
            {requirementsLoading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                <span className="ml-4 text-lg">Loading requirements...</span>
              </div>
            )}

            {/* Requirements display */}
            {!requirementsLoading && requirements && (
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
                                    <Link 
                                      href={`/courses/${encodeURIComponent(course.code.replace(/\u00a0/g, ' '))}`} 
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {course.code}
                                    </Link>
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
          </>
        )}
      </div>
    </main>
  );
}
