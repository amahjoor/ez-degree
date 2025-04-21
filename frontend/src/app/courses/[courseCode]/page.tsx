"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';
import { SkeletonCard, SkeletonText } from '@/app/components/ui';
import GradeDistribution from '@/app/components/GradeDistribution';

interface Review {
  comment?: string;
  date: string;
  difficultyRating: number;
  clarityRating?: number;
  helpfulRating?: number;
  grade: string;
  textbookUse?: string | number;
  wouldTakeAgain?: boolean;
  attendanceMandatory?: string;
  isForCredit?: boolean;
  isForOnlineClass?: boolean;
  ratingTags?: string[];
  thumbsDownTotal?: number;
  thumbsUpTotal?: number;
}

interface Professor {
  firstName: string;
  lastName: string;
  department: string;
  avgRating: number;
  avgDifficulty: number;
  wouldTakeAgainPercent: number;
  clarityRating?: number;
  helpfulRating?: number;
  averageGrade?: string;
  reviews: Review[];
  url?: string;
}

interface Course {
  course_code: string;
  title: string;
  credits: number;
  description: string;
  subject: string;
  prerequisites: string | null;
  corequisites: string | null;
  restrictions: string | null;
  notes: string | null;
  professors: Professor[];
}

// Dynamically import the GradeDistribution component with client-side rendering
const GradeDistributionComponent = dynamic(
  () => import('../../components/GradeDistribution'),
  { ssr: false }
);

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

// Function to calculate the most common grade
const calculateMostCommonGrade = (professors: Professor[]): string => {
  // Collect all grades from all reviews
  const gradeOccurrences: Record<string, number> = {};
  let totalReviews = 0;
  
  professors.forEach(professor => {
    professor.reviews.forEach(review => {
      if (review.grade) {
        if (!gradeOccurrences[review.grade]) {
          gradeOccurrences[review.grade] = 0;
        }
        gradeOccurrences[review.grade]++;
        totalReviews++;
      }
    });
  });
  
  if (totalReviews === 0) return "N/A";
  
  // Find the most common grade
  let maxOccurrences = 0;
  let mostCommonGrade = "";
  
  for (const grade in gradeOccurrences) {
    if (gradeOccurrences[grade] > maxOccurrences) {
      maxOccurrences = gradeOccurrences[grade];
      mostCommonGrade = grade;
    }
  }
  
  return mostCommonGrade || "N/A";
};

// Function to count total reviews
const countTotalReviews = (professors: Professor[]): number => {
  let count = 0;
  professors.forEach(professor => {
    count += professor.reviews.length;
  });
  return count;
};

// Function to sort professors by rating (highest to lowest)
const sortProfessorsByRating = (professors: Professor[]): Professor[] => {
  return [...professors].sort((a, b) => b.avgRating - a.avgRating);
};

// Add a new utility function after the other utility functions
const calculateGradeDistribution = (professors: Professor[]): Record<string, number> => {
  const gradeOccurrences: Record<string, number> = {};
  let totalGrades = 0;
  
  // Common grade groups
  const gradeGroups = {
    A: ['A+', 'A', 'A-'],
    B: ['B+', 'B', 'B-'],
    C: ['C+', 'C', 'C-'],
    D: ['D+', 'D', 'D-'],
    F: ['F']
  };
  
  // Initialize counters
  Object.keys(gradeGroups).forEach(group => {
    gradeOccurrences[group] = 0;
  });
  
  // Count grades by group
  professors.forEach(professor => {
    professor.reviews.forEach(review => {
      if (review.grade) {
        // Find which group this grade belongs to
        for (const [group, grades] of Object.entries(gradeGroups)) {
          if (grades.includes(review.grade)) {
            gradeOccurrences[group] = (gradeOccurrences[group] || 0) + 1;
            totalGrades++;
            break;
          }
        }
      }
    });
  });
  
  // Convert counts to percentages
  if (totalGrades > 0) {
    Object.keys(gradeOccurrences).forEach(grade => {
      gradeOccurrences[grade] = Math.round((gradeOccurrences[grade] / totalGrades) * 100);
    });
  }
  
  return gradeOccurrences;
};

export default function CourseDetail() {
  const params = useParams();
  const courseCode = params.courseCode as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'professors' | 'grade'>("overview");
  const [mostCommonGrade, setMostCommonGrade] = useState<string>("N/A");
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [expandedProfessor, setExpandedProfessor] = useState<string | null>(null);
  const [sortedProfessors, setSortedProfessors] = useState<Professor[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<Record<string, number>>({
    A: 0, B: 0, C: 0, D: 0, F: 0
  });

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://127.0.0.1:8000/courses/${courseCode}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Course not found");
          }
          throw new Error("Failed to fetch course");
        }
        const data = await response.json();
        setCourse(data);
        
        // Calculate most common grade and total reviews
        if (data.professors && data.professors.length > 0) {
          setMostCommonGrade(calculateMostCommonGrade(data.professors));
          setTotalReviews(countTotalReviews(data.professors));
          // Sort professors by rating
          setSortedProfessors(sortProfessorsByRating(data.professors));
          // Calculate grade distribution
          setGradeDistribution(calculateGradeDistribution(data.professors));
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setLoading(false);
        console.error(err);
      }
    };

    if (courseCode) {
      fetchCourse();
    }
  }, [courseCode]);

  // Function to toggle professor reviews expansion
  const toggleProfessorReviews = (professorName: string) => {
    if (expandedProfessor === professorName) {
      setExpandedProfessor(null); // Collapse if already expanded
    } else {
      setExpandedProfessor(professorName); // Expand this professor
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {loading ? (
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="md:w-2/3">
              <SkeletonText width="50%" height="3rem" className="mb-2" />
              <SkeletonText width="80%" height="2rem" className="mb-2" />
              <SkeletonText width="20%" height="1.5rem" />
            </div>
            <div className="md:w-1/3 flex justify-end">
              <SkeletonCard hasHeader={false} contentLines={0} className="w-28 h-28" />
            </div>
          </div>
          
          <div>
            <div className="border-b border-gray-200 mb-6">
              <div className="flex space-x-6">
                <SkeletonText width="6rem" height="2.5rem" className="mb-2" />
                <SkeletonText width="6rem" height="2.5rem" className="mb-2" />
                <SkeletonText width="6rem" height="2.5rem" className="mb-2" />
              </div>
            </div>
            
            <SkeletonCard hasHeader={true} contentLines={4} className="mb-6" />
            <SkeletonCard hasHeader={true} contentLines={3} className="mb-6" />
            <SkeletonCard hasHeader={true} contentLines={2} />
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : course ? (
        <div className="max-w-5xl mx-auto">
          {/* Course Header with Grade */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-5xl font-bold mb-2">{course.course_code}</h1>
              <h2 className="text-3xl mb-2">{course.title}</h2>
              <p className="text-lg text-gray-600">{course.credits} credits</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-primary-blue text-white text-7xl font-bold px-6 py-3 rounded-lg">
                {mostCommonGrade}
              </div>
              <p className="text-center mt-1 text-gray-600">
                {totalReviews > 0 ? 
                  <>based on<br />{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</> :
                  'No reviews yet'
                }
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px">
              <button
                className={`py-4 px-6 text-center border-b-2 font-medium text-lg ${
                  activeTab === 'overview'
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`py-4 px-6 text-center border-b-2 font-medium text-lg ${
                  activeTab === 'professors'
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('professors')}
              >
                Professors
              </button>
              <button
                className={`py-4 px-6 text-center border-b-2 font-medium text-lg ${
                  activeTab === 'grade'
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('grade')}
              >
                Grade Distribution
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="rounded-lg">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left column - Overview information */}
                <div className="md:w-2/3">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">{course.description}</p>
                  </div>

                  {course.prerequisites && (
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">Prerequisites</h3>
                      <p className="text-gray-700">{parseCourseCodes(course.prerequisites)}</p>
                    </div>
                  )}

                  {course.corequisites && (
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">Corequisites</h3>
                      <p className="text-gray-700">{parseCourseCodes(course.corequisites)}</p>
                    </div>
                  )}

                  {course.restrictions && (
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">Registration Restrictions</h3>
                      <p className="text-gray-700">{course.restrictions}</p>
                    </div>
                  )}

                  {course.notes && (
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">Notes</h3>
                      <p className="text-gray-700">{course.notes}</p>
                    </div>
                  )}

                  {/* Professor preview section */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Professors</h3>
                    {sortedProfessors.length > 0 ? (
                      <div className="space-y-4">
                        {sortedProfessors.slice(0, 3).map((professor) => (
                          <div key={`${professor.firstName}-${professor.lastName}`} className="flex items-center border-b pb-4">
                            <div className="mr-4">
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold">
                                {professor.firstName[0]}{professor.lastName[0]}
                              </div>
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-medium">
                                <Link 
                                  href={`/professors/${professor.url?.split('/').pop() || ''}`}
                                  className="text-primary-blue hover:text-blue-800"
                                >
                                  {professor.firstName} {professor.lastName}
                                </Link>
                              </h4>
                            </div>
                            <div className="flex items-center">
                              <div className="flex items-center text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < Math.round(professor.avgRating) ? "text-yellow-500" : "text-gray-300"}>★</span>
                                ))}
                              </div>
                              <span className="ml-2 font-semibold">{professor.avgRating.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                        {sortedProfessors.length > 3 && (
                          <button 
                            onClick={() => setActiveTab('professors')}
                            className="text-primary-blue hover:underline text-sm font-medium"
                          >
                            View all {sortedProfessors.length} professors
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No professor data available.</p>
                    )}
                  </div>
                </div>

                {/* Right column - Stats & Grade Distribution */}
                <div className="md:w-1/3">
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex justify-between mb-4">
                      <div>
                        <h4 className="text-gray-500 text-sm">Credits</h4>
                        <p className="text-3xl font-semibold">{course.credits}</p>
                      </div>
                      <div>
                        <h4 className="text-gray-500 text-sm">Avg, GPA</h4>
                        <p className="text-3xl font-semibold">{mostCommonGrade !== 'N/A' ? mostCommonGrade : '—'}</p>
                      </div>
                    </div>
                    
                    {/* Grade distribution mini preview */}
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold mb-4">Grade Distribution</h4>
                      {course.professors && course.professors.length > 0 && totalReviews > 0 ? (
                        <div className="space-y-2">
                          {/* Dynamic grade distribution bars */}
                          <div className="flex items-center mb-3">
                            <div className="w-full bg-gray-200 rounded-full h-3.5">
                              <div className="bg-green-500 h-3.5 rounded-full" style={{ width: `${gradeDistribution.A || 0}%` }}></div>
                            </div>
                            <div className="ml-3 w-24 flex justify-between">
                              <span className="text-sm font-medium">{gradeDistribution.A || 0}%</span>
                              <span className="text-sm text-gray-700">A</span>
                            </div>
                          </div>
                          <div className="flex items-center mb-3">
                            <div className="w-full bg-gray-200 rounded-full h-3.5">
                              <div className="bg-blue-500 h-3.5 rounded-full" style={{ width: `${gradeDistribution.B || 0}%` }}></div>
                            </div>
                            <div className="ml-3 w-24 flex justify-between">
                              <span className="text-sm font-medium">{gradeDistribution.B || 0}%</span>
                              <span className="text-sm text-gray-700">B</span>
                            </div>
                          </div>
                          <div className="flex items-center mb-3">
                            <div className="w-full bg-gray-200 rounded-full h-3.5">
                              <div className="bg-yellow-500 h-3.5 rounded-full" style={{ width: `${gradeDistribution.C || 0}%` }}></div>
                            </div>
                            <div className="ml-3 w-24 flex justify-between">
                              <span className="text-sm font-medium">{gradeDistribution.C || 0}%</span>
                              <span className="text-sm text-gray-700">C</span>
                            </div>
                          </div>
                          <div className="flex items-center mb-3">
                            <div className="w-full bg-gray-200 rounded-full h-3.5">
                              <div className="bg-orange-500 h-3.5 rounded-full" style={{ width: `${gradeDistribution.D || 0}%` }}></div>
                            </div>
                            <div className="ml-3 w-24 flex justify-between">
                              <span className="text-sm font-medium">{gradeDistribution.D || 0}%</span>
                              <span className="text-sm text-gray-700">D</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-3.5">
                              <div className="bg-red-500 h-3.5 rounded-full" style={{ width: `${gradeDistribution.F || 0}%` }}></div>
                            </div>
                            <div className="ml-3 w-24 flex justify-between">
                              <span className="text-sm font-medium">{gradeDistribution.F || 0}%</span>
                              <span className="text-sm text-gray-700">F</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveTab('grade')}
                            className="text-primary-blue hover:underline text-sm font-medium mt-2"
                          >
                            View full grade distribution
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No grade data available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Professors Tab */}
            {activeTab === 'professors' && (
              <div>
                {sortedProfessors.length > 0 ? (
                  <div className="space-y-4">
                    {sortedProfessors.map((professor) => {
                      // Create a unique identifier for this professor
                      const professorId = `${professor.firstName}-${professor.lastName}`;
                      const isExpanded = expandedProfessor === professorId;
                      
                      return (
                        <div key={professorId} className="border rounded-lg overflow-hidden">
                          {/* Professor Header - Always visible and clickable */}
                          <div 
                            className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleProfessorReviews(professorId)}
                          >
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                <Link 
                                  href={`/professors/${professor.url?.split('/').pop() || ''}`}
                                  className="text-primary-blue hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking the link
                                >
                                  {professor.firstName} {professor.lastName}
                                </Link>
                              </h4>
                              <p className="text-sm text-gray-500">{professor.department}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {professor.reviews.length} {professor.reviews.length === 1 ? 'review' : 'reviews'}
                              </p>
                            </div>
                            
                            <div className="flex items-center">
                              <div className="mr-6 text-center">
                                <div className="flex items-center justify-center">
                                  <span className="text-yellow-500 mr-1">★</span>
                                  <span className="text-lg font-semibold">{professor.avgRating.toFixed(1)}</span>
                                </div>
                                <p className="text-xs text-gray-500">Rating</p>
                              </div>
                              
                              <svg 
                                className={`h-6 w-6 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Professor Details - Only visible when expanded */}
                          {isExpanded && (
                            <div className="p-4 border-t">
                              {/* Rating Stats */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-500">Difficulty</p>
                                  <p className="font-semibold">{professor.avgDifficulty.toFixed(1)}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="text-sm text-gray-500">Would Take Again</p>
                                  <p className="font-semibold">{professor.wouldTakeAgainPercent === -1 ? 'N/A' : `${professor.wouldTakeAgainPercent.toFixed(1)}%`}</p>
                                </div>
                                {professor.clarityRating && (
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-500">Clarity</p>
                                    <p className="font-semibold">{professor.clarityRating.toFixed(1)}</p>
                                  </div>
                                )}
                                {professor.helpfulRating && (
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-500">Helpfulness</p>
                                    <p className="font-semibold">{professor.helpfulRating.toFixed(1)}</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Reviews */}
                              <h5 className="font-semibold text-gray-800 mb-4">Student Reviews</h5>
                              <div className="space-y-4">
                                {professor.reviews.length > 0 ? (
                                  professor.reviews.map((review, index) => (
                                    <div key={index} className="border-t pt-4 first:border-t-0 first:pt-0">
                                      {review.comment && (
                                        <p className="text-gray-600 mb-2">{review.comment}</p>
                                      )}
                                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <span>Difficulty: {review.difficultyRating.toFixed(1)}</span>
                                        <span>Would Take Again: {review.wouldTakeAgain ? 'Yes' : 'No'}</span>
                                        {review.grade && <span>Grade: {review.grade}</span>}
                                        {review.date && <span>Date: {new Date(review.date).toLocaleDateString()}</span>}
                                        {review.clarityRating && <span>Clarity: {review.clarityRating.toFixed(1)}</span>}
                                        {review.helpfulRating && <span>Helpfulness: {review.helpfulRating.toFixed(1)}</span>}
                                        {review.textbookUse && <span>Textbook: {review.textbookUse}</span>}
                                        {review.attendanceMandatory && <span>Attendance: {review.attendanceMandatory}</span>}
                                        {review.isForOnlineClass && <span>Online Class</span>}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-500 italic">No reviews available.</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No professor data available for this course.</p>
                  </div>
                )}
              </div>
            )}

            {/* Grade Distribution Tab */}
            {activeTab === 'grade' && (
              <div>
                {course && course.professors && course.professors.length > 0 ? (
                  <GradeDistribution professors={course.professors} />
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No grade data available for this course.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p>Course not found</p>
        </div>
      )}
    </div>
  );
} 