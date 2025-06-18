"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Position,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import React from "react";

import { FlowGraphProps } from '@/types/flowGraph';
import CourseNode from './CourseNode';

// Flow Graph Component
function FlowGraph({ elements, categoryColors, initialFilteredCategories = [], connectionFilter = 0, showPrereqsCoreqs = false, showUnlocks = false }: FlowGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  // Use a ref to store connected edges to avoid dependency issues
  const edgesRef = useRef<FlowEdge[]>([]);
  // Add state for category filters
  const [filteredCategories, setFilteredCategories] = useState<string[]>(initialFilteredCategories);
  // Add state for connection filters
  const [currentConnectionFilter, setCurrentConnectionFilter] = useState<number>(connectionFilter);
  const [currentShowPrereqsCoreqs, setCurrentShowPrereqsCoreqs] = useState<boolean>(showPrereqsCoreqs);
  const [currentShowUnlocks, setCurrentShowUnlocks] = useState<boolean>(showUnlocks);
  
  // Update the edges ref whenever edges change
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Update filtered categories when prop changes
  useEffect(() => {
    setFilteredCategories(initialFilteredCategories);
  }, [initialFilteredCategories]);

  // Update connection filters when props change
  useEffect(() => {
    setCurrentConnectionFilter(connectionFilter);
    setCurrentShowPrereqsCoreqs(showPrereqsCoreqs);
    setCurrentShowUnlocks(showUnlocks);
  }, [connectionFilter, showPrereqsCoreqs, showUnlocks]);

  // Helper function to calculate connection counts for a course
  const calculateConnectionCount = useCallback((courseId: string, includePrereqsCoreqs: boolean, includeUnlocks: boolean) => {
    const currentEdges = edgesRef.current;
    
    let count = 0;
    
    if (includePrereqsCoreqs) {
      // Count prerequisites (edges pointing TO this course)
      count += currentEdges.filter(edge => 
        edge.target === courseId && edge.data?.type === 'prereq'
      ).length;
      
      // Count corequisites (edges from OR to this course with coreq type)
      count += currentEdges.filter(edge => 
        (edge.source === courseId || edge.target === courseId) && edge.data?.type === 'coreq'
      ).length;
    }
    
    if (includeUnlocks) {
      // Count unlocks (edges FROM this course to other courses)
      count += currentEdges.filter(edge => 
        edge.source === courseId && edge.data?.type === 'prereq'
      ).length;
    }
    
    return count;
  }, []);
  
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
      
      // Helper function to extract course number for sorting
      const extractCourseNumber = (courseCode: string): number => {
        const match = courseCode.match(/(\d+)/);
        return match ? parseInt(match[1]) : 999; // Put non-numeric courses at the end
      };

      // Helper function to create structured layout
      const createStructuredLayout = (nodeElements: any[]) => {
        // Separate regular course nodes from category labels
        const courseNodes = nodeElements.filter(el => !el.data.isLabel);
        const labelNodes = nodeElements.filter(el => el.data.isLabel);
        
        // Group courses by category
        const coursesByCategory: Record<string, any[]> = {};
        courseNodes.forEach(el => {
          const category = el.data.category || 'Other';
          if (!coursesByCategory[category]) {
            coursesByCategory[category] = [];
          }
          coursesByCategory[category].push(el);
        });

        // Sort courses within each category by course number
        Object.keys(coursesByCategory).forEach(category => {
          coursesByCategory[category].sort((a, b) => {
            const numA = extractCourseNumber(a.data.label || a.data.id);
            const numB = extractCourseNumber(b.data.label || b.data.id);
            return numA - numB;
          });
        });

                          // Layout configuration
         const CARD_WIDTH = 210; // Slightly wider to accommodate 190px cards + margin
         const CARD_HEIGHT = 150; // Taller to accommodate 130px cards + margin
         const GROUP_SPACING = 120; // Vertical space between category groups
         const CARD_SPACING = 25; // Space between cards within a group
         const ROW_SPACING = 40; // Extra space between rows
         const CARDS_PER_ROW = 7; // More cards per row since we have more horizontal space
         const START_X = 80;
         const START_Y = 120;

         const positionedNodes: FlowNode[] = [];
         let currentGroupY = START_Y;

                 // Process each category group
         Object.entries(coursesByCategory).forEach(([category, courses]) => {
           if (courses.length === 0) return;

          // Calculate group dimensions
          const totalCards = courses.length;
          const rowsNeeded = Math.ceil(totalCards / CARDS_PER_ROW);
          const cardsInLastRow = totalCards % CARDS_PER_ROW || CARDS_PER_ROW;
          const maxCardsInAnyRow = Math.min(CARDS_PER_ROW, totalCards);
          
          // Group width is based on the widest row
          const groupWidth = (maxCardsInAnyRow * CARD_WIDTH) + ((maxCardsInAnyRow - 1) * CARD_SPACING);

                     // Create category label
           const categoryLabelNode: FlowNode = {
             id: `category-label-${category}`,
             type: 'courseNode',
             position: {
               x: START_X + (groupWidth / 2) - 80, // Center the label horizontally
               y: currentGroupY - 70 // Position above the current group
             },
            data: {
              label: category,
              title: '',
              credits: 0,
              prerequisites: '',
              category: category,
              categoryColor: categoryColors[category] || '#6b7280',
              isLabel: true,
              relationshipToSelected: null,
              isHighlighted: false
            }
          };
          positionedNodes.push(categoryLabelNode);

          // Position course cards in grid within this group
          courses.forEach((course, index) => {
            const rowIndex = Math.floor(index / CARDS_PER_ROW);
            const colIndex = index % CARDS_PER_ROW;
            
                         // Calculate cards in current row for centering
             const cardsInCurrentRow = (rowIndex === rowsNeeded - 1) ? cardsInLastRow : CARDS_PER_ROW;
             const currentRowWidth = (cardsInCurrentRow * CARD_WIDTH) + ((cardsInCurrentRow - 1) * CARD_SPACING);
             const rowStartX = START_X + (groupWidth - currentRowWidth) / 2;

             const position = {
               x: rowStartX + (colIndex * (CARD_WIDTH + CARD_SPACING)),
               y: currentGroupY + (rowIndex * (CARD_HEIGHT + ROW_SPACING))
        };
        
            const node: FlowNode = {
              id: course.data.id,
          type: 'courseNode',
          position: position,
              data: {
                label: course.data.label || course.data.id,
                title: course.data.title || '',
                credits: course.data.credits || 0,
                prerequisites: course.data.prerequisites,
                category: course.data.category || '',
                categoryColor: course.data.color || '#cccccc',
                isLabel: course.data.isLabel || false,
                relationshipToSelected: null,
                isHighlighted: false
              }
            };

            positionedNodes.push(node);
          });

                     // Move to next group position (vertically)
           const groupHeight = rowsNeeded * CARD_HEIGHT + (rowsNeeded - 1) * ROW_SPACING;
           currentGroupY += groupHeight + GROUP_SPACING;
         });

         // Add any standalone label nodes that weren't part of categories
         labelNodes.forEach(el => {
           if (!coursesByCategory[el.data.label]) {
             positionedNodes.push({
               id: el.data.id,
               type: 'courseNode',
               position: el.position || { x: START_X, y: currentGroupY },
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
            });
          }
        });

        return positionedNodes;
      };

      // Create ReactFlow nodes with structured layout
      const courseNodes: FlowNode[] = createStructuredLayout(nodeElements);
      
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
    const nodeData = node.data as any;
    
    // If this is a category label, filter to show only nodes in this category
    if (nodeData.isLabel) {
      const category = nodeData.label;
      setFilteredCategories(prevFiltered => {
        // Toggle category filter: if already filtered by this category, clear it
        if (prevFiltered.includes(category)) {
          return [];
        } else {
          return [category];
        }
      });
      // Clear node selection when clicking category labels
      setSelectedNode(null);
    } else {
      // Regular course node behavior
    // Toggle selection: if the same node is clicked, clear selection
    setSelectedNode(prevSelected => prevSelected === node.id ? null : node.id);
      // Clear category filters when clicking on individual courses
      setFilteredCategories([]);
    }
  }, []);

  // Apply highlighting and filtering to nodes and edges based on selection and category filters
  useEffect(() => {
    // First check for category filters
    const shouldApplyCategoryFilter = filteredCategories.length > 0;
    const shouldApplyConnectionFilter = currentConnectionFilter > 0 && (currentShowPrereqsCoreqs || currentShowUnlocks);
    
    // If no node is selected and no filters active, reset all nodes and edges 
    if (!selectedNode && !shouldApplyCategoryFilter && !shouldApplyConnectionFilter) {
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
      
      // Check connection filter
      let matchesConnectionFilter = true;
      if (shouldApplyConnectionFilter) {
        if (currentShowPrereqsCoreqs && currentShowUnlocks) {
          // Both selected - count total connections
          const connectionCount = calculateConnectionCount(node.id, true, true);
          matchesConnectionFilter = connectionCount >= currentConnectionFilter;
        } else if (currentShowPrereqsCoreqs) {
          // Only prereqs/coreqs selected - count only those
          const connectionCount = calculateConnectionCount(node.id, true, false);
          matchesConnectionFilter = connectionCount >= currentConnectionFilter;
        } else if (currentShowUnlocks) {
          // Only unlocks selected - count only those
          const connectionCount = calculateConnectionCount(node.id, false, true);
          matchesConnectionFilter = connectionCount >= currentConnectionFilter;
        }
      }
      
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
      
      // Hide nodes that don't match our criteria (not connected or filtered out by category/connections)
      const shouldBeHidden = (selectedNode && !isConnected) || !matchesCategory || !matchesConnectionFilter;
      
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
  }, [selectedNode, filteredCategories, currentConnectionFilter, currentShowPrereqsCoreqs, currentShowUnlocks, calculateConnectionCount, setNodes, setEdges]);
  
  // Create details panel for selected node
  const renderDetailsPanel = () => {
    if (!selectedNode) return null;
    
    const selectedNodeObj = nodes.find(node => node.id === selectedNode);
    if (!selectedNodeObj) return null;
    
    // First convert to unknown then to CourseNodeData to avoid TypeScript errors
    const selectedNodeData = (selectedNodeObj.data as unknown) as any;
    
    // Find prerequisites - filter and ensure safe type casting
    const prerequisites = nodes.filter(node => {
      const nodeData = (node.data as unknown) as any;
      return nodeData.relationshipToSelected === 'prereq';
    });
    
    // Find corequisites - filter and ensure safe type casting
    const corequisites = nodes.filter(node => {
      const nodeData = (node.data as unknown) as any;
      return nodeData.relationshipToSelected === 'coreq';
    });
    
    // Find courses that this is a prerequisite for - filter and ensure safe type casting
    const dependentCourses = nodes.filter(node => {
      const nodeData = (node.data as unknown) as any;
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
                const nodeData = (node.data as unknown) as any;
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
                const nodeData = (node.data as unknown) as any;
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
                const nodeData = (node.data as unknown) as any;
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
              : filteredCategories.length > 0
                ? `Showing only "${filteredCategories.join(', ')}" courses. ${hiddenCount} nodes are hidden.`
                : `${hiddenCount} nodes are hidden.`}
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
                    onClick={() => toggleCategoryFilter(category)}
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

export default MemoizedFlowGraph; 