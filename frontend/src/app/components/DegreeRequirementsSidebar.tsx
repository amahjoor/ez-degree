"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Select from 'react-select';
import { Major, Concentration, Requirements, RequirementCourse } from '@/types/course';

// API configuration
const API_BASE_URL = '/api';

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

  const handleRequirementClick = (requirement: Requirement) => {
    if (onCourseSelect) {
      // Extract credits from the requirement's matched course in requirements data
      let credits = 4; // Default fallback
      
      if (requirements) {
        // Search all categories for matching course code
        for (const category of requirements.categories) {
          const matchedCourse = category.courses.find(course => 
            course.code === requirement.id
          );
          
          if (matchedCourse) {
            credits = matchedCourse.credits;
            break;
          }
        }
      }
      
      onCourseSelect(requirement.id, requirement.title, credits);
    }
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
      zIndex: 10
    })
  };

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
    <div className="w-full bg-white rounded-lg overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-primary-blue text-white border-b border-blue-700 flex justify-between items-center">
        <div className="flex-1 flex items-center">
          <h2 className="font-medium text-lg truncate">
            {showMajorSelect ? "Select Program" : selectedMajorName}
          </h2>
        </div>
        <button 
          className="text-white hover:text-blue-200 ml-2"
          onClick={() => setShowMajorSelect(!showMajorSelect)}
          title={showMajorSelect ? "Close selection" : "Change major"}
        >
          {showMajorSelect ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Major and Concentration Selection Panel */}
      {showMajorSelect && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="mb-4">
            <label htmlFor="major-select" className="block text-sm font-medium text-gray-700 mb-1">
              Major:
            </label>
            <Select
              id="major-select"
              options={majorOptions}
              value={majorOptions.find(option => option.value === selectedMajor) || null}
              onChange={handleMajorChange}
              placeholder="Select major..."
              isDisabled={loading}
              isSearchable={true}
              isClearable={true}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={customSelectStyles}
              aria-label="Select a major"
            />
          </div>
          
          {concentrations.length > 0 && (
            <div>
              <label htmlFor="concentration-select" className="block text-sm font-medium text-gray-700 mb-1">
                Concentration:
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
            </div>
          )}
          
          <button 
            className="mt-4 w-full bg-primary-blue hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow"
            onClick={() => setShowMajorSelect(false)}
          >
            Apply
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-8 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-blue"></div>
          <p className="mt-2 text-sm text-gray-500">Loading requirements...</p>
        </div>
      )}

      {/* Error message */}
      {requirementsError && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="text-sm">{requirementsError}</p>
        </div>
      )}

      {/* Requirements list */}
      {!loading && !requirementsError && (
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
          {requirementGroups.length === 0 ? (
            <div className="p-4"></div>
          ) : (
            <>
              {/* Summary info */}
              {requirements && (
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">Total Credits Required: <span className="font-semibold text-primary-green">{requirements.total_credits}</span></p>
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
                    <div className="px-6 py-3 bg-gray-50">
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
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                    <div className="px-4 py-2 bg-gray-50 flex flex-wrap gap-2">
                      {group.requirements.map((req, reqIndex) => (
                        <div 
                          key={reqIndex}
                          className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded text-primary-blue text-sm font-medium cursor-grab hover:bg-blue-100 active:cursor-grabbing flex items-center shadow-sm hover:shadow-md transition-all"
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, req)}
                          onClick={() => handleRequirementClick(req)}
                          title={req.title}
                        >
                          <svg className="h-3.5 w-3.5 mr-2 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9v1h1a1 1 0 110 2H9v1h3a1 1 0 110 2H8a1 1 0 01-1-1v-1H4a1 1 0 110-2h3V9H6a1 1 0 110-2h1V6H4a1 1 0 010-2h3V3a1 1 0 011-1z"/>
                          </svg>
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
      )}
      
      {!loading && !requirementsError && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Drag courses to the planner or click to add them
          </p>
        </div>
      )}
    </div>
  );
};

export default DegreeRequirementsSidebar; 