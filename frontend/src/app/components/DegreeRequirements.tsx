"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ReactFlow, { Background, Controls, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { SkeletonTable, SkeletonCard, SkeletonText } from './ui/';

import { Major, Concentration, Requirements, RequirementCourse } from '@/types/course';
import { getCourseCategory, normalizeCourseId, addEdgeIfNotExists } from '@/utils/courseUtils';
import FlowGraph from './graph/FlowGraph';

// API configuration
const API_BASE_URL = '/api';

// Colors for different categories
const colors = [
  '#e6f7ff', '#fff7e6', '#f6ffe6', '#ffe6e6', '#e6e6ff', 
  '#ffe6f7', '#f7ffe6', '#e6ffe6', '#e6ffff', '#ffe6ff'
];

interface DegreeRequirementsProps {
  isApiAvailable: boolean;
}

const DegreeRequirements: React.FC<DegreeRequirementsProps> = ({ isApiAvailable }) => {
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [selectedConcentration, setSelectedConcentration] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [requirementsLoading, setRequirementsLoading] = useState<boolean>(false);
  const [requirementsError, setRequirementsError] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [graphView, setGraphView] = useState<boolean>(false);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [reactFlowElements, setReactFlowElements] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);

  // Fetch majors on component mount
  useEffect(() => {
    if (!isApiAvailable) return;
    
    async function fetchMajors() {
      try {
        setRequirementsLoading(true);
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
      } catch (error) {
        console.error('Error fetching majors:', error);
        setRequirementsError('Error connecting to the requirements API. Please ensure the server is running.');
      } finally {
        setRequirementsLoading(false);
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
        data.categories.forEach((category: any, index: number) => {
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

  // Create node graph when requirements data changes
  useEffect(() => {
    if (!graphView || !requirements || requirementsLoading) {
      return;
    }
    
    try {
      // Get all courses from the requirements
      const allCourses: RequirementCourse[] = [];
      const courseMap: Record<string, RequirementCourse> = {};
      const categoryMap: Record<string, { name: string, color: string }> = {};
      
      // Assign colors to categories
      requirements.categories.forEach((category, index) => {
        categoryMap[category.name] = {
          name: category.name,
          color: colors[index % colors.length]
        };
      });
      
      setCategoryColors(
        Object.fromEntries(
          Object.entries(categoryMap).map(([name, data]) => [name, data.color])
        )
      );
      
      // Collect all courses
      requirements.categories.forEach((category) => {
        category.courses.forEach((course) => {
          const courseCode = course.code;
          if (!courseMap[courseCode]) {
            // Clone the course and add it to our collection
            courseMap[courseCode] = {
              ...course,
              prerequisites: '',
              corequisites: ''
            };
            allCourses.push(courseMap[courseCode]);
          }
        });
      });
      
      // Fetch prerequisites for each course
      const fetchPrerequisites = async () => {
        await Promise.all(
          allCourses.map(async (course) => {
            try {
              const courseResponse = await fetch(`${API_BASE_URL}/courses/${encodeURIComponent(course.code)}`);
              if (courseResponse.ok) {
                const courseData = await courseResponse.json();
                
                // Debug log to check if prerequisites are being fetched correctly
                console.log(`Course ${course.code} prerequisites:`, courseData.prerequisites);
                
                course.prerequisites = courseData.prerequisites;
                course.corequisites = courseData.corequisites;
              }
            } catch (error) {
              console.error(`Error fetching details for ${course.code}:`, error);
            }
          })
        );
        
        // After fetching prerequisites, create the graph
        const { nodeElements, edgeElements } = createGraph(allCourses);
        
        // Only update states if the component is still mounted and in graph view
        if (graphView) {
          setNodes(nodeElements);
          setEdges(edgeElements);
          // Create a stable reference for reactFlowElements
          setReactFlowElements(prev => {
            const newElements = [...nodeElements, ...edgeElements];
            // Only update if there's an actual change to avoid infinite updates
            if (JSON.stringify(prev) !== JSON.stringify(newElements)) {
              return newElements;
            }
            return prev;
          });
        }
      };
      
      fetchPrerequisites();
    } catch (error) {
      console.error('Error preparing graph data:', error);
    }
  }, [requirements, graphView, requirementsLoading]);

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
  };
  
  // Function to create the graph
  const createGraph = (allCourses: RequirementCourse[]) => {
    const nodeElements: any[] = [];
    const edgeElements: any[] = [];
    const edgeTracker = new Set<string>();
    const nodeMap: Record<string, any> = {};

    // Map courses to their categories in the requirements
    const courseCategories: Record<string, string> = {};
    
    // Find which category each course belongs to
    if (requirements) {
      requirements.categories.forEach((category) => {
        category.courses.forEach((course) => {
          courseCategories[normalizeCourseId(course.code)] = category.name;
        });
      });
    }
    
    // Group courses by requirement category
    const coursesByCategory: Record<string, RequirementCourse[]> = {};
    allCourses.forEach(course => {
      const normalizedId = normalizeCourseId(course.code);
      // Use the requirement category if available, otherwise use subject
      const category = courseCategories[normalizedId] || getCourseCategory(course.code);
      if (!coursesByCategory[category]) {
        coursesByCategory[category] = [];
      }
      coursesByCategory[category].push(course);
    });

    // Calculate positions for each category and create nodes
    const categories = Object.keys(coursesByCategory);
    console.log("Categories for layout:", categories);
    
    // Place categories in a circular layout
    categories.forEach((category, categoryIndex) => {
      const coursesInCategory = coursesByCategory[category];
      console.log(`Category ${category} has ${coursesInCategory.length} courses`);
      
      // Place each category in a position on a large circle
      const categoryAngle = (2 * Math.PI * categoryIndex) / categories.length;
      const radius = 600; // Larger radius to space out categories more
      const categoryX = Math.cos(categoryAngle) * radius;
      const categoryY = Math.sin(categoryAngle) * radius;
      
      // Get color for this category
      let categoryColor = colors[categoryIndex % colors.length];
      if (requirements) {
        // Try to find this category in requirements to use consistent coloring
        const reqCategoryIndex = requirements.categories.findIndex(c => c.name === category);
        if (reqCategoryIndex >= 0) {
          categoryColor = colors[reqCategoryIndex % colors.length];
        }
      }
      
      // Position courses within this category in a grid-like manner
      const coursesPerRow = Math.ceil(Math.sqrt(coursesInCategory.length));
      
      coursesInCategory.forEach((course, courseIndex) => {
        const row = Math.floor(courseIndex / coursesPerRow);
        const col = courseIndex % coursesPerRow;
        
        // Space courses closer within their category cluster
        const x = categoryX + (col - coursesPerRow / 2) * 150;
        const y = categoryY + (row - Math.floor(coursesInCategory.length / coursesPerRow) / 2) * 100;
        
        const normalizedId = normalizeCourseId(course.code);
        // Use category colors from requirements if available
        let nodeCategoryColor = categoryColor;
        
        const node = {
          data: {
            id: normalizedId,
            label: course.code,
            title: course.title,
            credits: course.credits,
            color: nodeCategoryColor,
            category: category,
            isLabel: false
          },
          position: { x, y }
        };
        
        nodeElements.push(node);
        nodeMap[normalizedId] = node;
      });
    });

    // Second pass: create all edges based on prerequisites
    allCourses.forEach(course => {
      const normalizedSourceId = normalizeCourseId(course.code);
      
      // Create edges for prerequisites
      if (course.prerequisites) {
        const prereqs = course.prerequisites.split(/,|and|or/).map(p => p.trim());
        prereqs.forEach((prereq, index) => {
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
        const coreqs = course.corequisites.split(/,|and|or/).map(p => p.trim());
        coreqs.forEach((coreq, index) => {
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
    
    console.log("Created nodes:", nodeElements.length);
    console.log("Created edges:", edgeElements.length);

    return { nodeElements, edgeElements };
  };

  // If the API is not available, show an empty state
  if (!isApiAvailable) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-yellow-700">
          Cannot load degree requirements. Please ensure the API server is running.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Major and Concentration Selector */}
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
        
        {/* View toggle - Add this section */}
        {!requirementsLoading && requirements && (
          <div className="mt-4 flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md ${
                !graphView 
                  ? 'bg-primary-blue text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setGraphView(false)}
            >
              Table View
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                graphView 
                  ? 'bg-primary-blue text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setGraphView(true)}
            >
              Graph View
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {requirementsError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
          <p>{requirementsError}</p>
        </div>
      )}

      {/* Loading indicator */}
      {requirementsLoading && (
        <div className="space-y-6">
          <SkeletonCard 
            hasHeader={true} 
            contentLines={1} 
            className="max-w-full mb-4"
          />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-md overflow-hidden">
              <div className="bg-gray-100 p-4">
                <SkeletonText className="w-full" />
              </div>
              <div className="p-4">
                <SkeletonTable rows={5} columns={3} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requirements display - only show this in table view */}
      {!requirementsLoading && requirements && !graphView && (
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
      
      {/* Graph View */}
      {!requirementsLoading && requirements && graphView && (
        <div>
          {/* Combined Legend and Filter Controls */}
          {Object.keys(categoryColors).length > 0 && (
            <div className="mb-4 p-4 bg-white border rounded-md shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Key</h3>
                {filteredCategories.length > 0 && (
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => setFilteredCategories([])}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
              
              {/* Prerequisites and Corequisites legend moved to top */}
              <div className="w-full mb-3 border-b border-gray-200 pb-2">
                <div className="flex flex-wrap gap-x-8">
                  <p className="flex items-center mb-1 text-sm">
                    <span className="inline-block w-3 h-3 mr-2 bg-red-500"></span> 
                    <span>Prerequisites (must take before)</span>
                  </p>
                  <p className="flex items-center text-sm">
                    <span className="inline-block w-3 h-3 mr-2 bg-blue-500"></span> 
                    <span>Corequisites (take together)</span>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-y-2">
                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Filter by category:</p>
                    <p className="text-xs text-gray-500">Click to toggle filters</p>
                  </div>
                  
                  <div className="w-full flex flex-wrap gap-x-2 gap-y-2">
                    {Object.entries(categoryColors).map(([category, color]) => {
                      // Count courses for display
                      const total = nodes.filter(node => (node.data as any).category === category).length;
                      const visible = nodes.filter(node => 
                        (node.data as any).category === category && !(node as any).hidden
                      ).length;
                      
                      const isActive = filteredCategories.includes(category);
                      
                      return (
                        <div
                          key={category}
                          className={`flex items-center px-3 py-2 mb-1 rounded cursor-pointer transition-all ${
                            isActive 
                              ? 'border-2 border-black shadow-md' 
                              : 'border border-gray-200 hover:border-gray-400'
                          }`}
                          onClick={() => {
                            if (window.courseGraphState?.toggleCategoryFilter) {
                              window.courseGraphState.toggleCategoryFilter(category);
                            }
                          }}
                        >
                          {/* Color indicator with larger size when selected */}
                          <div 
                            className={`${isActive ? 'w-5 h-5' : 'w-4 h-4'} mr-2 rounded-sm flex-shrink-0`}
                            style={{ backgroundColor: color }}
                          ></div>
                          
                          {/* Text with bold when selected */}
                          <span className={`text-sm ${isActive ? 'font-semibold' : ''}`}>{category}</span>
                          
                          {/* Counter */}
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {visible}/{total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Status message */}
          {reactFlowElements.length === 0 ? (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
              <p className="font-semibold">Loading course graph...</p>
              <p className="text-sm mt-1">Please wait while we fetch course prerequisites and generate the visualization.</p>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
              <p className="font-semibold">Graph Visualization</p>
              <p className="text-sm mt-1">Showing {nodes.length} courses and {edges.length} prerequisite connections. You can zoom and pan to explore.</p>
            </div>
          )}
          
          {/* Flow chart - using ReactFlow */}
          <div className="h-[700px] bg-white border rounded-md shadow-lg">
            <ReactFlowProvider key="react-flow-provider">
              <FlowGraph 
                elements={reactFlowElements} 
                categoryColors={categoryColors} 
              />
            </ReactFlowProvider>
          </div>
        </div>
      )}
      
      {/* Empty state - no major selected */}
      {!requirementsLoading && !requirements && !requirementsError && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <p className="text-gray-600">Select a major from the dropdown above to view degree requirements.</p>
        </div>
      )}
    </div>
  );
};

export default DegreeRequirements; 