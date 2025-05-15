"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';
import { SkeletonCard, SkeletonText } from '@/app/components/ui';
import { Course } from '@/types/course';
import { Professor } from '@/types/professor';

// Import our component modules
import CourseHeader from './components/CourseHeader';
import CourseDescription from './components/CourseDescription';
import CourseStats from './components/CourseStats';
import GradeDistributionPanel from './components/GradeDistributionPanel';
import ProfessorTable from './components/ProfessorTable';
import TabNavigation, { TabType } from './components/TabNavigation';

// Dynamically import the GradeDistribution component with client-side rendering
const GradeDistributionComponent = dynamic(
  () => import('../../components/GradeDistribution'),
  { ssr: false }
);

// Utility functions for calculating statistics
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

// Add a utility function for grade distribution
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
  const [activeTab, setActiveTab] = useState<TabType>("overview");
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

  // Handler for tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
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
        <div className="max-w-7xl mx-auto">
          {/* Course Header */}
          <CourseHeader 
            courseCode={course.course_code}
            title={course.title}
            credits={course.credits}
            prerequisites={course.prerequisites}
            corequisites={course.corequisites}
            notes={course.notes}
            restrictions={course.restrictions}
          />

          {/* Tab Navigation */}
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Tab Content */}
          <div className="rounded-lg">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left column - Overview information */}
                <div className="md:w-2/3">
                  {/* Course Description */}
                  <CourseDescription description={course.description} />

                  {/* Professor Table Preview */}
                  <ProfessorTable 
                    professors={sortedProfessors} 
                    onViewAllProfessors={() => setActiveTab('professors')}
                  />
                </div>

                {/* Right column - Stats & Grade Distribution */}
                <div className="md:w-1/3">
                  {/* Course Stats */}
                  <CourseStats 
                    mostCommonGrade={mostCommonGrade} 
                    professors={sortedProfessors} 
                  />
                  
                  {/* Grade Distribution Panel */}
                  <GradeDistributionPanel 
                    gradeDistribution={gradeDistribution}
                    onViewFullDistribution={() => setActiveTab('grade')}
                  />
                </div>
              </div>
            )}

            {/* Professors Tab */}
            {activeTab === 'professors' && (
              <ProfessorTable 
                professors={sortedProfessors} 
                showAll={true}
              />
            )}

            {/* Grade Distribution Tab */}
            {activeTab === 'grade' && (
              <div>
                {course && course.professors && course.professors.length > 0 ? (
                  <GradeDistributionComponent professors={course.professors} />
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