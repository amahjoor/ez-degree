"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Select from 'react-select';
import { Major, Concentration, Requirements, RequirementCourse } from '@/types/course';
import { SkeletonList, SkeletonCard } from '../components/ui';

// API configuration
const API_BASE_URL = '/api';

interface CourseDetails {
  course_code: string;
  title: string;
  credits: number;
  description?: string;
  professors?: Array<{
    firstName: string;
    lastName: string;
    avgRating: number;
    reviews?: Array<{
      grade?: string;
    }>;
  }>;
  mostCommonGrade?: string;
  totalReviews?: number;
}

interface RequirementGroup {
  title: string;
  isOpen: boolean;
  options?: string[];
  selectedOption?: string;
  isChoice?: boolean;
  requirements?: Requirement[];
}

interface Requirement {
  id: string;
  title: string;
  completed: boolean;
  credits?: number;
}

interface DegreeRequirementsSidebarProps {
  isApiAvailable: boolean;
  onCourseSelect?: (courseCode: string, title: string, credits: number) => void;
}

// Define option type for react-select
interface MajorOption {
  value: string;
  label: string;
}

// CourseOverlay Component
const CourseOverlay: React.FC<{
  courseCode: string;
  onClose: () => void;
  position: { x: number; y: number };
}> = ({ courseCode, onClose, position }) => {
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchCourseDetails() {
      try {
        setLoading(true);
        const response = await fetch(`http://127.0.0.1:8000/courses/${courseCode}`);
        if (!response.ok) {
          throw new Error("Failed to fetch course data");
        }
        const data = await response.json();
        setCourseData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError("Failed to load course details");
        setLoading(false);
      }
    }
    
    fetchCourseDetails();
  }, [courseCode]);
  
  // Calculate total reviews and most common grade if available
  useEffect(() => {
    if (courseData?.professors) {
      // Calculate most common grade
      const grades: Record<string, number> = {};
      let totalReviews = 0;
      
      courseData.professors.forEach(professor => {
        if (professor.reviews) {
          professor.reviews.forEach((review) => {
            if (review.grade) {
              grades[review.grade] = (grades[review.grade] || 0) + 1;
            }
            totalReviews++;
          });
        }
      });
      
      let mostCommonGrade = "N/A";
      let maxCount = 0;
      
      Object.entries(grades).forEach(([grade, count]) => {
        if (count > maxCount) {
          mostCommonGrade = grade;
          maxCount = count;
        }
      });
      
      setCourseData(prev => ({
        ...prev!,
        mostCommonGrade,
        totalReviews
      }));
    }
  }, [courseData?.professors]);
  
  // Calculate adjusted overlay position to ensure it stays within viewport
  const adjustPosition = () => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate initial position
    let x = position.x;
    let y = position.y;
    
    // Default offset values
    const offsetY = 10;
    const width = 400; // max width of overlay
    const height = 300; // estimated height of overlay
    
    // Adjust horizontal position if it would extend beyond right edge
    if (x + width/2 > viewportWidth) {
      x = viewportWidth - width/2 - 10; // 10px padding from right edge
    }
    
    // Adjust horizontal position if it would extend beyond left edge
    if (x - width/2 < 0) {
      x = width/2 + 10; // 10px padding from left edge
    }
    
    // Adjust vertical position based on available space
    // If not enough space above, show below the element
    if (y - height < 20) { // 20px minimum from top of viewport
      return {
        top: `${y + offsetY}px`,
        left: `${x}px`,
        transform: 'translate(-50%, 0)',
        marginTop: '0',
      };
    } else {
      // Default: show above the element
      return {
        top: `${y}px`,
        left: `${x}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: `-${offsetY}px`,
      };
    }
  };
  
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    maxWidth: '400px',
    width: '100%',
    ...adjustPosition()
  };
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.course-overlay') && !target.closest('.course-chip')) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  return (
    <div 
      className="course-overlay bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={overlayStyle}
    >
      <div className="relative">
        <button 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : courseData ? (
          <div>
            {/* Header with course code and grade */}
            <div className="flex justify-between items-center bg-blue-50 p-4 border-b border-blue-100">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{courseData.course_code}</h3>
                <p className="text-gray-600 text-sm">{courseData.credits} credits</p>
              </div>
              {courseData.mostCommonGrade && courseData.mostCommonGrade !== 'N/A' && (
                <div className="bg-primary-blue text-white text-2xl font-bold px-4 py-2 rounded-lg">
                  {courseData.mostCommonGrade}
                </div>
              )}
            </div>
            
            {/* Course details */}
            <div className="p-4">
              <h4 className="font-medium text-base mb-2">{courseData.title}</h4>
              
              {courseData.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {courseData.description}
                </p>
              )}
              
              {/* Professors preview */}
              {courseData.professors && courseData.professors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Top Professors:</p>
                  <div className="space-y-1">
                    {courseData.professors.slice(0, 2).map((prof, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm">{prof.firstName} {prof.lastName}</span>
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span className="text-sm font-medium">{prof.avgRating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Footer with link to full page */}
              <div className="mt-4 flex justify-between items-center pt-2 border-t border-gray-100">
                {courseData.totalReviews !== undefined && (
                  <span className="text-xs text-gray-500">
                    {courseData.totalReviews} {courseData.totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                )}
                <Link 
                  href={`/courses/${encodeURIComponent(courseData.course_code)}`}
                  className="text-primary-blue hover:text-blue-700 text-sm font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-gray-500">No course data available</div>
        )}
      </div>
    </div>
  );
};

const DegreeRequirementsSidebar: React.FC<DegreeRequirementsSidebarProps> = ({ 
  isApiAvailable,
  onCourseSelect
}) => {
  const [loading, setLoading] = useState(false);
  const [majors, setMajors] = useState<Major[]>([]);
  const [majorOptions, setMajorOptions] = useState<MajorOption[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [selectedConcentration, setSelectedConcentration] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [requirementsError, setRequirementsError] = useState<string>('');

  const [requirementGroups, setRequirementGroups] = useState<RequirementGroup[]>([]);
  const [showMajorSelect, setShowMajorSelect] = useState<boolean>(true);
  
  // Course overlay state
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');

  // Fetch majors on component mount
  useEffect(() => {
    if (!isApiAvailable) return;
    
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
        
        // Convert majors to react-select options format
        const options = data.majors?.map((major: Major) => ({
          value: major.id,
          label: major.name
        })) || [];
        setMajorOptions(options);
        
        // Don't auto-select any major by default
      } catch (error) {
        console.error('Error fetching majors:', error);
        setRequirementsError('Error connecting to the requirements API. Please ensure the server is running.');
      } finally {
        setLoading(false);
      }
    }

    fetchMajors();
  }, [isApiAvailable]);

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
      setLoading(true);
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
        
        // Convert API requirements to our sidebar format
        const convertedGroups: RequirementGroup[] = data.categories.map((category: any) => ({
          title: category.name,
          isOpen: false,
          requirements: category.courses.map((course: any) => ({
            id: course.code,
            title: `${course.code} - ${course.title}`,
            completed: false,
            credits: course.credits
          }))
        }));
        
        setRequirementGroups(convertedGroups);
      } catch (error: any) {
        setRequirementsError(error.message || 'Error loading requirements. Please try again later.');
        console.error('Error fetching requirements:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequirements();
  }, [selectedMajor, selectedConcentration, isApiAvailable]);

  const toggleGroup = (index: number) => {
    const updatedGroups = [...requirementGroups];
    updatedGroups[index].isOpen = !updatedGroups[index].isOpen;
    setRequirementGroups(updatedGroups);
  };

  const selectOption = (groupIndex: number, option: string) => {
    const updatedGroups = [...requirementGroups];
    updatedGroups[groupIndex].selectedOption = option;
    setRequirementGroups(updatedGroups);
  };

  const handleRequirementClick = (requirement: Requirement, event: React.MouseEvent) => {
    // Stop event propagation to prevent other click handlers from firing
    event.stopPropagation();
    event.preventDefault();
    
    // Get click position for overlay
    const rect = event.currentTarget.getBoundingClientRect();
    setOverlayPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    
    // Set selected course and show overlay
    setSelectedCourseCode(requirement.id);
    setOverlayVisible(true);
    
    // Don't call onCourseSelect since we're showing the overlay instead
    // The user can click "View Details" in the overlay to go to the full page
  };

  const handleMajorChange = (selectedOption: MajorOption | null) => {
    if (selectedOption) {
      setSelectedMajor(selectedOption.value);
      setSelectedConcentration(''); // Clear concentration when major changes
    } else {
      setSelectedMajor('');
    }
  };

  // Get the selected major name for display
  const selectedMajorName = selectedMajor 
    ? majors.find(m => m.id === selectedMajor)?.name || selectedMajor
    : "Select a Major";

  // Custom react-select styles
  const customSelectStyles = {
    control: (provided: any) => ({
      ...provided,
      borderColor: '#D1D5DB',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3B82F6'
      }
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
      color: state.isSelected ? 'white' : '#1F2937',
      cursor: 'pointer'
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
      width: 'calc(100% + 2rem)', // Match sidebar width (accounting for padding)
      margin: '0',
      borderRadius: '0 0 0.5rem 0.5rem',
      border: '1px solid #E5E7EB',
      borderTop: 'none',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      position: 'absolute',
      left: '-1rem', // Offset to account for sidebar padding
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: '0.5rem 0',
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999
    })
  };

  // Effect to set up menu portal target on component mount
  useEffect(() => {
    // This ensures the dropdown menu has access to document.body
    document.body.classList.add('react-select-body');
    
    return () => {
      document.body.classList.remove('react-select-body');
    };
  }, []);

  // Handle drag start for course
  const handleDragStart = (e: React.DragEvent, requirement: Requirement) => {
    // Extract course code and title
    const code = requirement.id;
    const title = requirement.title.replace(`${requirement.id} - `, '');
    const credits = requirement.credits || 4;
    
    // Create simplified data structure for the dragged course
    const courseData = {
      code: code,
      title: title,
      credits: credits
    };
    
    // Set the drag data as JSON string
    e.dataTransfer.setData('text/plain', JSON.stringify(courseData));
    
    // Set the drag effect
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Fixed header */}
      <div className="px-4 py-3 bg-blue-50 text-gray-800 border-b border-blue-100 flex-shrink-0 relative">
        {!selectedMajor || showMajorSelect ? (
          <Select
            id="major-select"
            options={majorOptions}
            value={majorOptions.find(option => option.value === selectedMajor) || null}
            onChange={(option) => {
              handleMajorChange(option);
              if (option) {
                setShowMajorSelect(false);
              }
            }}
            placeholder="Select Program..."
            isDisabled={loading}
            isSearchable={true}
            isClearable={true}
            className="react-select-container"
            classNamePrefix="react-select"
            styles={{
              ...customSelectStyles,
              control: (provided) => ({
                ...provided,
                border: 'none',
                boxShadow: 'none',
                backgroundColor: 'transparent',
                minHeight: '1.5rem',
                paddingLeft: '0.5rem',
                '&:hover': {
                  border: 'none'
                }
              }),
              valueContainer: (provided) => ({
                ...provided,
                padding: '0',
              }),
              input: (provided) => ({
                ...provided,
                fontSize: '1.125rem',
                fontWeight: '500',
                margin: '0',
                padding: '0',
              }),
              singleValue: (provided) => ({
                ...provided,
                fontSize: '1.125rem',
                fontWeight: '500',
                color: '#1F2937',
                margin: '0',
              }),
              placeholder: (provided) => ({
                ...provided,
                fontSize: '1.125rem',
                fontWeight: '500',
                color: '#4B5563',
                margin: '0',
              }),
              indicatorSeparator: () => ({
                display: 'none'
              }),
              dropdownIndicator: (provided) => ({
                ...provided,
                padding: '0 0 0 8px'
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 9999,
                width: 'calc(100% + 2rem)',
                margin: '0',
                borderRadius: '0 0 0.5rem 0.5rem',
                border: '1px solid #E5E7EB',
                borderTop: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                position: 'absolute',
                left: '-1rem',
              })
            }}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            menuPosition="fixed"
          />
        ) : (
          <div className="flex justify-between items-center pl-2">
            <h2 className="font-medium text-lg truncate">{selectedMajorName}</h2>
            <button 
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => {
                setSelectedMajor("");
                setSelectedConcentration("");
                setShowMajorSelect(true);
              }}
              title="Change program"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Major and Concentration Selection Panel - Only show if major not yet selected */}
        {showMajorSelect && selectedMajor && (
          <div className="p-4 bg-white border-b border-gray-200">
            {concentrations.length > 0 && (
              <div>
                <label htmlFor="concentration-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Concentration (optional):
                </label>
                <select
                  id="concentration-select"
                  value={selectedConcentration}
                  onChange={(e) => setSelectedConcentration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                  disabled={loading}
                >
                  <option value="">-- All Requirements --</option>
                  {concentrations.map((concentration) => (
                    <option key={concentration.id} value={concentration.id}>
                      {concentration.name}
                    </option>
                  ))}
                </select>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    className="font-medium py-2 px-4 rounded shadow bg-primary-blue hover:bg-blue-700 text-white"
                    onClick={() => setShowMajorSelect(false)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading state with skeletons */}
        {loading && (
          <div className="p-4">
            <SkeletonCard hasHeader={true} hasImage={false} contentLines={1} className="mb-4" />
            <SkeletonList items={6} hasImage={false} className="pl-2" />
          </div>
        )}

        {/* Error message */}
        {requirementsError && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="text-sm">{requirementsError}</p>
          </div>
        )}

        {/* Requirements list - Only show if not in select mode */}
        {!showMajorSelect && !loading && !requirementsError && (
          <div className="flex-col overflow-hidden">
            <div className="overflow-y-auto">
              {requirementGroups.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>No requirements found for this major</p>
                </div>
              ) : (
                <>
                  {/* Summary info */}
                  {requirements && (
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                      <p className="text-sm text-gray-700">Total Credits Required: <span className="font-semibold text-primary-blue">{requirements.total_credits}</span></p>
                    </div>
                  )}
                  
                  {requirementGroups.map((group, index) => (
                    <div key={index} className="border-b border-gray-200">
                      <div 
                        className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleGroup(index)}
                      >
                        <h3 className="text-gray-800 text-sm font-medium">{group.title}</h3>
                        <svg 
                          className={`w-5 h-5 text-gray-500 transform transition-transform ${group.isOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                        >
                          {group.isOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      </div>

                      {group.isOpen && group.isChoice && group.options && (
                        <div className="px-6 py-3">
                          <div className="mb-2 ml-2">
                            <div className="inline-flex items-center justify-center w-6 h-6 text-xs text-white bg-primary-green rounded-full">
                              1
                            </div>
                            <span className="ml-2 text-gray-600">Choose from the following options:</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {group.options.map((option, optionIndex) => (
                              <button
                                key={optionIndex}
                                className={`px-4 py-2 rounded-md ${
                                  group.selectedOption === option
                                    ? 'bg-primary-blue text-white'
                                    : 'bg-blue-50 text-primary-blue hover:bg-blue-100'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectOption(index, option);
                                }}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {group.isOpen && group.requirements && (
                        <div className="px-4 py-2 flex flex-wrap gap-2">
                          {group.requirements.map((req, reqIndex) => (
                            <div 
                              key={reqIndex}
                              className="course-chip bg-blue-50 border border-blue-100 px-3 py-1.5 rounded text-primary-blue text-sm font-medium cursor-pointer hover:bg-blue-100 flex items-center shadow-sm hover:shadow-md transition-all relative"
                              draggable="true"
                              onDragStart={(e) => handleDragStart(e, req)}
                              onClick={(e) => handleRequirementClick(req, e)}
                              title={req.title}
                            >
                              {req.id}
                              {req.completed && (
                                <span className="ml-2 text-green-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Course overlay - only render when visible */}
      {overlayVisible && (
        <CourseOverlay 
          courseCode={selectedCourseCode}
          position={overlayPosition}
          onClose={() => setOverlayVisible(false)}
        />
      )}
    </div>
  );
};

export default DegreeRequirementsSidebar; 