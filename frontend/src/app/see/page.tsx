"use client";

import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import dynamic from 'next/dynamic';
import { SkeletonCard, Skeleton, SkeletonText, SkeletonGraph } from '../components/ui';

// Import Select dynamically to avoid SSR hydration issues
const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => (
    <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
      <Skeleton height="1.5rem" width="60%" />
    </div>
  )
}) as any;

import { Major, Concentration, Requirements } from '@/types/course';
import { getCourseCategory, normalizeCourseId, addEdgeIfNotExists } from '@/utils/courseUtils';
import FlowGraph from '../components/graph/FlowGraph';

// API configuration
const API_BASE_URL = '/api';

// Colors for different categories
const colors = [
  '#e6f7ff', '#fff7e6', '#f6ffe6', '#ffe6e6', '#e6e6ff', 
  '#ffe6f7', '#f7ffe6', '#e6ffe6', '#e6ffff', '#ffe6ff'
];

interface MajorOption {
  value: string;
  label: string;
}

interface OptimizedCourse {
  code: string;
  title: string;
  credits: string | number;
  category: string;
  prerequisites?: string;
  corequisites?: string;
  description?: string;
  restrictions?: string;
  notes?: string;
}

interface ComprehensiveData {
  majors: Major[];
  course_dependencies: Record<string, OptimizedCourse>;
  degree_requirements: Record<string, Requirements>;
  metadata: {
    scraped_at: string;
    total_majors: number;
    total_courses: number;
    api_version: string;
  };
}

export default function SeePage() {
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveData | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [selectedConcentration, setSelectedConcentration] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [graphLoading, setGraphLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [reactFlowElements, setReactFlowElements] = useState<any[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [showInfoTooltip, setShowInfoTooltip] = useState<boolean>(false);
  const [isOptimized, setIsOptimized] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [connectionFilter, setConnectionFilter] = useState<number>(0); // 0 means no filter
  const [showPrereqsCoreqs, setShowPrereqsCoreqs] = useState<boolean>(false);
  const [showUnlocks, setShowUnlocks] = useState<boolean>(false);
  const [hideFirstDegreeConnections, setHideFirstDegreeConnections] = useState<boolean>(false);

  // Fetch comprehensive data on component mount
  useEffect(() => {
    async function fetchComprehensiveData() {
      try {
        setLoading(true);
        
        // Try to fetch optimized comprehensive data first
        const response = await fetch(`${API_BASE_URL}/degree-visualization/comprehensive-data`);
        
        if (response.ok) {
          const data = await response.json();
          setComprehensiveData(data);
          setIsOptimized(true);
        } else {
          // Fallback to original API
          const majorsResponse = await fetch(`${API_BASE_URL}/requirements/majors`);
          if (!majorsResponse.ok) {
            throw new Error(`Failed to fetch majors: ${majorsResponse.statusText}`);
          }
          const majorsData = await majorsResponse.json();
          setComprehensiveData({
            majors: majorsData.majors,
            course_dependencies: {},
            degree_requirements: {},
            metadata: {
              scraped_at: new Date().toISOString(),
              total_majors: majorsData.majors.length,
              total_courses: 0,
              api_version: "1.0"
            }
          });
          setIsOptimized(false);
        }
      } catch (error) {
        console.error('Error fetching comprehensive data:', error);
        setError('Error connecting to the degree visualization API. Please ensure the server is running.');
        setIsApiAvailable(false);
      } finally {
        setLoading(false);
      }
    }

    fetchComprehensiveData();
  }, []);

  // Update concentrations when major is selected
  useEffect(() => {
    if (!selectedMajor || !comprehensiveData || !isApiAvailable) {
      setConcentrations([]);
      setSelectedConcentration('');
      return;
    }

    // If using optimized data, extract concentrations directly
    if (isOptimized && comprehensiveData.degree_requirements[selectedMajor]) {
      const majorReqs = comprehensiveData.degree_requirements[selectedMajor];
      const majorConcentrations = majorReqs.concentrations || [];
      setConcentrations(majorConcentrations.map(conc => ({
        id: conc.id,
        name: conc.name
      })));
    } else {
      // Fallback to API call
      async function fetchConcentrations() {
        try {
          const response = await fetch(`${API_BASE_URL}/requirements/majors/${selectedMajor}/concentrations`);
          if (response.ok) {
            const data = await response.json();
            setConcentrations(data.concentrations || []);
          }
        } catch (error) {
          console.error('Error fetching concentrations:', error);
          setConcentrations([]);
        }
      }
      fetchConcentrations();
    }
  }, [selectedMajor, comprehensiveData, isOptimized, isApiAvailable]);

  // Fetch requirements for selected major
  useEffect(() => {
    if (!selectedMajor || !comprehensiveData || !isApiAvailable) return;

    async function fetchRequirements() {
      setLoading(true);
      setError('');
      
      try {
        if (isOptimized) {
          // Use optimized endpoint
          let url = `${API_BASE_URL}/degree-visualization/major/${selectedMajor}`;
          if (selectedConcentration) {
            url += `?concentration_id=${selectedConcentration}`;
          }
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch optimized requirements: ${response.statusText}`);
          }
          const data = await response.json();
          setRequirements(data);
        } else {
          // Fallback to original API
          let url = `${API_BASE_URL}/requirements/majors/${selectedMajor}`;
          if (selectedConcentration) {
            url += `?concentration_id=${selectedConcentration}`;
          }
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch requirements: ${response.statusText}`);
          }
          const data = await response.json();
          setRequirements(data);
        }
      } catch (error: any) {
        setError(error.message || 'Error loading requirements. Please try again later.');
        console.error('Error fetching requirements:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequirements();
  }, [selectedMajor, selectedConcentration, comprehensiveData, isOptimized, isApiAvailable]);

  // Create graph when requirements are loaded
  useEffect(() => {
    if (!requirements || loading) return;

    setGraphLoading(true);
    setReactFlowElements([]); // Clear existing elements
    
    try {
      // Get all courses from all categories with enhanced data
      const allCourses = requirements.categories.flatMap(category => 
        category.courses.map(course => ({
          ...course,
          category: category.name,
          // Prerequisites and corequisites are already included if using optimized data
        }))
      );


      // Create category colors
      const categoryColorMap: Record<string, string> = {};
      requirements.categories.forEach((category, index) => {
        categoryColorMap[category.name] = colors[index % colors.length];
      });
      setCategoryColors(categoryColorMap);

      if (isOptimized) {
        // Fast path: use pre-resolved dependencies
        const { nodeElements, edgeElements } = createGraph(allCourses, categoryColorMap);
        setReactFlowElements([...nodeElements, ...edgeElements]);
        setGraphLoading(false);
      } else {
        // Legacy path: fetch prerequisites individually
        const fetchPrerequisitesAndCreateGraph = async () => {
          await Promise.all(
            allCourses.map(async (course) => {
              try {
                const courseResponse = await fetch(`${API_BASE_URL}/courses/${encodeURIComponent(course.code)}`);
                if (courseResponse.ok) {
                  const courseData = await courseResponse.json();
                  course.prerequisites = courseData.prerequisites;
                  course.corequisites = courseData.corequisites;
                }
              } catch (error) {
                console.error(`Error fetching details for ${course.code}:`, error);
              }
            })
          );

          const { nodeElements, edgeElements } = createGraph(allCourses, categoryColorMap);
          setReactFlowElements([...nodeElements, ...edgeElements]);
          setGraphLoading(false);
        };

        fetchPrerequisitesAndCreateGraph();
      }
    } catch (error) {
      console.error('Error preparing graph data:', error);
      setGraphLoading(false);
    }
  }, [requirements, loading, isOptimized]);

  // Function to create graph nodes and edges
  const createGraph = (courses: any[], categoryColorMap: Record<string, string>) => {
    const nodeElements: any[] = [];
    const edgeElements: any[] = [];
    const nodeMap: Record<string, any> = {};
    const edgeTracker = new Set<string>();

    // First pass: create all nodes
    courses.forEach((course, index) => {
      const nodeId = normalizeCourseId(course.code);
      const categoryColor = categoryColorMap[course.category] || '#cccccc';
      
      // Calculate position in a circular layout
      const angle = (index / courses.length) * 2 * Math.PI;
      const radius = 300;
      const centerX = 500;
      const centerY = 400;
      
      const position = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };

      const node = {
        data: {
          id: nodeId,
          label: course.code,
          title: course.title,
          credits: course.credits,
          prerequisites: course.prerequisites,
          category: course.category,
          color: categoryColor,
          isLabel: false
        },
        position: position
      };

      nodeElements.push(node);
      nodeMap[nodeId] = node;
    });

    // Second pass: create all edges based on prerequisites
    courses.forEach(course => {
      const normalizedSourceId = normalizeCourseId(course.code);
      
      // Create edges for prerequisites
      if (course.prerequisites) {
        const prereqs = course.prerequisites.split(/,|and|or/).map((p: string) => p.trim());
        prereqs.forEach((prereq: string, index: number) => {
          const normalizedPrereqId = normalizeCourseId(prereq);
          addEdgeIfNotExists(
            normalizedPrereqId, 
            normalizedSourceId, 
            'prereq', 
            index, 
            edgeElements, 
            edgeTracker,
            nodeMap,
            true
          );
        });
      }
      
      // Create edges for corequisites
      if (course.corequisites) {
        const coreqs = course.corequisites.split(/,|and|or/).map((p: string) => p.trim());
        coreqs.forEach((coreq: string, index: number) => {
          const normalizedCoreqId = normalizeCourseId(coreq);
          addEdgeIfNotExists(
            normalizedSourceId, 
            normalizedCoreqId, 
            'coreq', 
            index, 
            edgeElements, 
            edgeTracker,
            nodeMap,
            false
          );
        });
      }
    });

    return { nodeElements, edgeElements };
  };

  // Convert majors to react-select options format
  const majorOptions: MajorOption[] = comprehensiveData?.majors.map((major) => ({
    value: major.id,
    label: major.name
  })) || [];

  // Custom react-select styles matching the sidebar
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
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999
    })
  };

  const handleMajorChange = (selectedOption: MajorOption | null) => {
    if (selectedOption) {
      setSelectedMajor(selectedOption.value);
      setSelectedConcentration(''); // Clear concentration when major changes
      setSelectedCategories([]); // Clear filters when major changes
      setConnectionFilter(0);
      setShowPrereqsCoreqs(false);
      setShowUnlocks(false);
      setHideFirstDegreeConnections(false);
    } else {
      setSelectedMajor('');
      setSelectedCategories([]); // Clear filters when major is cleared
      setConnectionFilter(0);
      setShowPrereqsCoreqs(false);
      setShowUnlocks(false);
      setHideFirstDegreeConnections(false);
    }
  };

  // Function to retry API connection
  const handleRetryConnection = () => {
    setIsApiAvailable(true);
    setError('');
    // Trigger re-fetch of comprehensive data
    window.location.reload();
  };

  // Function to toggle category filter
  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setConnectionFilter(0);
    setShowPrereqsCoreqs(false);
    setShowUnlocks(false);
    setHideFirstDegreeConnections(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">


      {/* API Error Message */}
      {!isApiAvailable && !loading && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-4 rounded">
          <h3 className="font-bold mb-2">API Connection Error</h3>
          <p className="mb-3">
            Cannot load degree requirements for graph visualization. Please ensure the API server is running.
          </p>
          <button 
            onClick={handleRetryConnection}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="p-4 space-y-4">
          <SkeletonCard hasHeader={true} hasImage={false} contentLines={1} className="h-32" />
          <SkeletonCard hasHeader={true} hasImage={false} contentLines={6} className="h-96" />
        </div>
      )}

      {/* Main content */}
      {(isApiAvailable && !loading && comprehensiveData) && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header with controls */}
          <div className="bg-primary-blue/5 border-b border-primary-blue/10 flex-shrink-0 relative">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">See Your Degree.</h1>
                
                {/* Information icon with tooltip */}
                <div className="relative">
                  <button
                    onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                    className="p-2 rounded-full hover:bg-primary-blue/10 transition-colors"
                    title="Show help information"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  
                  {/* Tooltip */}
                  {showInfoTooltip && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                      <div className="relative">
                        <button
                          onClick={() => setShowInfoTooltip(false)}
                          className="absolute top-0 right-0 -mt-2 -mr-2 p-1 hover:bg-gray-100 rounded"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <h3 className="font-semibold text-primary-blue mb-2">Interactive Course Graph</h3>
                        <p className="text-sm text-gray-700 mb-2">
                          Click on any course to see its prerequisites and dependent courses. Use zoom and pan to explore the curriculum.
                        </p>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">• <span className="text-red-600">Red arrows</span> = Prerequisites (must take before)</p>
                          <p>• <span className="text-blue-600">Blue arrows</span> = Corequisites (take together)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Major and Concentration Selectors */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    id="major"
                    instanceId="major-select-see-page"
                    options={majorOptions}
                    value={majorOptions.find(option => option.value === selectedMajor) || null}
                    onChange={handleMajorChange}
                    placeholder="Search for a major..."
                    isDisabled={loading}
                    isSearchable={true}
                    isClearable={true}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={customSelectStyles}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                  />
                  </div>
                  {/* Filter button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors flex items-center gap-2"
                    title="Filter options"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                    </svg>
                    <span className="text-sm text-gray-700">Filters</span>
                  </button>
                </div>
                
                {concentrations.length > 0 && (
                  <div className="flex-1">
                    <label htmlFor="concentration" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Concentration (Optional):
                    </label>
                    <select 
                      id="concentration"
                      value={selectedConcentration} 
                      onChange={(e) => setSelectedConcentration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
                    >
                      <option value="">No concentration</option>
                      {concentrations.map(concentration => (
                        <option key={concentration.id} value={concentration.id}>{concentration.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {/* Expanded Filter Section - Overlay */}
              {showFilters && (
          <div className="flex-shrink-0 relative pt-4">
                  
                  {/* Category filters */}
                  {Object.keys(categoryColors).length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Categories</span>
                        {selectedCategories.length > 0 && (
                          <button
                            onClick={clearAllFilters}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(categoryColors).map(([category, color]) => {
                          const isSelected = selectedCategories.includes(category);
                          return (
                            <button
                              key={category}
                              onClick={() => toggleCategoryFilter(category)}
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                isSelected
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300 shadow-sm'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                              }`}
                            >
                              <div 
                                className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                                style={{ backgroundColor: color }}
                              ></div>
                              {category}
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  )}

                  {/* Connection Filters */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Course Connections</span>
                      {(showPrereqsCoreqs || showUnlocks || connectionFilter > 0) && (
                        <button
                          onClick={() => {
                            setShowPrereqsCoreqs(false);
                            setShowUnlocks(false);
                            setConnectionFilter(0);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Connection Type Tag Buttons and Slider in horizontal layout */}
                    <div className="flex items-center gap-4">
                      {/* Buttons Container */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setShowPrereqsCoreqs(!showPrereqsCoreqs)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            showPrereqsCoreqs
                              ? 'bg-blue-100 text-blue-800 border border-blue-300 shadow-sm'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                        >
                          Prerequisites/Corequisites
                        </button>
                        <button
                          onClick={() => setShowUnlocks(!showUnlocks)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            showUnlocks
                              ? 'bg-blue-100 text-blue-800 border border-blue-300 shadow-sm'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                        >
                          Unlocks Others
                        </button>
                      </div>

                      {/* Connection Slider - only show when at least one type is selected */}
                      {(showPrereqsCoreqs || showUnlocks) && (
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={connectionFilter}
                            onChange={(e) => setConnectionFilter(Number(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(connectionFilter / 10) * 100}%, #e5e7eb ${(connectionFilter / 10) * 100}%, #e5e7eb 100%)`
                            }}
                          />
                          <span className="text-xs font-medium text-gray-700 min-w-[2rem] text-right">
                            {connectionFilter === 0 ? 'Any' : `${connectionFilter}+`}
                          </span>
                        </div>
                      )}

                      {/* Hide First Degree Connections Toggle - appears when filters are active */}
                      {(selectedCategories.length > 0 || showPrereqsCoreqs || showUnlocks || connectionFilter > 0) && (
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Hide related</span>
                          <button 
                            onClick={() => setHideFirstDegreeConnections(!hideFirstDegreeConnections)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hideFirstDegreeConnections ? 'bg-primary-blue' : 'bg-gray-200'}`}
                            role="switch"
                            aria-checked={hideFirstDegreeConnections}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${hideFirstDegreeConnections ? 'translate-x-[24px]' : 'translate-x-[3px]'}`}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>


                </div>
              )}
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex-1 overflow-hidden">
            {!selectedMajor ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <p className="text-gray-500">
                    Select a major from the dropdown above to see an interactive graph of course prerequisites and dependencies.
                  </p>
                </div>
              </div>
            ) : !requirements ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading course requirements...</p>
                </div>
              </div>
            ) : (
              <div className="h-full">
                {/* Show graph skeleton while loading, otherwise show the actual graph */}
                {graphLoading ? (
                  <SkeletonGraph />
                ) : (
                  <div className="h-[calc(100vh-200px)]">
                    <ReactFlowProvider>
                      <FlowGraph 
                        elements={reactFlowElements} 
                        categoryColors={categoryColors} 
                        initialFilteredCategories={selectedCategories}
                        connectionFilter={connectionFilter}
                        showPrereqsCoreqs={showPrereqsCoreqs}
                        showUnlocks={showUnlocks}
                        showFirstDegreeConnections={!hideFirstDegreeConnections}
                        onCategoryFilterChange={setSelectedCategories}
                      />
                    </ReactFlowProvider>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
          {error}
        </div>
      )}
    </div>
  );
} 