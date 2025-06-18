"use client";

import { Handle, Position, NodeProps, useStore } from 'reactflow';
import { CourseNodeData } from '@/types/course';

// Custom node component for courses
function CourseNode({ data }: { data: CourseNodeData }) {
  // Get the current zoom level from ReactFlow store
  const zoom = useStore((state) => state.transform[2]);
  // If this is a category label, render a different component
  if (data.isLabel) {
    return (
      <div 
        className="flex items-center justify-center rounded-md px-4 py-2 font-bold text-lg cursor-pointer transition-all duration-200"
        style={{ 
          backgroundColor: data.categoryColor,
          minWidth: '160px',
          textAlign: 'center',
          color: '#1f2937' // Dark gray text for better visibility
        }}
      >
        {data.label}
      </div>
    );
  }

  // Determine styles based on relationship to selected node
  let zIndex = 0;
  
  if (data.relationshipToSelected) {
    zIndex = 10;
  }

  // Regular course node
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg p-1.5 w-[160px] h-[110px] text-center ${
        data.isHighlighted ? 'z-10' : 'z-0'
      }`}
              style={{
          backgroundColor: data.categoryColor, // Fully opaque
          border: `2px solid ${data.categoryColor}`,
          transition: 'all 0.3s ease',
          opacity: data.isFirstDegreeConnection ? 0.5 : 1,
          zIndex: zIndex,
        }}
    >
      {/* Single centered handle - ReactFlow will calculate perimeter intersection */}
      <Handle
        type="target"
        position={Position.Top}
        id="center"
        style={{ 
          opacity: 0,
          pointerEvents: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="center"
        style={{ 
          opacity: 0,
          pointerEvents: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      {/* Conditional rendering based on zoom level */}
      {zoom < 0.8 ? (
        // Zoomed out view - only show course code in larger text, sized to fit all codes
        <div className="font-bold text-3xl flex items-center justify-center h-full px-1.5 text-center leading-tight truncate w-full" 
             style={{ 
               fontSize: data.label.length > 8 ? '1.5rem' : data.label.length > 6 ? '1.75rem' : '2rem',
               lineHeight: '1.1'
             }}>
          {data.label}
        </div>
      ) : (
        // Zoomed in view - show all details
        <>
          <div className="font-bold text-lg truncate w-full px-1">{data.label}</div>
          {data.title && (
            <div className="text-xs line-clamp-2 mt-1 h-8 overflow-hidden px-1 leading-tight">
              {data.title}
            </div>
          )}
          <div className="flex flex-col mt-1 w-full px-1">
            {data.credits !== undefined && (
              <span className="text-gray-700 text-xs truncate leading-none">{data.credits} Credits</span>
            )}
            {data.category && !data.isLabel && (
              <span className="text-xs text-gray-600 italic truncate leading-none">
                {data.category}
              </span>
            )}
          </div>
        </>
      )}
      
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

export default CourseNode; 