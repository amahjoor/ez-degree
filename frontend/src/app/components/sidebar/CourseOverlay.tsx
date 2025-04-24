"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CourseOverlayProps, CourseDetails } from './types';

const CourseOverlay: React.FC<CourseOverlayProps> = ({ courseCode, onClose, position }) => {
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchCourseDetails() {
      try {
        setLoading(true);
        const response = await fetch(`http://127.0.0.1:8000/courses/${courseCode}`);
        if (!response.ok) {
          throw new Error("Failed to fetch course data");
        }
        const data = await response.json();
        setCourseData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError("Failed to load course details");
        setLoading(false);
      }
    }
    
    fetchCourseDetails();
  }, [courseCode]);
  
  // Calculate total reviews and most common grade if available
  useEffect(() => {
    if (courseData?.professors) {
      // Calculate most common grade
      const grades: Record<string, number> = {};
      let totalReviews = 0;
      
      courseData.professors.forEach(professor => {
        if (professor.reviews) {
          professor.reviews.forEach((review) => {
            if (review.grade) {
              grades[review.grade] = (grades[review.grade] || 0) + 1;
            }
            totalReviews++;
          });
        }
      });
      
      let mostCommonGrade = "N/A";
      let maxCount = 0;
      
      Object.entries(grades).forEach(([grade, count]) => {
        if (count > maxCount) {
          mostCommonGrade = grade;
          maxCount = count;
        }
      });
      
      setCourseData(prev => ({
        ...prev!,
        mostCommonGrade,
        totalReviews
      }));
    }
  }, [courseData?.professors]);
  
  // Calculate adjusted overlay position to ensure it stays within viewport
  const adjustPosition = () => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate initial position
    let x = position.x;
    let y = position.y;
    
    // Default offset values
    const offsetY = 10;
    const width = 400; // max width of overlay
    const height = 300; // estimated height of overlay
    
    // Adjust horizontal position if it would extend beyond right edge
    if (x + width/2 > viewportWidth) {
      x = viewportWidth - width/2 - 10; // 10px padding from right edge
    }
    
    // Adjust horizontal position if it would extend beyond left edge
    if (x - width/2 < 0) {
      x = width/2 + 10; // 10px padding from left edge
    }
    
    // Adjust vertical position based on available space
    // If not enough space above, show below the element
    if (y - height < 20) { // 20px minimum from top of viewport
      return {
        top: `${y + offsetY}px`,
        left: `${x}px`,
        transform: 'translate(-50%, 0)',
        marginTop: '0',
      };
    } else {
      // Default: show above the element
      return {
        top: `${y}px`,
        left: `${x}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: `-${offsetY}px`,
      };
    }
  };
  
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    maxWidth: '400px',
    width: '100%',
    ...adjustPosition()
  };
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.course-overlay') && !target.closest('.course-chip')) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  return (
    <div 
      className="course-overlay bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={overlayStyle}
    >
      <div className="relative">
        <button 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : courseData ? (
          <div>
            {/* Header with course code and grade */}
            <div className="flex justify-between items-center bg-primary-blue/5 p-4 border-b border-primary-blue/10">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{courseData.course_code}</h3>
                <p className="text-gray-600 text-sm">{courseData.credits} credits</p>
              </div>
              {courseData.mostCommonGrade && courseData.mostCommonGrade !== 'N/A' && (
                <div className="bg-primary-blue text-white text-2xl font-bold px-4 py-2 rounded-lg">
                  {courseData.mostCommonGrade}
                </div>
              )}
            </div>
            
            {/* Course details */}
            <div className="p-4">
              <h4 className="font-medium text-base mb-2">{courseData.title}</h4>
              
              {courseData.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {courseData.description}
                </p>
              )}
              
              {/* Professors preview */}
              {courseData.professors && courseData.professors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Top Professors:</p>
                  <div className="space-y-1">
                    {courseData.professors.slice(0, 2).map((prof, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm">{prof.firstName} {prof.lastName}</span>
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span className="text-sm font-medium">{prof.avgRating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Footer with link to full page */}
              <div className="mt-4 flex justify-between items-center pt-2 border-t border-gray-100">
                {courseData.totalReviews !== undefined && (
                  <span className="text-xs text-gray-500">
                    {courseData.totalReviews} {courseData.totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                )}
                <Link 
                  href={`/courses/${encodeURIComponent(courseData.course_code)}`}
                  className="text-primary-blue hover:text-blue-700 text-sm font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-gray-500">No course data available</div>
        )}
      </div>
    </div>
  );
};

export default CourseOverlay; 