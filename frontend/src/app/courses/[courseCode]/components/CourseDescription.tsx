"use client";

import React, { useState, useRef, useEffect } from 'react';

interface CourseDescriptionProps {
  description: string;
}

export default function CourseDescription({ description }: CourseDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);

  // Check if description overflows 4 lines
  useEffect(() => {
    if (descriptionRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(descriptionRef.current).lineHeight);
      const maxHeight = lineHeight * 4; // 4 lines max
      const actualHeight = descriptionRef.current.scrollHeight;
      
      setIsOverflowing(actualHeight > maxHeight);
    }
  }, [description]);

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2">Description</h3>
      <div>
        <p 
          ref={descriptionRef}
          className={`text-gray-700 ${!isExpanded ? 'line-clamp-4' : ''}`}
        >
          {description}
        </p>
        {isOverflowing && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 hover:text-blue-700 hover:underline mt-2 text-sm font-medium"
          >
            {isExpanded ? 'Show less' : 'Show more...'}
          </button>
        )}
      </div>
    </div>
  );
} 