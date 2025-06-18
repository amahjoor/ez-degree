import React from 'react';
import { Panel } from 'reactflow';
import { Node as FlowNode, Edge as FlowEdge } from 'reactflow';

interface GraphFiltersProps {
  selectedNode: string | null;
  filteredCategories: string[];
  currentConnectionFilter: number;
  currentShowPrereqsCoreqs: boolean;
  currentShowUnlocks: boolean;
  currentShowFirstDegreeConnections: boolean;
  nodes: FlowNode[];
  onClearFilters: () => void;
  onClearSelection: () => void;
}

interface FilterNotificationProps {
  selectedNode: string | null;
  filteredCategories: string[];
  currentConnectionFilter: number;
  currentShowPrereqsCoreqs: boolean;
  currentShowUnlocks: boolean;
  currentShowFirstDegreeConnections: boolean;
  nodes: FlowNode[];
  onClearFilters: () => void;
}

// Helper function to calculate connection counts for a course
export const calculateConnectionCount = (
  courseId: string, 
  includePrereqsCoreqs: boolean, 
  includeUnlocks: boolean,
  edges: FlowEdge[]
) => {
  let count = 0;
  
  if (includePrereqsCoreqs) {
    // Count prerequisites (edges pointing TO this course)
    count += edges.filter(edge => 
      edge.target === courseId && edge.data?.type === 'prereq'
    ).length;
    
    // Count corequisites (edges from OR to this course with coreq type)
    count += edges.filter(edge => 
      (edge.source === courseId || edge.target === courseId) && edge.data?.type === 'coreq'
    ).length;
  }
  
  if (includeUnlocks) {
    // Count unlocks (edges FROM this course to other courses)
    count += edges.filter(edge => 
      edge.source === courseId && edge.data?.type === 'prereq'
    ).length;
  }
  
  return count;
};

// Helper function to check if a node is a first-degree connection to any filtered nodes
export const isFirstDegreeConnection = (
  nodeId: string,
  currentShowFirstDegreeConnections: boolean,
  currentEdges: FlowEdge[],
  nodes: FlowNode[],
  shouldApplyCategoryFilter: boolean,
  filteredCategories: string[],
  shouldApplyConnectionFilter: boolean,
  currentShowPrereqsCoreqs: boolean,
  currentShowUnlocks: boolean,
  currentConnectionFilter: number,
  calculateConnectionCount: (courseId: string, includePrereqsCoreqs: boolean, includeUnlocks: boolean, edges: FlowEdge[]) => number
): boolean => {
  if (!currentShowFirstDegreeConnections) {
    return false;
  }
  
  // Check if this node is connected to any node that passes the base filters
  return currentEdges.some(edge => {
    const connectedNodeId = edge.source === nodeId ? edge.target : 
                           edge.target === nodeId ? edge.source : null;
    
    if (!connectedNodeId) return false;
    
    // Find the connected node
    const connectedNode = nodes.find(n => n.id === connectedNodeId);
    if (!connectedNode) return false;
    
    // Check if the connected node passes base filters
    const nodeCategory = (connectedNode.data as any)?.category || '';
    const matchesCategory = !shouldApplyCategoryFilter || 
      filteredCategories.includes(nodeCategory);
    
    let matchesConnectionFilter = true;
    if (shouldApplyConnectionFilter) {
      if (currentShowPrereqsCoreqs && currentShowUnlocks) {
        const connectionCount = calculateConnectionCount(connectedNodeId, true, true, currentEdges);
        matchesConnectionFilter = connectionCount >= currentConnectionFilter;
      } else if (currentShowPrereqsCoreqs) {
        const connectionCount = calculateConnectionCount(connectedNodeId, true, false, currentEdges);
        matchesConnectionFilter = connectionCount >= currentConnectionFilter;
      } else if (currentShowUnlocks) {
        const connectionCount = calculateConnectionCount(connectedNodeId, false, true, currentEdges);
        matchesConnectionFilter = connectionCount >= currentConnectionFilter;
      }
    }
    
    return matchesCategory && matchesConnectionFilter;
  });
};

// Filter notification panel component
export const FilterNotification: React.FC<FilterNotificationProps> = ({
  selectedNode,
  filteredCategories,
  currentConnectionFilter,
  currentShowPrereqsCoreqs,
  currentShowUnlocks,
  currentShowFirstDegreeConnections,
  nodes,
  onClearFilters
}) => {
  const shouldApplyCategoryFilter = filteredCategories.length > 0;
  const shouldApplyConnectionFilter = currentConnectionFilter > 0 && (currentShowPrereqsCoreqs || currentShowUnlocks);
  
  if (!selectedNode && !shouldApplyCategoryFilter && !shouldApplyConnectionFilter) return null;
  
  // Count visible and hidden nodes
  const visibleNodes = nodes.filter(node => !node.hidden).length;
  const totalNodes = nodes.length;
  const hiddenCount = totalNodes - visibleNodes;
  
  return (
    <Panel position="bottom-center" className="bg-white px-4 py-2 rounded shadow-md border border-blue-200">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-blue-700">
          {selectedNode 
            ? `Showing only connected nodes. ${hiddenCount} nodes are hidden.` 
            : (filteredCategories.length > 0 || (currentConnectionFilter > 0 && (currentShowPrereqsCoreqs || currentShowUnlocks)))
              ? `${hiddenCount} nodes hidden${currentShowFirstDegreeConnections ? ' (+connections)' : ''}`
              : `${hiddenCount} nodes are hidden.`}
        </span>
        <button 
          className="ml-4 text-xs text-blue-700 underline"
          onClick={onClearFilters}
        >
          Clear All Filters
        </button>
      </div>
    </Panel>
  );
};

// Main GraphFilters component (currently just exports the notification)
export const GraphFilters: React.FC<GraphFiltersProps> = (props) => {
  return (
    <FilterNotification
      selectedNode={props.selectedNode}
      filteredCategories={props.filteredCategories}
      currentConnectionFilter={props.currentConnectionFilter}
      currentShowPrereqsCoreqs={props.currentShowPrereqsCoreqs}
      currentShowUnlocks={props.currentShowUnlocks}
      currentShowFirstDegreeConnections={props.currentShowFirstDegreeConnections}
      nodes={props.nodes}
      onClearFilters={props.onClearFilters}
    />
  );
}; 