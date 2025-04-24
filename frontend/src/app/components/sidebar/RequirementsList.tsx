"use client";

import React from 'react';
import { RequirementsListProps } from './types';
import RequirementGroup from './RequirementGroup';
import { SkeletonList, SkeletonCard } from '../ui';

const RequirementsList: React.FC<RequirementsListProps> = ({
  loading,
  requirementsError,
  requirementGroups,
  requirements,
  showMajorSelect,
  onGroupToggle,
  onOptionSelect,
  onRequirementClick,
  onRequirementDragStart
}) => {
  if (loading) {
    return (
      <div className="p-4">
        <SkeletonCard hasHeader={true} hasImage={false} contentLines={1} className="mb-4" />
        <SkeletonList items={6} hasImage={false} className="pl-2" />
      </div>
    );
  }

  if (requirementsError) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p className="text-sm">{requirementsError}</p>
      </div>
    );
  }

  if (!showMajorSelect && requirementGroups.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No requirements found for this major</p>
      </div>
    );
  }

  return (
    <div className="flex-col overflow-hidden">
      <div className="overflow-y-auto">
        {/* Summary info */}
        {requirements && (
          <div className="px-4 py-3 bg-primary-blue/5 border-b border-primary-blue/10">
            <p className="text-sm text-gray-700">
              Total Credits Required: <span className="font-semibold text-primary-blue">{requirements.total_credits}</span>
            </p>
          </div>
        )}
        
        {requirementGroups.map((group, index) => (
          <RequirementGroup
            key={index}
            group={group}
            index={index}
            onToggle={() => onGroupToggle(index)}
            onOptionSelect={(option) => onOptionSelect(index, option)}
            onRequirementClick={onRequirementClick}
            onRequirementDragStart={onRequirementDragStart}
          />
        ))}
      </div>
    </div>
  );
};

export default RequirementsList; 