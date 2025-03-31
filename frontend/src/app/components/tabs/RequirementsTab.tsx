import { useState, useEffect } from "react";
import Link from "next/link";
import { FlowGraph } from '@/app/components/FlowGraph';
import { 
  Major, 
  Concentration,
  Category,
  RequirementCourse,
} from '@/types/course';
import { parsePrerequisites, addEdgeIfNotExists, normalizeCourseId, getCourseCategory } from '@/utils/courseUtils';

interface RequirementsTabProps {
  isApiAvailable: boolean;
  API_BASE_URL: string;
}

export function RequirementsTab({ isApiAvailable, API_BASE_URL }: RequirementsTabProps) {
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [selectedConcentration, setSelectedConcentration] = useState<string>('');
  const [requirements, setRequirements] = useState<any>(null);
  const [requirementsLoading, setRequirementsLoading] = useState<boolean>(false);
  const [requirementsError, setRequirementsError] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [graphView, setGraphView] = useState<boolean>(false);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [reactFlowElements, setReactFlowElements] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);

  // Colors for different categories
  const colors = [
    '#e6f7ff', '#fff7e6', '#f6ffe6', '#ffe6e6', '#e6e6ff', 
    '#ffe6f7', '#f7ffe6', '#e6ffe6', '#e6ffff', '#ffe6ff'
  ];

  // Fetch majors on component mount
  useEffect(() => {
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
  }, [API_BASE_URL]);

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
  }, [selectedMajor, isApiAvailable, API_BASE_URL]);

  // Fetch requirements for selected major
  useEffect(() => {
    if (!selectedMajor || !isApiAvailable) return;

    async function fetchRequirements() {
      setRequirementsLoading(true);
      setRequirementsError('');
      
      try {
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
  }, [selectedMajor, selectedConcentration, isApiAvailable, API_BASE_URL]);

  // Create node graph when requirements data changes
  useEffect(() => {
    if (!graphView || !requirements || requirementsLoading) {
      return;
    }
    
    try {
      const allCourses: RequirementCourse[] = [];
      const courseMap: Record<string, RequirementCourse> = {};
      const categoryMap: Record<string, { name: string, color: string }> = {};
      
      requirements.categories.forEach((category: Category, index: number) => {
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
      
      requirements.categories.forEach((category: Category) => {
        category.courses.forEach((course: RequirementCourse) => {
          const courseCode = course.code;
          if (!courseMap[courseCode]) {
            courseMap[courseCode] = {
              ...course,
              prerequisites: '',
              corequisites: ''
            };
            allCourses.push(courseMap[courseCode]);
          }
        });
      });
      
      const fetchPrerequisites = async () => {
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
        
        const { nodeElements, edgeElements } = createGraph(allCourses);
        
        if (graphView) {
          setNodes(nodeElements);
          setEdges(edgeElements);
          setReactFlowElements(prev => {
            const newElements = [...nodeElements, ...edgeElements];
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
  }, [requirements, graphView, requirementsLoading, API_BASE_URL]);

  // Function to create the graph
  const createGraph = (allCourses: RequirementCourse[]) => {
    const nodeElements: any[] = [];
    const edgeElements: any[] = [];
    const edgeTracker = new Set<string>();
    const nodeMap: Record<string, any> = {};

    const courseCategories: Record<string, string> = {};
    
    if (requirements) {
      requirements.categories.forEach((category: Category) => {
        category.courses.forEach((course: RequirementCourse) => {
          courseCategories[normalizeCourseId(course.code)] = category.name;
        });
      });
    }
    
    const coursesByCategory: Record<string, RequirementCourse[]> = {};
    allCourses.forEach(course => {
      const normalizedId = normalizeCourseId(course.code);
      const category = courseCategories[normalizedId] || getCourseCategory(course.code);
      if (!coursesByCategory[category]) {
        coursesByCategory[category] = [];
      }
      coursesByCategory[category].push(course);
    });

    const categories = Object.keys(coursesByCategory);
    
    categories.forEach((category, categoryIndex) => {
      const coursesInCategory = coursesByCategory[category];
      
      const categoryAngle = (2 * Math.PI * categoryIndex) / categories.length;
      const radius = 600;
      const categoryX = Math.cos(categoryAngle) * radius;
      const categoryY = Math.sin(categoryAngle) * radius;
      
      let categoryColor = colors[categoryIndex % colors.length];
      if (requirements) {
        const reqCategoryIndex = requirements.categories.findIndex((c: Category) => c.name === category);
        if (reqCategoryIndex >= 0) {
          categoryColor = colors[reqCategoryIndex % colors.length];
        }
      }
      
      const coursesPerRow = Math.ceil(Math.sqrt(coursesInCategory.length));
      
      coursesInCategory.forEach((course, courseIndex) => {
        const row = Math.floor(courseIndex / coursesPerRow);
        const col = courseIndex % coursesPerRow;
        
        const x = categoryX + (col - coursesPerRow / 2) * 150;
        const y = categoryY + (row - Math.floor(coursesInCategory.length / coursesPerRow) / 2) * 100;
        
        const normalizedId = normalizeCourseId(course.code);
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

    allCourses.forEach(course => {
      const normalizedSourceId = normalizeCourseId(course.code);
      
      if (course.prerequisites) {
        const prereqs = parsePrerequisites(course.prerequisites);
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
      
      if (course.corequisites) {
        const coreqs = parsePrerequisites(course.corequisites);
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

    return { nodeElements, edgeElements };
  };

  // Toggle category expansion
  const toggleCategory = (categoryIndex: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [`category-${categoryIndex}`]: !prev[`category-${categoryIndex}`]
    }));
  };

  return (
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
              onChange={(e) => setSelectedMajor(e.target.value)}
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
        
        {/* View toggle */}
        {!requirementsLoading && requirements && (
          <div className="mt-4 flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md ${
                !graphView 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setGraphView(false)}
            >
              Table View
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                graphView 
                  ? 'bg-blue-600 text-white' 
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <span className="ml-4 text-lg">Loading requirements...</span>
        </div>
      )}

      {/* Requirements display - only show this in table view */}
      {!requirementsLoading && requirements && !graphView && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-2">{requirements.degree_name}</h2>
          <p className="text-lg mb-6">Total Credits: {requirements.total_credits}</p>
          
          <div className="space-y-6">
            {requirements.categories.map((category: Category, categoryIndex: number) => (
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
                        {category.courses.map((course: RequirementCourse, courseIndex: number) => (
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
              
              {/* Prerequisites and Corequisites legend */}
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
                      const count = (() => {
                        let total = 0, visible = 0;
                        nodes.forEach(node => {
                          if ((node.data as any).category === category) {
                            total++;
                            if (!node.hidden) visible++;
                          }
                        });
                        return { total, visible };
                      })();
                      
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
                          <div 
                            className={`${isActive ? 'w-5 h-5' : 'w-4 h-4'} mr-2 rounded-sm flex-shrink-0`}
                            style={{ backgroundColor: color }}
                          ></div>
                          
                          <span className={`text-sm ${isActive ? 'font-semibold' : ''}`}>{category}</span>
                          
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {count.visible}/{count.total}
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
          
          {/* Flow chart */}
          <div className="h-[700px] bg-white border rounded-md shadow-lg">
            <FlowGraph 
              elements={reactFlowElements} 
              categoryColors={categoryColors} 
            />
          </div>
        </div>
      )}
      
      {/* Empty state - no major selected */}
      {!requirementsLoading && !requirements && !requirementsError && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <p className="text-gray-600">Select a major from the dropdown above to view degree requirements.</p>
        </div>
      )}
    </>
  );
} 