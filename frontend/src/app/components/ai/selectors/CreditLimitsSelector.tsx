"use client";

import React, { useState, useEffect, useRef } from 'react';

interface CreditLimits {
  min: number;
  max: number;
}

interface CreditLimitsSelectorProps {
  creditLimits: CreditLimits;
  onChange: (creditLimits: CreditLimits) => void;
}

const CreditLimitsSelector: React.FC<CreditLimitsSelectorProps> = ({
  creditLimits,
  onChange
}) => {
  const [minValue, setMinValue] = useState(creditLimits.min);
  const [maxValue, setMaxValue] = useState(creditLimits.max);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const minHandleRef = useRef<HTMLDivElement>(null);
  const maxHandleRef = useRef<HTMLDivElement>(null);
  
  // Values for the range
  const min = 0;
  const max = 21;
  const step = 1;
  
  useEffect(() => {
    setMinValue(creditLimits.min);
    setMaxValue(creditLimits.max);
  }, [creditLimits.min, creditLimits.max]);
  
  // Calculate percentages for positioning
  const getPercentage = (value: number) => ((value - min) / (max - min)) * 100;
  const minPercentage = getPercentage(minValue);
  const maxPercentage = getPercentage(maxValue);

  // Get value from position
  const getValueFromPosition = (position: number): number => {
    if (!sliderRef.current) return 0;
    
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const sliderWidth = sliderRect.width;
    const percentage = Math.min(Math.max(0, position / sliderWidth), 1);
    const rawValue = percentage * (max - min) + min;
    
    // Round to nearest step
    return Math.round(rawValue / step) * step;
  };
  
  // Handle click on the track
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const position = e.clientX - sliderRect.left;
    const value = getValueFromPosition(position);
    
    // Determine which handle to move based on position
    const minHandlePos = (minValue - min) / (max - min) * sliderRect.width;
    const maxHandlePos = (maxValue - min) / (max - min) * sliderRect.width;
    
    // Click is closer to min handle
    if (Math.abs(position - minHandlePos) < Math.abs(position - maxHandlePos)) {
      if (value <= maxValue) {
        setMinValue(value);
        onChange({ min: value, max: maxValue });
      }
    } 
    // Click is closer to max handle
    else {
      if (value >= minValue) {
        setMaxValue(value);
        onChange({ min: minValue, max: value });
      }
    }
  };

  // Setup mouse event listeners for handle dragging
  useEffect(() => {
    const minHandle = minHandleRef.current;
    const maxHandle = maxHandleRef.current;
    
    const handleMouseMove = (e: MouseEvent, isMin: boolean) => {
      if (!sliderRef.current) return;
      
      const sliderRect = sliderRef.current.getBoundingClientRect();
      const position = e.clientX - sliderRect.left;
      const value = getValueFromPosition(position);
      
      if (isMin) {
        // Don't allow min to go past max
        const newValue = Math.min(value, maxValue);
        setMinValue(newValue);
        onChange({ min: newValue, max: maxValue });
      } else {
        // Don't allow max to go below min
        const newValue = Math.max(value, minValue);
        setMaxValue(newValue);
        onChange({ min: minValue, max: newValue });
      }
    };
    
    // Setup function for handle dragging
    const setupDragHandler = (handle: HTMLDivElement | null, isMin: boolean) => {
      if (!handle) return;
      
      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        
        const onMouseMove = (e: MouseEvent) => handleMouseMove(e, isMin);
        
        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };
      
      handle.addEventListener('mousedown', onMouseDown);
      
      return () => {
        handle.removeEventListener('mousedown', onMouseDown);
      };
    };
    
    const cleanupMin = setupDragHandler(minHandle, true);
    const cleanupMax = setupDragHandler(maxHandle, false);
    
    return () => {
      cleanupMin?.();
      cleanupMax?.();
    };
  }, [minValue, maxValue, onChange]);
  
  return (
    <div className="bg-white rounded-lg mb-2">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-sm font-medium text-gray-800">Semester Credits</h4>
        <div className="text-sm text-primary-blue font-medium">
          {minValue === maxValue ? `${minValue} credits` : `${minValue}-${maxValue} credits`}
        </div>
      </div>
      
      <div className="relative h-10" ref={sliderRef}>
        {/* Track */}
        <div 
          className="absolute h-2 top-4 left-0 right-0 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleTrackClick}
        >
          {/* Reference lines */}
          {[3, 6, 9, 12, 15, 18].map((value) => {
            const percentage = getPercentage(value);
            return (
              <div
                key={`line-${value}`}
                className="absolute w-px h-4 -top-1 bg-gray-300"
                style={{ left: `${percentage}%` }}
              />
            );
          })}

          {/* Filled area */}
          <div 
            className="absolute h-full bg-primary-blue rounded-full" 
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`
            }}
          />
        </div>
        
        {/* Min handle */}
        <div
          ref={minHandleRef}
          className="absolute w-4 h-4 top-3 -ml-2 bg-white border-2 border-primary-blue rounded-full cursor-grab shadow-sm hover:scale-110 transition-transform"
          style={{
            left: `${minPercentage}%`,
            zIndex: 10
          }}
        />
        
        {/* Max handle */}
        <div
          ref={maxHandleRef}
          className="absolute w-4 h-4 top-3 -ml-2 bg-white border-2 border-primary-blue rounded-full cursor-grab shadow-sm hover:scale-110 transition-transform"
          style={{
            left: `${maxPercentage}%`,
            zIndex: 10
          }}
        />
        
        {/* Value labels */}
        <div className="absolute top-7 left-0 right-0 h-4 text-xs text-gray-500">
          {[0, 3, 6, 9, 12, 15, 18, 21].map((value) => {
            const percentage = getPercentage(value);
            return (
              <span
                key={value}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${percentage}%` }}
              >
                {value}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CreditLimitsSelector; 