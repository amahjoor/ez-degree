"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import ReactFlow, {
  Controls,
  Background,
  MarkerType,
  Panel,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Node as FlowNode,
  Edge as FlowEdge,
  ConnectionLineType,
  Handle,
  Position,
  ConnectionMode,
  MiniMap,
  NodeTypes,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import React from "react";
import { Professor } from '@/types/professor';
import Professors from '@/app/components/Professors';
import { FlowGraph } from '@/app/components/FlowGraph';
import { 
  Course, 
  Subject, 
  Requirements, 
  Major, 
  Concentration,
  Category,
  RequirementCourse,
  CourseNodeData
} from '@/types/course';
import { parsePrerequisites, addEdgeIfNotExists, normalizeCourseId, getCourseCategory } from '@/utils/courseUtils';
import { CourseSearchTab, RequirementsTab, ProfessorsTab } from '@/app/components/tabs';

// API configuration
const API_BASE_URL = '/api';

// Create a memoized wrapper for ReactFlow component to prevent unnecessary renders
const MemoizedFlowGraph = React.memo(FlowGraph);

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
  const [activeTab, setActiveTab] = useState<'courses' | 'requirements' | 'professors'>('courses');
  const [graphView, setGraphView] = useState<boolean>(false);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [reactFlowElements, setReactFlowElements] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  
  // Toggle category filter function
  const toggleCategoryFilter = (category: string) => {
    setFilteredCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };
  
  // Colors for different categories
  const colors = [
    '#e6f7ff', '#fff7e6', '#f6ffe6', '#ffe6e6', '#e6e6ff', 
    '#ffe6f7', '#f7ffe6', '#e6ffe6', '#e6ffff', '#ffe6ff'
  ];

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

    // Second pass: create all edges
    allCourses.forEach(course => {
      const normalizedSourceId = normalizeCourseId(course.code);
      
      // Create edges for prerequisites
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
      
      // Create edges for corequisites
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
    
    console.log("Created nodes:", nodeElements.length);
    console.log("Created edges:", edgeElements.length);

    return { nodeElements, edgeElements };
  };

  // Check API availability on mount
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        setIsApiAvailable(response.ok);
      } catch (error) {
        setIsApiAvailable(false);
      }
    };

    checkApiAvailability();
  }, []);

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

  // Regular render with tabs
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
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'professors'
                ? 'bg-white border-l border-t border-r border-gray-200 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
            onClick={() => setActiveTab('professors')}
          >
            Professors
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'courses' ? (
          <CourseSearchTab isApiAvailable={isApiAvailable} API_BASE_URL={API_BASE_URL} />
        ) : activeTab === 'requirements' ? (
          <RequirementsTab isApiAvailable={isApiAvailable} API_BASE_URL={API_BASE_URL} />
        ) : activeTab === 'professors' ? (
          <ProfessorsTab isApiAvailable={isApiAvailable} API_BASE_URL={API_BASE_URL} />
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">Select a tab above to view content.</p>
          </div>
        )}
      </div>
    </main>
  );
}

// Declare the global window interface
declare global {
  interface Window {
    courseGraphState?: {
      filteredCategories: string[];
      toggleCategoryFilter: (category: string) => void;
    };
  }
}
