"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// Add these utility functions at the top near other utility functions
const calculateAverageRating = (professors: Professor[]): number => {
  if (!professors || professors.length === 0) return 0;
  
  const sum = professors.reduce((acc, prof) => acc + prof.avgRating, 0);
  return Number((sum / professors.length).toFixed(1));
};

const calculateAverageDifficulty = (professors: Professor[]): number => {
  if (!professors || professors.length === 0) return 0;
  
  const sum = professors.reduce((acc, prof) => acc + prof.avgDifficulty, 0);
  return Number((sum / professors.length).toFixed(1));
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState<boolean>(false);

  // Color coding functions
  const getGradeColor = useMemo(() => {
    if (!mostCommonGrade || mostCommonGrade === 'N/A') return 'gray';
    
    // Convert letter grades to a color
    if (['A+', 'A', 'A-', 'B+'].includes(mostCommonGrade)) {
      return 'green';
    } else if (['B', 'B-', 'C+', 'C'].includes(mostCommonGrade)) {
      return 'yellow';
    } else {
      return 'red';
    }
  }, [mostCommonGrade]);

  const getDifficultyColor = (value: number) => {
    // Lower difficulty is better (green)
    if (value <= 2.0) return 'green';
    if (value <= 3.5) return 'yellow';
    return 'red';
  };

  const getQualityColor = (value: number) => {
    // Higher quality is better (green)
    if (value >= 4.0) return 'green';
    if (value >= 3.0) return 'yellow';
    return 'red';
  };

  // Get the overall background color based on the average of the three colors
  const getOverallBackgroundColor = useMemo(() => {
    const avgDifficulty = calculateAverageDifficulty(sortedProfessors);
    const avgRating = calculateAverageRating(sortedProfessors);
    
    const gradeColorValue = getGradeColor;
    const difficultyColorValue = getDifficultyColor(avgDifficulty);
    const qualityColorValue = getQualityColor(avgRating);
    
    const colors = [
      gradeColorValue,
      difficultyColorValue,
      qualityColorValue
    ];
    
    const greenCount = colors.filter(c => c === 'green').length;
    const yellowCount = colors.filter(c => c === 'yellow').length;
    const redCount = colors.filter(c => c === 'red').length;
    
    // If all colors are the same, return that color
    if (greenCount === 3) return 'bg-green-100';
    if (yellowCount === 3) return 'bg-yellow-100';
    if (redCount === 3) return 'bg-red-100';
    
    // If two colors are the same, return that color
    if (greenCount === 2) return 'bg-green-50';
    if (yellowCount === 2) return 'bg-yellow-50';
    if (redCount === 2) return 'bg-red-50';
    
    // If all colors are different, return yellow
    return 'bg-yellow-50';
  }, [getGradeColor, sortedProfessors, calculateAverageDifficulty, calculateAverageRating]);

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

  // Check if description overflows 4 lines
  useEffect(() => {
    if (descriptionRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(descriptionRef.current).lineHeight);
      const maxHeight = lineHeight * 4; // 4 lines max
      const actualHeight = descriptionRef.current.scrollHeight;
      
      setIsDescriptionOverflowing(actualHeight > maxHeight);
    }
  }, [course?.description]);

  // Function to toggle professor reviews expansion
  const toggleProfessorReviews = (professorName: string) => {
    if (expandedProfessor === professorName) {
      setExpandedProfessor(null); // Collapse if already expanded
    } else {
      setExpandedProfessor(professorName); // Expand this professor
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {loading ? (
        <div className="max-w-7xl mx-auto space-y-8">
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
        <div className="max-w-6xl mx-auto">
          {/* New Course Header Section */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row items-start mb-4">
              {/* Course Code - Large and Prominent */}
              <h1 className="text-6xl font-bold whitespace-nowrap mr-6">{course.course_code}</h1>
              
              {/* Course Title and Credits */}
              <div className="mt-2 lg:mt-0">
                <h2 className="text-2xl font-semibold">{course.title}</h2>
                <p className="text-lg text-gray-600">{course.credits} credits</p>
              </div>
            </div>
            
            {/* Prerequisites, Corequisites, Notes, and Unlocks */}
            <div className="text-gray-700 text-lg mt-3">
              <p>
                {course.prerequisites && (
                  <><span className="font-medium">Prerequisites:</span> {parseCourseCodes(course.prerequisites)}</>
                )}
                {course.prerequisites && course.corequisites && (
                  <> • </>
                )}
                {course.corequisites && (
                  <><span className="font-medium">Corequisites:</span> {parseCourseCodes(course.corequisites)}</>
                )}
                {(course.prerequisites || course.corequisites) && course.notes && (
                  <> • </>
                )}
                {course.notes && (
                  <><span className="font-medium">Notes:</span> {course.notes}</>
                )}
                {(course.prerequisites || course.corequisites || course.notes) && course.restrictions && (
                  <> • </>
                )}
                {course.restrictions && (
                  <><span className="font-medium">Unlocks:</span> {course.restrictions}</>
                )}
                {!course.prerequisites && !course.corequisites && !course.notes && !course.restrictions && (
                  <span className="text-gray-500 italic">No prerequisites, corequisites, notes, or unlocks information available.</span>
                )}
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
                    <div>
                      <p 
                        ref={descriptionRef}
                        className={`text-gray-700 ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}
                      >
                        {course.description}
                      </p>
                      {isDescriptionOverflowing && (
                        <button 
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="text-blue-500 hover:text-blue-700 hover:underline mt-2 text-sm font-medium"
                        >
                          {isDescriptionExpanded ? 'Show less' : 'Show more...'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Professor preview section - Updated to table format */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Professors</h3>
                    {sortedProfessors.length > 0 ? (
                      <div>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Would Take Again</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {sortedProfessors.slice(0, 4).map((professor) => (
                                <tr key={`${professor.firstName}-${professor.lastName}`} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Link 
                                      href={`/professors/${professor.url?.split('/').pop() || ''}`}
                                      className="text-sm font-medium text-primary-blue hover:text-blue-700"
                                    >
                                      {professor.firstName} {professor.lastName}
                                    </Link>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{professor.avgRating.toFixed(1)}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{professor.avgDifficulty.toFixed(1)}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {professor.wouldTakeAgainPercent === -1 ? 'N/A' : `${Math.round(professor.wouldTakeAgainPercent)}%`}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {professor.reviews.length} {professor.reviews.length === 1 ? 'review' : 'reviews'}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {sortedProfessors.length > 4 && (
                          <div className="mt-3 text-right">
                            <button 
                              onClick={() => setActiveTab('professors')}
                              className="text-primary-blue hover:underline text-sm font-medium"
                            >
                              View all {sortedProfessors.length} professors
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No professor data available.</p>
                    )}
                  </div>
                </div>

                {/* Right column - Stats & Grade Distribution */}
                <div className="md:w-1/3">
                  {/* Stats grid with background color and border */}
                  <div className={`${getOverallBackgroundColor} rounded-lg p-6 mb-6 border border-gray-200`}>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-gray-500 text-sm">Avg Grade</h4>
                        <p className="text-5xl font-bold">{mostCommonGrade !== 'N/A' ? mostCommonGrade : '—'}</p>
                      </div>
                      <div>
                        <h4 className="text-gray-500 text-sm">Difficulty</h4>
                        <p className="text-5xl font-semibold">{calculateAverageDifficulty(sortedProfessors)}<span className="text-2xl font-normal">/5</span></p>
                      </div>
                      <div>
                        <h4 className="text-gray-500 text-sm">Quality</h4>
                        <p className="text-5xl font-semibold">{calculateAverageRating(sortedProfessors)}<span className="text-2xl font-normal">/5</span></p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Grade distribution in separate container */}
                  <div className="rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold mb-5">Grade Distribution</h4>
                    {course.professors && course.professors.length > 0 && totalReviews > 0 ? (
                      <div className="space-y-4">
                        {/* Grade distribution bars */}
                        <div className="flex items-center mb-3">
                          <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
                            <div 
                              className="bg-green-500 h-7 rounded-full rounded-r-none" 
                              style={{ width: `${Math.max(gradeDistribution.A || 0, 1)}%` }}
                            ></div>
                          </div>
                          <div className="ml-4 flex items-center">
                            <span className="text-base font-medium w-10 text-right">{gradeDistribution.A || 0}%</span>
                            <span className="text-lg font-bold ml-4">A</span>
                          </div>
                        </div>
                        <div className="flex items-center mb-3">
                          <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
                            <div 
                              className="bg-blue-500 h-7 rounded-full rounded-r-none" 
                              style={{ width: `${Math.max(gradeDistribution.B || 0, 1)}%` }}
                            ></div>
                          </div>
                          <div className="ml-4 flex items-center">
                            <span className="text-base font-medium w-10 text-right">{gradeDistribution.B || 0}%</span>
                            <span className="text-lg font-bold ml-4">B</span>
                          </div>
                        </div>
                        <div className="flex items-center mb-3">
                          <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
                            <div 
                              className="bg-yellow-500 h-7 rounded-full rounded-r-none" 
                              style={{ width: `${Math.max(gradeDistribution.C || 0, 1)}%` }}
                            ></div>
                          </div>
                          <div className="ml-4 flex items-center">
                            <span className="text-base font-medium w-10 text-right">{gradeDistribution.C || 0}%</span>
                            <span className="text-lg font-bold ml-4">C</span>
                          </div>
                        </div>
                        <div className="flex items-center mb-3">
                          <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
                            <div 
                              className="bg-orange-500 h-7 rounded-full rounded-r-none" 
                              style={{ width: `${Math.max(gradeDistribution.D || 0, 1)}%` }}
                            ></div>
                          </div>
                          <div className="ml-4 flex items-center">
                            <span className="text-base font-medium w-10 text-right">{gradeDistribution.D || 0}%</span>
                            <span className="text-lg font-bold ml-4">D</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-7 overflow-hidden">
                            <div 
                              className="bg-red-500 h-7 rounded-full rounded-r-none" 
                              style={{ width: `${Math.max(gradeDistribution.F || 0, 1)}%` }}
                            ></div>
                          </div>
                          <div className="ml-4 flex items-center">
                            <span className="text-base font-medium w-10 text-right">{gradeDistribution.F || 0}%</span>
                            <span className="text-lg font-bold ml-4">F</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <button 
                            onClick={() => setActiveTab('grade')}
                            className="text-blue-500 hover:underline text-sm font-medium"
                          >
                            View full grade distribution
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No grade data available.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Professors Tab */}
            {activeTab === 'professors' && (
              <div>
                {sortedProfessors.length > 0 ? (
                  <div>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Would Take Again</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedProfessors.map((professor) => (
                            <tr 
                              key={`${professor.firstName}-${professor.lastName}`} 
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => toggleProfessorReviews(`${professor.firstName}-${professor.lastName}`)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Link 
                                  href={`/professors/${professor.url?.split('/').pop() || ''}`}
                                  className="text-sm font-medium text-primary-blue hover:text-blue-700"
                                  onClick={(e) => e.stopPropagation()} // Prevent triggering row click when clicking link
                                >
                                  {professor.firstName} {professor.lastName}
                                </Link>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{professor.department}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{professor.avgRating.toFixed(1)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{professor.avgDifficulty.toFixed(1)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {professor.wouldTakeAgainPercent === -1 ? 'N/A' : `${Math.round(professor.wouldTakeAgainPercent)}%`}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {professor.reviews.length} {professor.reviews.length === 1 ? 'review' : 'reviews'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Professor Details Section - Show when expanded */}
                    {expandedProfessor && (
                      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        {sortedProfessors.map((professor) => {
                          const professorId = `${professor.firstName}-${professor.lastName}`;
                          if (professorId === expandedProfessor) {
                            return (
                              <div key={`details-${professorId}`}>
                                <h3 className="text-xl font-semibold mb-4">{professor.firstName} {professor.lastName}</h3>
                                
                                {/* Rating Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <p className="text-sm text-gray-500">Difficulty</p>
                                    <p className="font-semibold">{professor.avgDifficulty.toFixed(1)}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <p className="text-sm text-gray-500">Would Take Again</p>
                                    <p className="font-semibold">{professor.wouldTakeAgainPercent === -1 ? 'N/A' : `${Math.round(professor.wouldTakeAgainPercent)}%`}</p>
                                  </div>
                                  {professor.clarityRating && (
                                    <div className="bg-white p-3 rounded shadow-sm">
                                      <p className="text-sm text-gray-500">Clarity</p>
                                      <p className="font-semibold">{professor.clarityRating.toFixed(1)}</p>
                                    </div>
                                  )}
                                  {professor.helpfulRating && (
                                    <div className="bg-white p-3 rounded shadow-sm">
                                      <p className="text-sm text-gray-500">Helpfulness</p>
                                      <p className="font-semibold">{professor.helpfulRating.toFixed(1)}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Reviews */}
                                <h4 className="font-semibold text-gray-800 mb-4">Student Reviews</h4>
                                <div className="space-y-4">
                                  {professor.reviews.length > 0 ? (
                                    professor.reviews.map((review, index) => (
                                      <div key={index} className="bg-white p-4 rounded shadow-sm">
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
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
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