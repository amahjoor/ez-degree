"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CourseInfo } from './CourseSelector';

interface CreditLimits {
  min: number;
  max: number;
}

interface CreditLimitsSelectorProps {
  creditLimits: CreditLimits;
  onChange: (creditLimits: CreditLimits) => void;
  selectedCourses: CourseInfo[];
  selectedTerm: string;
}

interface CourseAmount {
  Lecture: { courses: number; credits: string };
  Laboratory: { courses: number; credits: string };
}

const API_BASE_URL = `/api/v2/schedule-builder`;

const CreditLimitsSelector: React.FC<CreditLimitsSelectorProps> = ({
  creditLimits,
  onChange,
  selectedCourses,
  selectedTerm
}) => {
  const [minValue, setMinValue] = useState<number>(creditLimits.min);
  const [maxValue, setMaxValue] = useState<number>(creditLimits.max);
  const sliderRef = useRef<HTMLDivElement>(null);

  const isDisabled = selectedCourses.length === 0;
  const min = 0;
  const max = 21;
  const step = 1;
  const getPercentage = (v: number) => ((v - min) / (max - min)) * 100;

  // Recalculate auto-min when courses or term change
  useEffect(() => {
    if (!selectedTerm || selectedCourses.length === 0) return;
    (async () => {
      try {
        const results = await Promise.all(
          selectedCourses.map(course =>
            fetch(
              `${API_BASE_URL}/credit-course-amount?TermAndCourseCode=${encodeURIComponent(
                selectedTerm + ':' + course.code
              )}`
            ).then(r => r.json() as Promise<CourseAmount>)
          )
        );
        let autoMin = 0;
        results.forEach(detail => {
          const lec = detail.Lecture;
          const lab = detail.Laboratory;

          if (lec?.courses > 0 && lec.credits !== 'N/A') {
            autoMin += parseInt(lec.credits, 10) || 0;
          }
          if (lab?.courses > 0 && lab.credits !== 'N/A') {
            autoMin += parseInt(lab.credits, 10) || 0;
          }
        });

        // subtract 3 from total minimum, but not below 0
        const rawMin = autoMin - 3;
        const newMin = Math.max(0, rawMin);
        const newMax = newMin + 4;
        setMinValue(newMin);
        setMaxValue(newMax);
        onChange({ min: newMin, max: newMax });
      } catch (e) {
        console.error('Failed to fetch credit-course-amount', e);
      }
    })();
  }, [selectedCourses, selectedTerm]);

  // Sync when parent creditLimits change
  useEffect(() => {
    setMinValue(creditLimits.min);
    setMaxValue(creditLimits.max);
  }, [creditLimits.min, creditLimits.max]);

  // Handle dragging of max handle only if enabled
  useEffect(() => {
    if (isDisabled) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const pct = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
      let value = Math.round(((pct * (max - min) + min) / step)) * step;
      value = Math.max(value, minValue + 4);
      setMaxValue(value);
      onChange({ min: minValue, max: value });
    };
    const maxHandle = document.getElementById('max-handle');
    if (!maxHandle) return;
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    maxHandle.addEventListener('mousedown', onMouseDown);
    return () => {
      maxHandle.removeEventListener('mousedown', onMouseDown);
    };
  }, [minValue, isDisabled]);

  // Track click adjusts max only
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
    let value = Math.round(((pct * (max - min) + min) / step)) * step;
    value = Math.max(value, minValue + 4);
    setMaxValue(value);
    onChange({ min: minValue, max: value });
  };

  const minPct = getPercentage(minValue);
  const maxPct = getPercentage(maxValue);

  return (
    <div className={'bg-white rounded-lg mb-2 ' + (isDisabled ? 'opacity-50' : '')}>
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-sm font-medium text-gray-800">Semester Credits</h4>
        {!isDisabled && (
          <div className="text-sm text-primary-blue font-medium">
            {minValue}-{maxValue} credits
          </div>
        )}
      </div>
      <div className="relative h-10" ref={sliderRef} onClick={handleTrackClick}>
        {/* Track */}
        <div className="absolute h-2 top-4 left-0 right-0 bg-gray-200 rounded-full">
          {!isDisabled && (
            <div
              className="absolute h-full bg-primary-blue rounded-full"
              style={{ left: minPct + '%', width: (maxPct - minPct) + '%' }}
            />
          )}
        </div>

        {/* Handles (only when enabled) */}
        {!isDisabled && (
          <>
            <div
              className="absolute w-4 h-4 top-3 -ml-2 bg-white border-2 border-gray-400 rounded-full pointer-events-none"
              style={{ left: minPct + '%', zIndex: 10 }}
            />
            <div
              id="max-handle"
              className="absolute w-4 h-4 top-3 -ml-2 bg-white border-2 border-primary-blue rounded-full cursor-grab shadow-sm hover:scale-110 transition-transform"
              style={{ left: maxPct + '%', zIndex: 10 }}
            />
          </>
        )}

        {/* Tick labels */}
        <div className="absolute top-7 left-0 right-0 h-4 text-xs text-gray-500">
          {[0,4,8,12,16,20].map(v => {
            const p = getPercentage(v);
            return (
              <span key={v} className="absolute transform -translate-x-1/2" style={{ left: p + '%' }}>
                {v}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CreditLimitsSelector;
