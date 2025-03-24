"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// API configuration
const API_BASE_URL = '/api';

// Updated Course interface to include difficulty data
interface ProfessorRating {
  name: string;
  difficulty: number;
  rating: number;
}

interface CourseDifficulty {
  professors: ProfessorRating[];
  average_difficulty: number;
  difficulty_level: string;
  num_professors_rated: number;
}

interface Course {
  Code?: string;
  course_code?: string;
  title?: string;
  Title?: string;
  credits?: number | string;
  Credits?: string;
  description?: string;
  Description?: string;
  subject?: string;
  prerequisites?: string | null;
  Prerequisites?: string | null;
  corequisites?: string | null;
  Corequisites?: string | null;
  restrictions?: string | null;
  notes?: string | null;
  Notes?: string | null;
  difficulty?: CourseDifficulty | null;
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
          className="text-blue-600 hover:text-blue-800 hover:underline"
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

// Helper function to get difficulty color based on level
const getDifficultyColor = (level: string) => {
  switch (level) {
    case 'Easy':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Difficult':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Helper function to render stars for ratings
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <div className="flex">
      {Array(fullStars).fill(0).map((_, i) => (
        <svg key={`full-${i}`} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {halfStar && (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfStarGradient">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#halfStarGradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {Array(emptyStars).fill(0).map((_, i) => (
        <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

export default function CourseDetail() {
  const params = useParams();
  const courseCode = params.courseCode as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        console.log(`Fetching course data for: ${courseCode}`);
        
        const response = await fetch(`${API_BASE_URL}/courses/${courseCode}`, {
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Course not found");
          }
          
          // Try to get more detailed error information
          try {
            const errorData = await response.json();
            throw new Error(`Failed to fetch course: ${errorData.detail || response.statusText}`);
          } catch (parseError) {
            throw new Error(`Failed to fetch course: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        console.log(`Successfully fetched course data:`, data);
        setCourse(data);
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching course ${courseCode}:`, err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setLoading(false);
      }
    };

    if (courseCode) {
      fetchCourse();
    }
  }, [courseCode]);

  // Normalize course data to handle different API response formats
  const normalizedCourse = course ? {
    course_code: course.Code || course.course_code || '',
    title: course.Title || course.title || '',
    credits: course.Credits || course.credits || '',
    description: course.Description || course.description || '',
    prerequisites: course.Prerequisites || course.prerequisites || null,
    corequisites: course.Corequisites || course.corequisites || null,
    notes: course.Notes || course.notes || null,
    difficulty: course.difficulty
  } : null;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Courses
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2">Loading course details...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : normalizedCourse ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-sm mr-2">
                  {normalizedCourse.course_code.split(' ')[0]}
                </span>
                <h1 className="text-2xl font-bold">{normalizedCourse.course_code}</h1>
                <h2 className="text-xl mt-1">{normalizedCourse.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{normalizedCourse.credits} Credits</p>
              </div>
              
              {normalizedCourse.difficulty && (
                <div className="mt-4 sm:mt-0 sm:ml-4">
                  <div className={`px-4 py-2 border rounded-lg text-center ${getDifficultyColor(normalizedCourse.difficulty.difficulty_level)}`}>
                    <div className="text-lg font-bold">
                      {normalizedCourse.difficulty.difficulty_level}
                    </div>
                    <div className="text-sm">
                      Difficulty: {normalizedCourse.difficulty.average_difficulty.toFixed(1)}/5
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4">
            <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">{normalizedCourse.description}</p>
          </div>
          
          {normalizedCourse.prerequisites && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Prerequisites</h3>
              <p className="text-gray-600">{parseCourseCodes(normalizedCourse.prerequisites)}</p>
            </div>
          )}

          {normalizedCourse.corequisites && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Corequisites</h3>
              <p className="text-gray-600">{parseCourseCodes(normalizedCourse.corequisites)}</p>
            </div>
          )}

          {normalizedCourse.notes && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-600">{normalizedCourse.notes}</p>
            </div>
          )}
          
          {normalizedCourse.difficulty && normalizedCourse.difficulty.professors.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Professor Ratings</h3>
              <div className="space-y-4 mt-3">
                {normalizedCourse.difficulty.professors.map((prof, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                    <div>
                      <h4 className="font-medium text-gray-800">{prof.name}</h4>
                    </div>
                    <div className="mt-2 sm:mt-0 sm:ml-4 flex space-x-4 items-center">
                      <div>
                        <div className="text-sm text-gray-500">Difficulty</div>
                        <div className="font-medium text-gray-800">{prof.difficulty.toFixed(1)}/5</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Rating</div>
                        <StarRating rating={prof.rating} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Course not found. Please check the course code and try again.
        </div>
      )}
    </div>
  );
} 