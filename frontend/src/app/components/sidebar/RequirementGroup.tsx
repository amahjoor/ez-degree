"use client";

import React from 'react';
import { RequirementGroupProps } from './types';

const RequirementGroup: React.FC<RequirementGroupProps> = ({
  group,
  index,
  onToggle,
  onOptionSelect,
  onRequirementClick,
  onRequirementDragStart
}) => {
  return (
    <div className="border-b border-gray-200">
      <div 
        className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <h3 className="text-gray-800 text-sm font-medium">{group.title}</h3>
        <svg 
          className={`w-5 h-5 text-gray-500 transform transition-transform ${group.isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {group.isOpen && group.isChoice && group.options && (
        <div className="px-6 py-3">
          <div className="mb-2 ml-2">
            <div className="inline-flex items-center justify-center w-6 h-6 text-xs text-white bg-primary-green rounded-full">
              1
            </div>
            <span className="ml-2 text-gray-600">Choose from the following options:</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {group.options.map((option, optionIndex) => (
              <button
                key={optionIndex}
                className={`px-4 py-2 rounded-md ${
                  group.selectedOption === option
                    ? 'bg-primary-blue text-white'
                    : 'bg-blue-50 text-primary-blue hover:bg-blue-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOptionSelect(option);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {group.isOpen && group.requirements && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {group.requirements.map((req, reqIndex) => (
            <div 
              key={reqIndex}
              className="course-chip bg-blue-50 border border-blue-100 px-3 py-1.5 rounded text-primary-blue text-sm font-medium cursor-pointer hover:bg-blue-100 flex items-center shadow-sm hover:shadow-md transition-all relative"
              draggable="true"
              onDragStart={(e) => onRequirementDragStart(e, req)}
              onClick={(e) => onRequirementClick(req, e)}
              title={req.title}
            >
              {req.id}
              {req.completed && (
                <span className="ml-2 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequirementGroup; 