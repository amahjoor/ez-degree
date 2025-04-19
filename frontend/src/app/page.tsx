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
  prerequisites?: string;
  corequisites?: string;
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

// Define interfaces for our custom node data
interface CourseNodeData {
  label: string;
  title?: string;
  credits?: number;
  prerequisites?: string;
  category?: string;
  categoryColor: string;
  isLabel?: boolean;
  relationshipToSelected?: string | null;
  isHighlighted?: boolean;
}

// Define type for our node
type CourseNode = Omit<FlowNode, 'data'> & {
  data: CourseNodeData;
};

// Define interface for our edge data
interface EdgeData {
  id: string;
  type: string;
  isPrereq?: boolean;
  label?: string;
}

// Define type for our edge
type CourseEdge = Omit<FlowEdge, 'data'> & {
  data: EdgeData;
};

// Parse prerequisites string
const parsePrerequisites = (prereqString?: string): string[] => {
  if (!prereqString) return [];
  
  // Extract course codes (e.g., CS 310, MATH 113) - handle both with and without spaces
  // The regex matches:
  // - 2-4 uppercase letters (department code)
  // - Optional space
  // - 3 digits (course number)
  const regex = /[A-Z]{2,4}\s*\d{3}/g;
  
  // First normalize spaces to ensure consistent matching
  const normalizedString = prereqString.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');
  const matches = normalizedString.match(regex) || [];
  
  // Normalize the matches to ensure they all have a space
  const normalizedMatches = matches.map(match => {
    // If there's no space between the department code and course number, add one
    if (!/\s/.test(match)) {
      // Find where the numbers start
      const numberIndex = match.search(/\d/);
      if (numberIndex > 0) {
        return match.slice(0, numberIndex) + ' ' + match.slice(numberIndex);
      }
    }
    return match;
  });
  
  // Log the matches for debugging
  console.log('Prerequisite string:', prereqString);
  console.log('Extracted prereqs:', normalizedMatches);
  
  return normalizedMatches;
};

// Custom node component for courses
function CourseNode({ data }: { data: CourseNodeData }) {
  // If this is a category label, render a different component
  if (data.isLabel) {
  return (
    <div 
        className="flex items-center justify-center rounded-md px-4 py-2 shadow-md text-white font-bold text-lg"
      style={{ 
          backgroundColor: data.categoryColor,
          minWidth: '120px',
          textAlign: 'center'
        }}
      >
        {data.label}
    </div>
  );
  }

  // Determine border style based on relationship to selected node
  let borderStyle = '2px solid';
  let shadowColor = 'rgba(0, 0, 0, 0.1)';
  let shadowSize = '0 1px 3px';
  let zIndex = 0;
  
  if (data.relationshipToSelected) {
    borderStyle = '3px solid';
    shadowSize = '0 0 10px';
    zIndex = 10;
    
    switch (data.relationshipToSelected) {
      case 'selected':
        shadowColor = 'rgba(75, 85, 99, 0.7)'; // Gray shadow for selected
        break;
      case 'prereq':
        shadowColor = 'rgba(239, 68, 68, 0.5)'; // Red shadow for prerequisites
        break;
      case 'coreq':
        shadowColor = 'rgba(59, 130, 246, 0.5)'; // Blue shadow for corequisites
        break;
      case 'dependent':
        shadowColor = 'rgba(16, 185, 129, 0.5)'; // Green shadow for dependents
        break;
    }
  }

  // Regular course node
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg p-3 w-[180px] h-[120px] text-center ${
        data.isHighlighted ? 'z-10' : 'z-0'
      }`}
      style={{
        backgroundColor: data.categoryColor + '80', // Adding transparency
        borderColor: data.categoryColor,
        borderWidth: borderStyle.split(' ')[0],
        borderStyle: borderStyle.split(' ')[1],
        boxShadow: `${shadowSize} ${shadowColor}`,
        transition: 'all 0.3s ease',
        opacity: data.isHighlighted === false ? 0.6 : 1,
        zIndex: zIndex,
      }}
    >
      {/* Handle for incoming edges at the top */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ 
          background: '#555', 
          width: '8px', 
          height: '8px', 
          top: '-4px',
          borderRadius: '50%'
        }}
      />
      
      {/* Handles for outgoing edges at multiple positions to support better straight connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ 
          background: '#555', 
          width: '8px', 
          height: '8px', 
          bottom: '-4px',
          borderRadius: '50%'
        }}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ 
          background: '#555', 
          width: '8px', 
          height: '8px', 
          left: '-4px',
          borderRadius: '50%'
        }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ 
          background: '#555', 
          width: '8px', 
          height: '8px', 
          right: '-4px',
          borderRadius: '50%'
        }}
      />
      
      <div className="font-bold text-md">{data.label}</div>
      {data.title && (
        <div className="text-xs line-clamp-2 mt-1 h-8 overflow-hidden">
          {data.title}
        </div>
      )}
      <div className="flex flex-col text-xs mt-1">
        {data.credits !== undefined && (
          <span className="text-gray-700">{data.credits} Credits</span>
        )}
        {data.category && !data.isLabel && (
          <span className="text-xs text-gray-600 italic mt-1 line-clamp-1">
            {data.category}
          </span>
        )}
      </div>
      
      {/* Relationship indicator badge */}
      {data.relationshipToSelected && data.relationshipToSelected !== 'selected' && (
        <div 
          className="absolute -top-2 -right-2 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold"
          style={{
            backgroundColor: 
              data.relationshipToSelected === 'prereq' ? '#ef4444' :  // Red
              data.relationshipToSelected === 'coreq' ? '#3b82f6' :   // Blue
              data.relationshipToSelected === 'dependent' ? '#10b981' : // Green
              '#6b7280', // Gray default
          }}
        >
          {data.relationshipToSelected === 'prereq' ? 'P' : 
           data.relationshipToSelected === 'coreq' ? 'C' : 
           data.relationshipToSelected === 'dependent' ? 'R' : ''}
        </div>
      )}
    </div>
  );
}

// Flow Graph Component
interface FlowGraphProps {
  elements: any[];
  categoryColors: Record<string, string>;
}

function FlowGraph({ elements, categoryColors }: FlowGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  // Use a ref to store connected edges to avoid dependency issues
  const edgesRef = useRef<FlowEdge[]>([]);
  // Add state for category filters
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  
  // Update the edges ref whenever edges change
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
  
  // Configure default edge options for ReactFlow
  const defaultEdgeOptions = useMemo(() => ({
    type: 'straight', // Use straight lines for direct connections
    style: { strokeWidth: 3 },
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
  }), []);

  // Memoize nodeTypes to prevent recreation on every render
  const nodeTypes = useMemo(() => ({ 
    courseNode: CourseNode 
  }), []);

  // Apply layout when the reference is available, elements change, or registration completes
  useEffect(() => {
    if (!elements || elements.length === 0) {
      console.log("No elements provided to FlowGraph");
      return;
    }

    try {
      console.log("Original elements received:", elements);
      console.log("Elements structure sample:", JSON.stringify(elements[0]));
      
      // Extract nodes and edges from elements
      const nodeElements = elements.filter(el => !el.data.source && !el.data.target);
      const edgeElements = elements.filter(el => el.data.source && el.data.target);
      
      console.log("Node elements:", nodeElements.length);
      if (nodeElements.length > 0) {
        console.log("Sample node structure:", JSON.stringify(nodeElements[0]));
      }
      
      console.log("Edge elements:", edgeElements.length);
      if (edgeElements.length > 0) {
        console.log("Sample edge structure:", JSON.stringify(edgeElements[0]));
      }
      
      // Create ReactFlow nodes with better initial layout
      const courseNodes: FlowNode[] = nodeElements.map((el, index) => {
        // Use the position from the source if available, otherwise calculate
        const position = el.position || {
          x: 500 + 300 * Math.cos((index / nodeElements.length) * 2 * Math.PI),
          y: 350 + 300 * Math.sin((index / nodeElements.length) * 2 * Math.PI)
        };
        
        const node = {
          id: el.data.id,
          type: 'courseNode',
          position: position,
          data: {
            label: el.data.label || el.data.id,
            title: el.data.title || '',
            credits: el.data.credits || 0,
            prerequisites: el.data.prerequisites,
            category: el.data.category || '',
            categoryColor: el.data.color || '#cccccc',
            isLabel: el.data.isLabel || false,
            relationshipToSelected: null,
            isHighlighted: false
          }
        };
        
        if (el.data.isLabel) {
          console.log(`Created category label: ${node.id}, category: ${node.data.label}`);
        } else {
          console.log(`Created node: ${node.id} at position (${position.x}, ${position.y}), category: ${node.data.category}`);
        }
        
        return node;
      });
      
      // Create ReactFlow edges with explicit source and target IDs
      const courseEdges: FlowEdge[] = edgeElements.map((el, edgeIndex) => {
        // Make sure each edge has a unique ID
        const uniqueId = `edge-${el.data.id || `${el.data.source}-to-${el.data.target}`}-${edgeIndex}`;
        
        // Log each edge for debugging
        console.log(`Creating flow edge: ${el.data.source} -> ${el.data.target} (${el.data.type || 'prereq'}) with ID ${uniqueId}`);
        
        return {
          id: uniqueId,
          source: el.data.source,
          target: el.data.target,
          // Use explicit sourceHandle and targetHandle
          sourceHandle: 'bottom', // Edge starts from bottom of source node
          targetHandle: 'top',    // Edge ends at top of target node
          type: 'straight',     // Use straight lines for direct connections
          animated: el.data.type === 'coreq',
          style: { 
            strokeWidth: 3,
            stroke: el.data.type === 'coreq' ? '#0000ff' : '#ff0000',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: el.data.type === 'coreq' ? '#0000ff' : '#ff0000',
          },
          label: el.data.type || 'prereq',
          labelStyle: { 
            fill: el.data.type === 'coreq' ? '#0000ff' : '#ff0000',
            fontWeight: 700,
            fontSize: 12
          },
          data: {
            id: uniqueId,
            type: el.data.type || 'prereq'
          }
        };
      });
      
      console.log("Final ReactFlow nodes:", courseNodes.length);
      console.log("Final ReactFlow edges:", courseEdges.length);
      
      // Set the nodes and edges
      setNodes(courseNodes);
      setEdges(courseEdges);
    } catch (error) {
      console.error('Error converting elements to ReactFlow format:', error);
    }
  }, [elements, setNodes, setEdges]);
  
  // Handle node selection to highlight connected nodes and edges
  const onNodeClick = useCallback((event: React.MouseEvent, node: FlowNode) => {
    // Toggle selection: if the same node is clicked, clear selection
    setSelectedNode(prevSelected => prevSelected === node.id ? null : node.id);
  }, []);

  // Apply highlighting and filtering to nodes and edges based on selection and category filters
  useEffect(() => {
    // First check for category filters
    const shouldApplyCategoryFilter = filteredCategories.length > 0;
    
    // If no node is selected and no category filters active, reset all nodes and edges 
    if (!selectedNode && !shouldApplyCategoryFilter) {
      // No selection or filters, reset all nodes and edges to original state
      setNodes(nodes => nodes.map(node => ({
        ...node,
        hidden: false,
        style: undefined,
        data: { 
          ...node.data,
          isHighlighted: false,
          relationshipToSelected: null 
        }
      })));
      
      setEdges(edges => edges.map(edge => ({
        ...edge,
        hidden: false,
        style: {
          ...edge.style,
          opacity: 1,
          strokeWidth: 3,
        }
      })));
      
      return;
    }
    
    // Use the edges from the ref to avoid dependency issues
    const currentEdges = edgesRef.current;
    
    // Find all connected edges (where selected node is source or target)
    let connectedEdges = currentEdges;
    let connectedNodeIds = new Set<string>();
    
    if (selectedNode) {
      connectedEdges = currentEdges.filter(
        edge => edge.source === selectedNode || edge.target === selectedNode
      );
      
      // Get IDs of all connected nodes
      connectedNodeIds.add(selectedNode); // Add the selected node itself
      connectedEdges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });
    }
    
    // Create updated nodes array without triggering re-renders
    const updatedNodes = nodes.map(node => {
      const isSelected = node.id === selectedNode;
      const isConnected = selectedNode ? connectedNodeIds.has(node.id) : true;
      const matchesCategory = !shouldApplyCategoryFilter || 
        filteredCategories.includes(((node.data as any)?.category || '') as string);
      
      const isPrereq = selectedNode && currentEdges
        .filter(edge => edge.target === selectedNode && edge.data?.type === 'prereq')
        .map(edge => edge.source)
        .includes(node.id);
        
      const isCoreq = selectedNode && currentEdges
        .filter(edge => (edge.source === selectedNode || edge.target === selectedNode) && edge.data?.type === 'coreq')
        .map(edge => edge.source === selectedNode ? edge.target : edge.source)
        .includes(node.id);
      
      const isDependent = selectedNode && currentEdges
        .filter(edge => edge.source === selectedNode && edge.data?.type === 'prereq')
        .map(edge => edge.target)
        .includes(node.id);
      
      // Hide nodes that don't match our criteria (not connected or filtered out by category)
      const shouldBeHidden = (selectedNode && !isConnected) || !matchesCategory;
      
      if (shouldBeHidden) {
        return {
          ...node,
          hidden: true,
          data: {
            ...node.data,
            isHighlighted: false,
            relationshipToSelected: null
          }
        };
      }
      
      // For visible nodes, show them with proper styling
      let style = {
        zIndex: 2,
        filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.3))',
      };
      
      if (isSelected) {
        style = {
          ...style,
          filter: 'drop-shadow(0 0 14px rgba(59, 130, 246, 0.8))',
          zIndex: 10,
        };
      }
      
      return {
        ...node,
        hidden: false,
        style,
        data: {
          ...node.data,
          isHighlighted: true,
          relationshipToSelected: isSelected 
            ? 'selected' 
            : isPrereq 
              ? 'prereq' 
              : isCoreq 
                ? 'coreq' 
                : isDependent 
                  ? 'dependent' 
                  : null
        }
      };
    });
    
    // Create updated edges array
    const updatedEdges = edges.map(edge => {
      const isConnectedToSelected = selectedNode ? (edge.source === selectedNode || edge.target === selectedNode) : true;
      
      // Get node visibility status from our updated nodes
      const sourceVisible = updatedNodes.some(n => n.id === edge.source && !n.hidden);
      const targetVisible = updatedNodes.some(n => n.id === edge.target && !n.hidden);
      const bothNodesVisible = sourceVisible && targetVisible;
      
      return {
        ...edge,
        hidden: !isConnectedToSelected || !bothNodesVisible,
        style: {
          ...edge.style,
          opacity: 1,
          strokeWidth: isConnectedToSelected ? 5 : 2,
        }
      };
    });
    
    // Only update state if needed to avoid infinite loops
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    
  // Remove 'nodes' from dependency array, as it causes infinite loops
  }, [selectedNode, filteredCategories, setNodes, setEdges]);
  
  // Create details panel for selected node
  const renderDetailsPanel = () => {
    if (!selectedNode) return null;
    
    const selectedNodeObj = nodes.find(node => node.id === selectedNode);
    if (!selectedNodeObj) return null;
    
    // First convert to unknown then to CourseNodeData to avoid TypeScript errors
    const selectedNodeData = (selectedNodeObj.data as unknown) as CourseNodeData;
    
    // Find prerequisites - filter and ensure safe type casting
    const prerequisites = nodes.filter(node => {
      const nodeData = (node.data as unknown) as CourseNodeData;
      return nodeData.relationshipToSelected === 'prereq';
    });
    
    // Find corequisites - filter and ensure safe type casting
    const corequisites = nodes.filter(node => {
      const nodeData = (node.data as unknown) as CourseNodeData;
      return nodeData.relationshipToSelected === 'coreq';
    });
    
    // Find courses that this is a prerequisite for - filter and ensure safe type casting
    const dependentCourses = nodes.filter(node => {
      const nodeData = (node.data as unknown) as CourseNodeData;
      return nodeData.relationshipToSelected === 'dependent';
    });
    
    return (
      <Panel position="top-right" className="bg-white p-4 rounded shadow-md w-[300px]">
        <div className="mb-2 pb-2 border-b border-gray-200">
          <h3 className="font-bold text-lg">{selectedNodeData.label}</h3>
          <p className="text-sm text-gray-600">{selectedNodeData.title}</p>
          <p className="text-sm">{selectedNodeData.credits} Credits</p>
          {selectedNodeData.category && (
            <p className="text-xs text-gray-500 mt-1">Category: {selectedNodeData.category}</p>
          )}
        </div>
        
        {prerequisites.length > 0 && (
          <div className="mb-2">
            <h4 className="font-semibold text-sm text-red-700">Prerequisites:</h4>
            <ul className="text-xs ml-2">
              {prerequisites.map(node => {
                const nodeData = (node.data as unknown) as CourseNodeData;
                return (
                  <li key={`prereq-${node.id}`} className="mt-1">
                    <span className="font-medium">{nodeData.label}</span> - {nodeData.title}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        {corequisites.length > 0 && (
          <div className="mb-2">
            <h4 className="font-semibold text-sm text-blue-700">Corequisites:</h4>
            <ul className="text-xs ml-2">
              {corequisites.map(node => {
                const nodeData = (node.data as unknown) as CourseNodeData;
                return (
                  <li key={`coreq-${node.id}`} className="mt-1">
                    <span className="font-medium">{nodeData.label}</span> - {nodeData.title}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        {dependentCourses.length > 0 && (
          <div className="mb-2">
            <h4 className="font-semibold text-sm text-green-700">Required for:</h4>
            <ul className="text-xs ml-2">
              {dependentCourses.map(node => {
                const nodeData = (node.data as unknown) as CourseNodeData;
                return (
                  <li key={`dependent-${node.id}`} className="mt-1">
                    <span className="font-medium">{nodeData.label}</span> - {nodeData.title}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        <button 
          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          onClick={() => setSelectedNode(null)}
        >
          Clear Selection & Show All Nodes
        </button>
      </Panel>
    );
  };

  // Create notification panel to show when nodes are hidden
  const renderFilterNotification = () => {
    if (!selectedNode && filteredCategories.length === 0) return null;
    
    // Count visible and hidden nodes
    const visibleNodes = nodes.filter(node => !node.hidden).length;
    const totalNodes = nodes.length;
    const hiddenCount = totalNodes - visibleNodes;
    
    return (
      <Panel position="bottom-center" className="bg-blue-50 px-4 py-2 rounded shadow-md">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-blue-700">
            {selectedNode 
              ? `Showing only connected nodes. ${hiddenCount} nodes are hidden.` 
              : `Filtered by categories: ${filteredCategories.join(', ')}. ${hiddenCount} nodes are hidden.`}
          </span>
          <button 
            className="ml-4 text-xs text-blue-700 underline"
            onClick={() => {
              setSelectedNode(null);
              setFilteredCategories([]);
            }}
          >
            Clear All Filters
          </button>
        </div>
      </Panel>
    );
  };
  
  // Handle category filter toggling
  const toggleCategoryFilter = (category: string) => {
    setFilteredCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Render category filter controls
  const renderCategoryFilters = () => {
    if (Object.keys(categoryColors).length === 0) return null;
    
    // Calculate count of visible courses per category
    const categoryCounts: Record<string, {total: number, visible: number}> = {};
    
    // Initialize counts
    Object.keys(categoryColors).forEach(category => {
      categoryCounts[category] = { total: 0, visible: 0 };
    });
    
    // Count nodes per category
    nodes.forEach(node => {
      const category = (node.data as any).category;
      if (category && categoryCounts[category]) {
        categoryCounts[category].total += 1;
        if (!node.hidden) {
          categoryCounts[category].visible += 1;
        }
      }
    });
    
    return (
      <Panel position="top-left">
        <div className="bg-white p-3 rounded shadow-md text-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold">Course Categories</p>
            {filteredCategories.length > 0 && (
              <button 
                className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                onClick={() => setFilteredCategories([])}
              >
                Clear Filters
              </button>
            )}
          </div>
          
          <div className="border-b border-gray-200 pb-2 mb-2">
            <p className="flex items-center mb-1">
              <span className="inline-block w-3 h-3 mr-2 bg-red-500"></span> 
              <span>Prerequisites (must take before)</span>
            </p>
            <p className="flex items-center">
              <span className="inline-block w-3 h-3 mr-2 bg-blue-500"></span> 
              <span>Corequisites (take together)</span>
            </p>
          </div>
          
          <div className="pt-1">
            <div className="flex justify-between mb-2">
              <p className="font-semibold text-xs">Filter by Category:</p>
              <span className="text-xs text-gray-500">
                {filteredCategories.length > 0 
                  ? `${filteredCategories.length} active` 
                  : 'All visible'}
              </span>
            </div>
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
              {Object.entries(categoryColors).map(([category, color]) => {
                const count = categoryCounts[category] || { total: 0, visible: 0 };
                const isActive = filteredCategories.includes(category);
                const hasHidden = count.visible < count.total;
                
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
                      {count.visible}/{count.total}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <p>Click to toggle filters</p>
              {filteredCategories.length > 0 && (
                <button 
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  onClick={() => setFilteredCategories([])}
                >
                  Show All
                </button>
              )}
            </div>
          </div>
        </div>
      </Panel>
    );
  };
  
  // Make these available to the parent component through a ref
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.courseGraphState = {
        filteredCategories,
        toggleCategoryFilter
      };
    }
  }, [filteredCategories]);
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      fitView
      fitViewOptions={{ padding: 0.5 }}
      minZoom={0.1}
      maxZoom={2}
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionLineType={ConnectionLineType.Straight}
      connectionMode={ConnectionMode.Loose}
      proOptions={{ hideAttribution: true }}
      elementsSelectable={true}
      selectNodesOnDrag={false}
      nodesFocusable={true}
      nodesConnectable={false}
    >
      <Background color="#f8f8f8" gap={16} />
      <Controls />
      {renderDetailsPanel()}
      {renderFilterNotification()}
      {/* Remove the category filters panel since filtering is now handled in the main legend */}
    </ReactFlow>
  );
}

// Create a memoized wrapper for ReactFlow component to prevent unnecessary renders
const MemoizedFlowGraph = React.memo(FlowGraph);

// Helper function to get course category from code
function getCourseCategory(code: string): string {
  // Extract the course prefix (e.g., "CS" from "CS 113")
  const match = code.match(/^([A-Z]+)/);
  return match ? match[1] : "Other";
}

// Fix normalizeCourseId function
function normalizeCourseId(code: string): string {
  // Trim whitespace and ensure consistent formatting
  return code.trim().replace(/\s+/g, ' ');
}

// Fix getCategoryColor function
function getCategoryColor(code: string): string {
  // Extract the department code (e.g., CS, MATH)
  const department = getCourseCategory(code);
  
  // Map of department to colors
  const departmentColors: Record<string, string> = {
    'CS': '#4285F4',    // Google Blue
    'MATH': '#EA4335',  // Google Red
    'PHYS': '#FBBC05',  // Google Yellow
    'CHEM': '#34A853',  // Google Green
    'BIOL': '#8F44AD',  // Purple
    'ECON': '#F39C12',  // Orange
    'ENGL': '#16A085',  // Teal
    'HIST': '#E74C3C',  // Bright Red
  };
  
  return departmentColors[department] || '#7F8C8D'; // Default to gray
}

// Add the addEdgeIfNotExists function definition
function addEdgeIfNotExists(
  sourceId: string,
  targetId: string,
  edgeType: string,
  index: number,
  edgeElements: any[],
  edgeTracker: Set<string>,
  nodeMap: Record<string, any>,
  isPrereq: boolean = true
) {
  const edgeSignature = `${sourceId}-${targetId}-${edgeType}`;
  if (edgeTracker.has(edgeSignature)) {
    console.log(`Skipping duplicate edge: ${edgeSignature}`);
    return;
  }
  
  // Make sure we have both source and target nodes
  if (!nodeMap[sourceId] || !nodeMap[targetId]) {
    console.warn(`Cannot create edge: missing node for ${sourceId} or ${targetId}`);
    return;
  }
  
  // Choose appropriate handles based on node positions
  let sourceHandle = "bottom";
  let targetHandle = "top";
  
  // If we have node positions, determine best handles
  if (nodeMap[sourceId].position && nodeMap[targetId].position) {
    const sourcePos = nodeMap[sourceId].position;
    const targetPos = nodeMap[targetId].position;
    
    // Calculate angle between nodes
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Choose handles based on angle
    if (angle > -45 && angle < 45) {
      // Target is to the right
      sourceHandle = "right";
      targetHandle = "left";
    } else if (angle >= 45 && angle < 135) {
      // Target is below
      sourceHandle = "bottom";
      targetHandle = "top";
    } else if (angle >= 135 || angle < -135) {
      // Target is to the left
      sourceHandle = "left";
      targetHandle = "right";
    } else {
      // Target is above
      sourceHandle = "top";
      targetHandle = "bottom";
    }
  }
  
  const edgeId = `${sourceId}-to-${targetId}-${edgeType}-${index}`;
  
  // Create edge with data in the format expected by FlowGraph
  const edge = {
    data: {
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: edgeType,
      isPrereq: isPrereq,
      label: edgeType
    }
  };
  
  console.log(`Creating ${edgeType} edge: ${sourceId} -> ${targetId} (ID: ${edgeId})`);
  
  edgeElements.push(edge);
  edgeTracker.add(edgeSignature);
}

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
        <h1 className="text-5xl mb-10 text-center font-bold text-primary-green">iWannaGraduate</h1>
        <p className="text-center text-lg mb-8">
          The ultimate tool to navigate your degree requirements and plan your path to graduation.
        </p>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'courses'
                ? 'bg-white border-l border-t border-r border-gray-200 text-primary-blue'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
            onClick={() => setActiveTab('courses')}
          >
            Course Search
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'requirements'
                ? 'bg-white border-l border-t border-r border-gray-200 text-primary-blue'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
            onClick={() => setActiveTab('requirements')}
          >
            Degree Requirements
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'professors'
                ? 'bg-white border-l border-t border-r border-gray-200 text-primary-blue'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}
            onClick={() => setActiveTab('professors')}
          >
            Professors
          </button>
        </div>

        {activeTab === 'courses' ? (
          <>
            {/* Course Search and Results */}
            <div className="mb-8 bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Course Search
                </h2>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search for courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    className="px-4 py-2 bg-primary-blue text-white rounded hover:bg-blue-700 shadow-sm"
                    onClick={() => {
                      // Implement course search functionality
                      console.log("Searching for courses:", searchTerm);
                    }}
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Course Results */}
              <div className="mt-4">
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
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
          </>
        ) : activeTab === 'requirements' ? (
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
                            // Get course count for this category
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
                
                {/* Flow chart - using ReactFlow */}
                <div className="h-[700px] bg-white border rounded-md shadow-lg">
                  <ReactFlowProvider key="react-flow-provider">
                    <MemoizedFlowGraph 
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
          </>
        ) : activeTab === 'professors' ? (
          <Professors />
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
