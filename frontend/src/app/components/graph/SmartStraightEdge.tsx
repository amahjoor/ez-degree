import React from 'react';
import { EdgeProps, getStraightPath, BaseEdge } from 'reactflow';

// Helper function to calculate intersection of line with rectangle
function getRectangleIntersection(
  centerX: number,
  centerY: number,
  targetX: number,
  targetY: number,
  width: number,
  height: number
) {
  const dx = targetX - centerX;
  const dy = targetY - centerY;

  // Handle edge case where nodes are at the same position
  if (dx === 0 && dy === 0) {
    return { x: centerX, y: centerY };
  }

  // Calculate the angle from center to target
  const angle = Math.atan2(dy, dx);

  // Half dimensions
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Calculate intersection with rectangle edges
  let intersectX, intersectY;

  // Check which edge of the rectangle the line will intersect
  const tanAngle = Math.tan(angle);
  const cotAngle = 1 / tanAngle;

  // Right edge
  if (Math.cos(angle) > 0) {
    intersectX = centerX + halfWidth;
    intersectY = centerY + halfWidth * tanAngle;
    if (Math.abs(intersectY - centerY) <= halfHeight) {
      return { x: intersectX, y: intersectY };
    }
  }

  // Left edge
  if (Math.cos(angle) < 0) {
    intersectX = centerX - halfWidth;
    intersectY = centerY - halfWidth * tanAngle;
    if (Math.abs(intersectY - centerY) <= halfHeight) {
      return { x: intersectX, y: intersectY };
    }
  }

  // Bottom edge
  if (Math.sin(angle) > 0) {
    intersectY = centerY + halfHeight;
    intersectX = centerX + halfHeight * cotAngle;
    if (Math.abs(intersectX - centerX) <= halfWidth) {
      return { x: intersectX, y: intersectY };
    }
  }

  // Top edge
  if (Math.sin(angle) < 0) {
    intersectY = centerY - halfHeight;
    intersectX = centerX - halfHeight * cotAngle;
    if (Math.abs(intersectX - centerX) <= halfWidth) {
      return { x: intersectX, y: intersectY };
    }
  }

  // Fallback (should not reach here)
  return { x: centerX, y: centerY };
}

export default function SmartStraightEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
  labelStyle,
  data,
}: EdgeProps) {
  // Node dimensions (matching CourseNode.tsx)
  const nodeWidth = 160;
  const nodeHeight = 110;

  // Calculate source node center
  const sourceCenterX = sourceX;
  const sourceCenterY = sourceY;

  // Calculate target node center
  const targetCenterX = targetX;
  const targetCenterY = targetY;

  // Calculate intersection points
  const sourceIntersection = getRectangleIntersection(
    sourceCenterX,
    sourceCenterY,
    targetCenterX,
    targetCenterY,
    nodeWidth,
    nodeHeight
  );

  const targetIntersection = getRectangleIntersection(
    targetCenterX,
    targetCenterY,
    sourceCenterX,
    sourceCenterY,
    nodeWidth,
    nodeHeight
  );

  // Get the path
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX: sourceIntersection.x,
    sourceY: sourceIntersection.y,
    targetX: targetIntersection.x,
    targetY: targetIntersection.y,
  });

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={style}
      />
      {label && (
        <text
          x={labelX}
          y={labelY}
          style={labelStyle}
          className="fill-current"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {label}
        </text>
      )}
    </>
  );
} 