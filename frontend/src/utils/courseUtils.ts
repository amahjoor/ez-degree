// Parse prerequisites string
export const parsePrerequisites = (prereqString?: string): string[] => {
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

// Helper function to get course category from code
export function getCourseCategory(code: string): string {
  // Extract the course prefix (e.g., "CS" from "CS 113")
  const match = code.match(/^([A-Z]+)/);
  return match ? match[1] : "Other";
}

// Fix normalizeCourseId function
export function normalizeCourseId(code: string): string {
  // Trim whitespace and ensure consistent formatting
  return code.trim().replace(/\s+/g, ' ');
}

// Fix getCategoryColor function
export function getCategoryColor(code: string): string {
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
export function addEdgeIfNotExists(
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
  