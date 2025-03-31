import { Handle, Position } from 'reactflow';
import { CourseNodeData } from '@/types/course';

interface CourseNodeProps {
  data: CourseNodeData;
}

export function CourseNode({ data }: CourseNodeProps) {
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