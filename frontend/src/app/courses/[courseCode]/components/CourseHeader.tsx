"use client";

import React from 'react';
import Link from "next/link";

interface CourseHeaderProps {
  courseCode: string;
  title: string;
  credits: number;
  prerequisites: string | null;
  corequisites: string | null;
  notes: string | null;
  restrictions: string | null;
}

// Function to convert course codes in text to clickable links
const parseCourseCodes = (text: string | null) => {
  if (!text) return null;
  
  // Regular expression to match course codes like "CS 211", "MATH 113", etc.
  const courseCodeRegex = /([A-Z]{2,4})\s+(\d{3}[A-Z]?)/g;
  
  // Split the text by the regex to preserve non-matching parts
  const parts = text.split(courseCodeRegex);
  
  if (parts.length === 1) {
    // No course codes found, return the original text
    return <span>{text}</span>;
  }
  
  // Rebuild the text with links for course codes
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0) {
      // This is regular text between course codes
      result.push(<span key={`text-${i}`}>{parts[i]}</span>);
    } else if (i % 3 === 1) {
      // This is the subject code (e.g., "CS")
      const subjectCode = parts[i];
      const courseNumber = parts[i + 1]; // The next part is the course number
      const courseCode = `${subjectCode} ${courseNumber}`;
      
      result.push(
        <Link 
          href={`/courses/${encodeURIComponent(courseCode)}`} 
          key={`link-${i}`}
          className="text-primary-blue hover:text-blue-800 hover:underline"
        >
          {courseCode}
        </Link>
      );
      // Skip the next part as we've already used it
      i++;
    }
  }
  
  return <>{result}</>;
};

export default function CourseHeader({ 
  courseCode, 
  title, 
  credits, 
  prerequisites, 
  corequisites, 
  notes,
  restrictions
}: CourseHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row items-start mb-4">
        {/* Course Code - Large and Prominent */}
        <h1 className="text-6xl font-bold whitespace-nowrap mr-6">{courseCode}</h1>
        
        {/* Course Title and Credits */}
        <div className="mt-2 lg:mt-0">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-lg text-gray-600">{credits} credits</p>
        </div>
      </div>
      
      {/* Prerequisites, Corequisites, Notes, and Unlocks */}
      <div className="text-gray-700 text-lg mt-3">
        <p>
          {prerequisites && (
            <><span className="font-medium">Prerequisites:</span> {parseCourseCodes(prerequisites)}</>
          )}
          {prerequisites && corequisites && (
            <> • </>
          )}
          {corequisites && (
            <><span className="font-medium">Corequisites:</span> {parseCourseCodes(corequisites)}</>
          )}
          {(prerequisites || corequisites) && notes && (
            <> • </>
          )}
          {notes && (
            <><span className="font-medium">Notes:</span> {notes}</>
          )}
          {(prerequisites || corequisites || notes) && restrictions && (
            <> • </>
          )}
          {restrictions && (
            <><span className="font-medium">Unlocks:</span> {restrictions}</>
          )}
          {!prerequisites && !corequisites && !notes && !restrictions && (
            <span className="text-gray-500 italic">No prerequisites, corequisites, notes, or unlocks information available.</span>
          )}
        </p>
      </div>
    </div>
  );
} 