'use client';

import { useEffect, useState } from 'react';
import { Professor } from '@/types/professor';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { SkeletonText } from '@/app/components/ui/SkeletonText';

const API_BASE_URL = '/api';

// Tab types for professor page
export type ProfessorTabType = 'overview' | 'grades' | 'classes' | 'reviews';

// Tab Navigation Component
interface TabNavigationProps {
  activeTab: ProfessorTabType;
  onTabChange: (tab: ProfessorTabType) => void;
}

function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex -mb-px">
        <button
          className={`py-4 px-6 text-center border-b-2 font-medium text-lg ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onTabChange('overview')}
        >
          Overview
        </button>
        <button
          className={`py-4 px-6 text-center border-b-2 font-medium text-lg ${
            activeTab === 'grades'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onTabChange('grades')}
        >
          Grades
        </button>
        <button
          className={`py-4 px-6 text-center border-b-2 font-medium text-lg ${
            activeTab === 'classes'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onTabChange('classes')}
        >
          Classes
        </button>
        <button
          className={`py-4 px-6 text-center border-b-2 font-medium text-lg ${
            activeTab === 'reviews'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onTabChange('reviews')}
        >
          Reviews
        </button>
      </nav>
    </div>
  );
}

// Professor Header Component
interface ProfessorHeaderProps {
  professor: Professor;
  onClose: () => void;
      }

function ProfessorHeader({ professor, onClose }: ProfessorHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {professor.firstName} {professor.lastName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{professor.department}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Professor Stats Component
interface ProfessorStatsProps {
  professor: Professor;
  selectedCourse: string | null;
  onCourseSelect: (courseCode: string | null) => void;
}

function ProfessorStats({ professor, selectedCourse, onCourseSelect }: ProfessorStatsProps) {
  // State for hover tooltips
  const [showDifficultyTooltip, setShowDifficultyTooltip] = useState(false);
  const [showTakeAgainTooltip, setShowTakeAgainTooltip] = useState(false);
  const [showTextbookTooltip, setShowTextbookTooltip] = useState(false);
  const [showAttendanceTooltip, setShowAttendanceTooltip] = useState(false);
  
  // Get filtered reviews based on selected course
  const getFilteredReviews = () => {
    if (!professor.reviews || typeof professor.reviews !== 'object') return [];
    
    let allReviews: any[] = [];
    
    Object.entries(professor.reviews).forEach(([courseCode, courseReviews]) => {
      // If a course is selected, only include reviews for that course
      if (selectedCourse && courseCode !== selectedCourse) return;
      
      const reviews = Array.isArray(courseReviews) ? courseReviews : [courseReviews];
      allReviews = allReviews.concat(reviews.map(review => ({ ...review, courseCode })));
    });
    
    return allReviews;
  };

  const filteredReviews = getFilteredReviews();

  // Helper functions for color coding
  const getQualityColor = (rating: number) => {
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getDifficultyColor = (rating: number) => {
    if (rating >= 4) return 'text-red-500';
    if (rating >= 3) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  const getWouldTakeAgainColor = (percent: number) => {
    if (percent >= 70) return 'text-green-500';
    if (percent >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getGradeColor = (grade: string) => {
    const firstChar = grade.charAt(0);
    if (['A'].includes(firstChar)) return 'text-green-500';
    if (['B'].includes(firstChar)) return 'text-yellow-500';
    if (['C', 'D', 'F'].includes(firstChar)) return 'text-red-500';
    return 'text-gray-900';
  };

  // Calculate quality rating based on filtered reviews
  const calculateQualityRating = () => {
    if (filteredReviews.length === 0) return null;
    
    let totalRating = 0;
    let count = 0;
    
    filteredReviews.forEach(review => {
      if (review.helpfulRating || review.clarityRating) {
        totalRating += review.helpfulRating || review.clarityRating;
        count++;
      }
    });
    
    return count > 0 ? totalRating / count : null;
  };

  // Calculate average difficulty based on filtered reviews
  const calculateAvgDifficulty = () => {
    if (filteredReviews.length === 0) return null;
    
    let totalDifficulty = 0;
    let count = 0;
    
    filteredReviews.forEach(review => {
      if (review.difficultyRating !== undefined && review.difficultyRating !== null) {
        totalDifficulty += review.difficultyRating;
        count++;
      }
    });
    
    return count > 0 ? totalDifficulty / count : null;
  };

  // Calculate would take again percentage based on filtered reviews
  const calculateWouldTakeAgain = () => {
    if (filteredReviews.length === 0) return null;
    
    let totalResponses = 0;
    let yesCount = 0;
    
    filteredReviews.forEach(review => {
      if (review.wouldTakeAgain !== undefined && review.wouldTakeAgain !== null) {
        totalResponses++;
        if (review.wouldTakeAgain) {
          yesCount++;
        }
      }
    });
    
    return totalResponses > 0 ? (yesCount / totalResponses) * 100 : null;
  };

  // Calculate most common grade based on filtered reviews
  const calculateAvgGrade = () => {
    if (filteredReviews.length === 0) return null;
    
    const grades: { [key: string]: number } = {};
    
    filteredReviews.forEach(review => {
      if (review.grade && 
          review.grade.trim() !== '' && 
          review.grade.toLowerCase() !== 'not sure yet' &&
          review.grade.toLowerCase() !== 'rather not say') {
        grades[review.grade] = (grades[review.grade] || 0) + 1;
      }
    });
    
    if (Object.keys(grades).length === 0) return null;
    
    return Object.entries(grades).reduce((a, b) => 
      grades[a[0]] > grades[b[0]] ? a : b
    )[0];
  };

  const getDifficultyLabel = (rating: number) => {
    if (rating >= 4) return 'HARD';
    if (rating >= 3) return 'MEDIUM';
    return 'EASY';
  };

  // Calculate textbook usage percentage
  const calculateTextbookUsage = () => {
    if (filteredReviews.length === 0) return null;
    
    let totalReviews = 0;
    let textbookRequired = 0;
    
    filteredReviews.forEach(review => {
      if (review.textbookUse) {
        totalReviews++;
        if (review.textbookUse.toLowerCase().includes('required') || 
            review.textbookUse.toLowerCase().includes('mandatory') ||
            review.textbookUse.toLowerCase().includes('yes')) {
          textbookRequired++;
        }
      }
    });
    
    return totalReviews > 0 ? Math.round((textbookRequired / totalReviews) * 100) : null;
  };

  // Calculate attendance requirement percentage
  const calculateAttendanceRequirement = () => {
    if (filteredReviews.length === 0) return null;
    
    let totalReviews = 0;
    let attendanceRequired = 0;
    
    filteredReviews.forEach(review => {
      if (review.attendanceMandatory !== undefined) {
        totalReviews++;
        if (review.attendanceMandatory === 'Mandatory' || 
            review.attendanceMandatory === true ||
            (typeof review.attendanceMandatory === 'string' && 
             review.attendanceMandatory.toLowerCase().includes('mandatory'))) {
          attendanceRequired++;
        }
      }
    });
    
    return totalReviews > 0 ? Math.round((attendanceRequired / totalReviews) * 100) : null;
  };

  // Calculate all filtered stats
  const professorQuality = calculateQualityRating();
  const avgDifficulty = calculateAvgDifficulty();
  const wouldTakeAgainPercent = calculateWouldTakeAgain();
  const averageGrade = calculateAvgGrade();
  const textbookUsage = calculateTextbookUsage();
  const attendanceRequirement = calculateAttendanceRequirement();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Professor Stats</h2>
      <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-2xl mx-auto">
          {/* Quality */}
          {professorQuality && (
            <div className="text-center">
              <div className="text-base text-black mb-2">Quality</div>
              <div className="flex items-baseline justify-center">
                <span className={`text-4xl font-bold ${getQualityColor(professorQuality)}`}>
                  {professorQuality.toFixed(1)}
                </span>
                <span className="text-xl text-gray-500 ml-1">/5</span>
              </div>
            </div>
          )}

          {/* Average Grade */}
          <div className="text-center">
            <div className="text-base text-black mb-2">Avg Grade</div>
            <div className={`text-4xl font-bold ${averageGrade ? getGradeColor(averageGrade) : 'text-gray-400'}`}>
              {averageGrade || 'N/A'}
            </div>
          </div>

          {/* Difficulty */}
          <div className="text-center">
            <div className="text-base text-black mb-2 flex items-center justify-center">
              <span>Difficulty</span>
              <div className="relative ml-1">
                <span 
                  className="cursor-help text-gray-600 hover:text-black text-sm"
                  onMouseEnter={() => setShowDifficultyTooltip(true)}
                  onMouseLeave={() => setShowDifficultyTooltip(false)}
                >
                  ⓘ
                </span>
                {showDifficultyTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                    <div className="text-center">
                      <div className="font-medium">
                        Difficulty Rating: {avgDifficulty ? avgDifficulty.toFixed(1) : 'N/A'}/5
                      </div>
                      <div className="text-gray-300 mt-1">
                        Based on {filteredReviews.filter(r => r.difficultyRating !== undefined && r.difficultyRating !== null).length} student responses
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-baseline justify-center">
              <span className={`text-4xl font-bold ${avgDifficulty ? getDifficultyColor(avgDifficulty) : 'text-gray-400'}`}>
                {avgDifficulty ? getDifficultyLabel(avgDifficulty) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Would Take Again */}
          <div className="text-center">
            <div className="text-base text-black mb-2 flex items-center justify-center">
              <span>Take Again</span>
              <div className="relative ml-1">
                <span 
                  className="cursor-help text-gray-600 hover:text-black text-sm"
                  onMouseEnter={() => setShowTakeAgainTooltip(true)}
                  onMouseLeave={() => setShowTakeAgainTooltip(false)}
                >
                  ⓘ
                </span>
                {showTakeAgainTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                    <div className="text-center">
                      <div className="font-medium">
                        Would Take Again: {wouldTakeAgainPercent ? Math.round(wouldTakeAgainPercent) : 'N/A'}%
                      </div>
                      <div className="text-gray-300 mt-1">
                        Based on {filteredReviews.filter(r => r.wouldTakeAgain !== undefined && r.wouldTakeAgain !== null).length} student responses
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-baseline justify-center">
              <span className={`text-4xl font-bold ${wouldTakeAgainPercent ? getWouldTakeAgainColor(wouldTakeAgainPercent) : 'text-gray-400'}`}>
                {wouldTakeAgainPercent ? (Math.round(wouldTakeAgainPercent) >= 50 ? 'YES' : 'NO') : 'N/A'}
              </span>
            </div>
          </div>

          {/* Textbook Usage */}
          <div className="text-center">
            <div className="text-base text-black mb-2 flex items-center justify-center">
              <span>Textbook</span>
              <div className="relative ml-1">
                <span 
                  className="cursor-help text-gray-600 hover:text-black text-sm"
                  onMouseEnter={() => setShowTextbookTooltip(true)}
                  onMouseLeave={() => setShowTextbookTooltip(false)}
                >
                  ⓘ
                </span>
                {showTextbookTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                    <div className="text-center">
                      <div className="font-medium">
                        Textbook Required: {textbookUsage === null ? 'No data' : `${textbookUsage}%`}
                      </div>
                      <div className="text-gray-300 mt-1">
                        Based on {filteredReviews.filter(r => r.textbookUse !== undefined && r.textbookUse !== null && r.textbookUse !== "").length} student responses
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-baseline justify-center">
              <span className={`text-4xl font-bold ${
                textbookUsage === null ? 'text-gray-400' :
                textbookUsage >= 70 ? 'text-red-500' :
                textbookUsage >= 30 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {textbookUsage === null ? 'N/A' : 
                 textbookUsage >= 70 ? 'REQ' :
                 textbookUsage >= 30 ? 'SOME' : 'OPT'}
              </span>
            </div>
          </div>

          {/* Attendance */}
          <div className="text-center">
            <div className="text-base text-black mb-2 flex items-center justify-center">
              <span>Attendance</span>
              <div className="relative ml-1">
                <span 
                  className="cursor-help text-gray-600 hover:text-black text-sm"
                  onMouseEnter={() => setShowAttendanceTooltip(true)}
                  onMouseLeave={() => setShowAttendanceTooltip(false)}
                >
                  ⓘ
                </span>
                {showAttendanceTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                    <div className="text-center">
                      <div className="font-medium">
                        Attendance Required: {attendanceRequirement === null ? 'No data' : `${attendanceRequirement}%`}
                      </div>
                      <div className="text-gray-300 mt-1">
                        Based on {filteredReviews.filter(r => r.attendanceMandatory !== undefined && r.attendanceMandatory !== null && r.attendanceMandatory !== "").length} student responses
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-baseline justify-center">
              <span className={`text-4xl font-bold ${
                attendanceRequirement === null ? 'text-gray-400' :
                attendanceRequirement >= 70 ? 'text-red-500' :
                attendanceRequirement >= 30 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {attendanceRequirement === null ? 'N/A' :
                 attendanceRequirement >= 70 ? 'REQ' :
                 attendanceRequirement >= 30 ? 'SOME' : 'OPT'}
              </span>
            </div>
          </div>
        </div>
    </div>
  );
}

// Course interface for taught courses
interface TaughtCourse {
  courseCode: string;
  courseTitle: string;
  term: string;
  scheduleType: string;
  credits: number;
  crn: string;
  meetingDays: string;
  meetingTimes: string;
  seats: string;
}

// Courses Taught Component
interface CoursesTaughtProps {
  professor: Professor;
  selectedCourse: string | null;
  onCourseSelect: (courseCode: string | null) => void;
}

function CoursesTaught({ professor, selectedCourse, onCourseSelect }: CoursesTaughtProps) {
  const [currentCourses, setCurrentCourses] = useState<TaughtCourse[]>([]);
  const [historicalCourses, setHistoricalCourses] = useState<TaughtCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedScheduleType, setSelectedScheduleType] = useState<string>('all');
  const [availableTerms, setAvailableTerms] = useState<string[]>([]);

  useEffect(() => {
    const fetchCurrentAndHistoricalCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch current courses from API
        let currentCoursesData: TaughtCourse[] = [];
        try {
          const professorName = `${professor.firstName} ${professor.lastName}`;
          const response = await fetch(`${API_BASE_URL}/professors/${encodeURIComponent(professorName)}/current-courses`);
          if (response.ok) {
            currentCoursesData = await response.json();
          }
        } catch (apiError) {
          console.log('No current course data available from API');
        }

        // Extract historical courses from review data
        const historicalCoursesData: TaughtCourse[] = [];
        const termSet = new Set<string>();

        if (professor.reviews && typeof professor.reviews === 'object') {
          Object.entries(professor.reviews).forEach(([courseCode, reviews]) => {
            const reviewsArray = Array.isArray(reviews) ? reviews : [reviews];
            
            // Get the most recent review to determine recency
            const sortedReviews = reviewsArray.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            const mostRecentReview = sortedReviews[0];
            const reviewYear = new Date(mostRecentReview.date).getFullYear();
            
            // Create a term based on the most recent review year
            const term = `${reviewYear}`;
            termSet.add(term);

            // Add course to historical list
            historicalCoursesData.push({
              courseCode: courseCode,
              courseTitle: `${courseCode}`, // We don't have course titles in review data
              term: term,
              scheduleType: "Lecture", // Default since we don't have this info
              credits: 3, // Default
              crn: "", // Not available
              meetingDays: "", // Not available
              meetingTimes: "", // Not available
              seats: "" // Not available
            });
          });
        }

        setCurrentCourses(currentCoursesData);
        setHistoricalCourses(historicalCoursesData);
        setAvailableTerms(['Current', ...Array.from(termSet).sort((a, b) => parseInt(b) - parseInt(a))]);
        
      } catch (err) {
        setError('Failed to load course data');
        console.error('Error loading courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentAndHistoricalCourses();
  }, [professor]);

  // Combine current and historical courses for filtering
  const allCourses = [
    ...currentCourses.map(course => ({ ...course, term: 'Current' })),
    ...historicalCourses
  ];

  // Filter courses based on selected filters
  const filteredCourses = allCourses.filter((course: TaughtCourse) => {
    const termMatch = selectedTerm === 'all' || course.term === selectedTerm;
    const scheduleMatch = selectedScheduleType === 'all' || course.scheduleType === selectedScheduleType;
    return termMatch && scheduleMatch;
  });

  // Group courses by course code
  const groupedCourses = filteredCourses.reduce((acc: Record<string, TaughtCourse[]>, course: TaughtCourse) => {
    if (!acc[course.courseCode]) {
      acc[course.courseCode] = [];
    }
    acc[course.courseCode].push(course);
    return acc;
  }, {} as Record<string, TaughtCourse[]>);

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Courses Taught</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <SkeletonText width="150px" height="1.5rem" className="mb-2" />
              <SkeletonText width="100%" height="1rem" className="mb-2" />
              <SkeletonText width="200px" height="1rem" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Courses Taught</h2>
        <div className="text-center py-8 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Courses Taught</h2>
      
      {/* Term Filter */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Term</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTerm('all')}
            className={`px-3 py-1 rounded-md border text-sm ${
              selectedTerm === 'all'
                ? 'bg-primary-blue text-white border-primary-blue'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            All Terms
          </button>
          {availableTerms.map(term => (
            <button
              key={term}
              onClick={() => setSelectedTerm(term)}
              className={`px-3 py-1 rounded-md border text-sm ${
                selectedTerm === term
                  ? 'bg-primary-blue text-white border-primary-blue'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Course Tags */}
      {Object.keys(groupedCourses).length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No courses found for the selected term.
        </div>
      ) : (
        <div>
          {/* Currently Teaching */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Currently Teaching</h3>
            {currentCourses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentCourses.map((course) => (
                  <button
                    key={`current-${course.courseCode}-${course.crn}`}
                    onClick={() => onCourseSelect(selectedCourse === course.courseCode ? null : course.courseCode)}
                    className={`px-3 py-2 border rounded-md transition-colors text-sm font-medium ${
                      selectedCourse === course.courseCode
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                    }`}
                    title={`${course.courseCode}: ${course.courseTitle} - ${course.meetingDays} ${course.meetingTimes}`}
                  >
                    {course.courseCode}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic">
                No current courses found
              </div>
            )}
          </div>

          {/* Previously Taught */}
          {(() => {
            const pastCourses = Object.entries(groupedCourses).filter(([_, courseSections]) =>
              (courseSections as TaughtCourse[]).every((course: TaughtCourse) => course.term !== "Current")
            );
            
            if (pastCourses.length > 0) {
              return (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Previously Taught</h3>
                  <div className="flex flex-wrap gap-2">
                    {pastCourses.map(([courseCode, courseSections]) => (
                      <button
                        key={`past-${courseCode}`}
                        onClick={() => onCourseSelect(selectedCourse === courseCode ? null : courseCode)}
                        className={`px-3 py-2 border rounded-md transition-colors text-sm font-medium ${
                          selectedCourse === courseCode
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                        }`}
                        title={`${courseCode} - Last reviews from ${(courseSections as TaughtCourse[])[0].term}`}
                      >
                        {courseCode}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
}

// Rate My Professor Tags Component
interface RMPTagsProps {
  professor: Professor;
  selectedCourse: string | null;
}

function RMPTags({ professor, selectedCourse }: RMPTagsProps) {
  // State for expanded categories
  const [expandedCategories, setExpandedCategories] = useState<{
    strengths: boolean;
    expectations: boolean;
    challenges: boolean;
  }>({
    strengths: false,
    expectations: false,
    challenges: false
  });

  // Extract and count all tags from reviews
  const getTagsWithCounts = () => {
    const tagCounts: { [key: string]: number } = {};
    
    if (!professor.reviews || typeof professor.reviews !== 'object') return [];
    
    Object.entries(professor.reviews).forEach(([courseCode, courseReviews]) => {
      // If a course is selected, only include tags for that course
      if (selectedCourse && courseCode !== selectedCourse) return;
      
      const reviewsArray = Array.isArray(courseReviews) ? courseReviews : [courseReviews];
      
              reviewsArray.forEach(review => {
          if (review.ratingTags && Array.isArray(review.ratingTags)) {
            review.ratingTags.forEach((tag: string) => {
              if (tag && tag.trim() !== '') {
                // Normalize case: convert to title case for consistency
                const cleanTag = tag.trim()
                  .toLowerCase()
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
              }
            });
          }
        });
    });
    
    // Convert to array and sort by count (descending)
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  };

  const tagsWithCounts = getTagsWithCounts();

  // Categorize tags into strengths, expectations, and challenges
  const categorizedTags = {
    strengths: [] as { tag: string; count: number }[],
    expectations: [] as { tag: string; count: number }[],
    challenges: [] as { tag: string; count: number }[]
  };

  tagsWithCounts.forEach(({ tag, count }) => {
    const lowerTag = tag.toLowerCase();
    
    // Positive/Strength tags
    if (lowerTag.includes('amazing') || lowerTag.includes('great') || lowerTag.includes('helpful') || 
        lowerTag.includes('clear') || lowerTag.includes('caring') || lowerTag.includes('funny') ||
        lowerTag.includes('extra credit') || lowerTag.includes('accessible') || lowerTag.includes('inspirational') ||
        lowerTag.includes('good') || lowerTag.includes('respected') || lowerTag.includes('hilarious') ||
        lowerTag.includes('gives good feedback')) {
      categorizedTags.strengths.push({ tag, count });
    }
    // Challenge/Warning tags
    else if (lowerTag.includes('tough') || lowerTag.includes('hard') || lowerTag.includes('difficult') || 
             lowerTag.includes('skip') || lowerTag.includes('avoid') || lowerTag.includes('boring') ||
             lowerTag.includes('confusing') || lowerTag.includes('unhelpful') || lowerTag.includes('rude') ||
             lowerTag.includes('grader') || lowerTag.includes('won\'t pass')) {
      categorizedTags.challenges.push({ tag, count });
    }
    // What to Expect tags (neutral/informational)
    else {
      categorizedTags.expectations.push({ tag, count });
    }
  });

    const maxCount = Math.max(...tagsWithCounts.map(t => t.count));

  // Toggle category expansion
  const toggleCategory = (category: 'strengths' | 'expectations' | 'challenges') => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Generate visual bar for tag count
  const generateBar = (count: number, maxCount: number, maxBarLength: number = 10) => {
    const barLength = Math.max(1, Math.round((count / maxCount) * maxBarLength));
    return '█'.repeat(barLength);
  };

  // Render category section with micro-charts
  const renderCategory = (
    title: string, 
    tags: { tag: string; count: number }[], 
    bgColor: string, 
    borderColor: string,
    textColor: string,
    categoryKey: 'strengths' | 'expectations' | 'challenges'
  ) => {
    if (tags.length === 0) return null;

    const isExpanded = expandedCategories[categoryKey];
    const displayTags = isExpanded ? tags : tags.slice(0, 5);
    const hasMore = tags.length > 5;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <span className="text-sm text-gray-500">
              ({tags.length} tag{tags.length !== 1 ? 's' : ''})
            </span>
          </div>
          {hasMore && (
            <button
              onClick={() => toggleCategory(categoryKey)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isExpanded ? 'Show Less' : 'Show All'}
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          {displayTags.map(({ tag, count }) => (
            <div key={tag} className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-sm font-mono ${textColor.replace('text-', 'text-')} text-opacity-80`}>
                  {generateBar(count, maxCount)}
                </span>
                <span className="text-sm text-gray-700 truncate">
                  {tag}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  ({count})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

    if (tagsWithCounts.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Feedback Overview</h2>
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          {selectedCourse 
            ? `No student tags available for ${selectedCourse} reviews.`
            : 'No student tags available from reviews.'
          }
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Feedback Overview</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderCategory(
          'Strengths', 
          categorizedTags.strengths, 
          'bg-green-100', 
          'border-green-300',
          'text-green-800',
          'strengths'
        )}
        
        {renderCategory(
          'What to Expect', 
          categorizedTags.expectations, 
          'bg-blue-100', 
          'border-blue-300',
          'text-blue-800',
          'expectations'
        )}
        
        {renderCategory(
          'Challenges', 
          categorizedTags.challenges, 
          'bg-red-100', 
          'border-red-300',
          'text-red-800',
          'challenges'
        )}
      </div>
    </div>
  );
}

// Course Reviews Component (moved to Reviews tab)
interface CourseReviewsProps {
  professor: Professor;
}

function CourseReviews({ professor }: CourseReviewsProps) {
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  const toggleCourse = (courseCode: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseCode]: !prev[courseCode]
    }));
  };

  // Calculate average quality rating (combined helpfulness/clarity) for a course
  const calculateQualityRating = (reviews: any[]) => {
    let sum = 0;
    let count = 0;
    
    reviews.forEach(review => {
      // Use either helpfulness or clarity (they're the same)
      if (review.helpfulRating) {
        sum += review.helpfulRating;
        count++;
      } else if (review.clarityRating) {
        sum += review.clarityRating;
        count++;
      }
    });
    
    return count > 0 ? (sum / count).toFixed(1) : 'N/A';
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Reviews</h2>
      <div className="space-y-6">
        {professor.reviews && typeof professor.reviews === 'object' ? 
          Object.entries(professor.reviews).map(([courseCode, reviews]) => {
            // Ensure reviews is an array
            const reviewsArray = Array.isArray(reviews) ? reviews : [reviews];
            
            return (
              <div key={courseCode} className="border rounded-lg p-6">
                <div 
                  className="flex justify-between items-center cursor-pointer" 
                  onClick={() => toggleCourse(courseCode)}
                >
                  <h3 className="text-xl font-semibold text-primary-blue">{courseCode}</h3>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span className="text-lg font-semibold">
                      {calculateQualityRating(reviewsArray)}
                    </span>
                    <span className="ml-3 transition-transform duration-200" style={{ transform: expandedCourses[courseCode] ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>
                
                {expandedCourses[courseCode] && (
                  <div className="mt-4 space-y-4">
                    {reviewsArray.map((review, index) => (
                      <div key={index} className="border-t pt-4 first:border-t-0 first:pt-0">
                        {review.comment && (
                          <p className="text-gray-600 mb-2">{review.comment}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>Difficulty: {review.difficultyRating.toFixed(1)}</span>
                          <span>Would Take Again: {review.wouldTakeAgain ? 'Yes' : 'No'}</span>
                          {(review.helpfulRating || review.clarityRating) && (
                            <span>Quality: {review.helpfulRating?.toFixed(1) || review.clarityRating?.toFixed(1)}</span>
                          )}
                          {review.grade && <span>Grade: {review.grade}</span>}
                          {review.date && <span>Date: {new Date(review.date).toLocaleDateString()}</span>}
                          {review.textbookUse && <span>Textbook: {review.textbookUse}</span>}
                          {review.attendanceMandatory && <span>Attendance: {review.attendanceMandatory}</span>}
                          {review.isForOnlineClass && <span>Online Class</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-8 text-gray-500">
              No reviews available.
            </div>
          )
        }
      </div>
    </div>
  );
}

export default function ProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfessorTabType>("overview");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfessor = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/professors/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch professor details');
        }
        const data = await response.json();
        setProfessor(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch professor details');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessor();
  }, [resolvedParams.id]);

  const handleTabChange = (tab: ProfessorTabType) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            {/* Professor Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <SkeletonText width="300px" height="2.5rem" className="mb-2" />
                <SkeletonText width="200px" height="1.25rem" />
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex space-x-6">
                <SkeletonText width="6rem" height="2.5rem" className="mb-2" />
                <SkeletonText width="6rem" height="2.5rem" className="mb-2" />
                <SkeletonText width="6rem" height="2.5rem" className="mb-2" />
                <SkeletonText width="6rem" height="2.5rem" className="mb-2" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg">
                  <SkeletonText width="80px" height="1.25rem" className="mx-auto mb-2" />
                  <SkeletonText width="60px" height="2rem" className="mx-auto" />
                </div>
              ))}
            </div>

            {/* Course Reviews Section */}
            <div>
              <SkeletonText width="200px" height="2rem" className="mb-4" />
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <SkeletonText width="150px" height="1.5rem" />
                      <div className="flex items-center">
                        <SkeletonText width="40px" height="1.5rem" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {[1, 2].map((j) => (
                        <div key={j} className="border-t pt-4">
                          <SkeletonText width="100%" height="1rem" className="mb-2" />
                          <SkeletonText width="100%" height="1rem" className="mb-2" />
                          <div className="flex flex-wrap gap-4">
                            <SkeletonText width="100px" height="1rem" />
                            <SkeletonText width="120px" height="1rem" />
                            <SkeletonText width="80px" height="1rem" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !professor) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-4 text-primary-red">
            {error || 'Professor not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          {/* Professor Header */}
          <ProfessorHeader professor={professor} onClose={() => router.back()} />

          {/* Tab Navigation */}
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Tab Content */}
          <div className="rounded-lg">
                        {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left column - Overview information */}
                  <div className="md:w-1/2">
                    <CoursesTaught 
                      professor={professor} 
                      selectedCourse={selectedCourse}
                      onCourseSelect={setSelectedCourse}
                    />
                  </div>

                  {/* Right column - Professor Stats */}
                  <div className="md:w-1/2">
                    <ProfessorStats professor={professor} selectedCourse={selectedCourse} onCourseSelect={setSelectedCourse} />
                  </div>
                </div>

                {/* Student Tags Section */}
                <div className="border-t pt-8">
                  <RMPTags professor={professor} selectedCourse={selectedCourse} />
                </div>
              </div>
            )}

            {/* Grades Tab */}
            {activeTab === 'grades' && (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
            </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Grade Distribution</h3>
                  <p className="text-gray-600 mb-4">
                    View detailed grade distribution and statistics for this professor's courses.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Coming Soon:</strong> We're working on bringing you comprehensive grade analysis and trends.
              </p>
            </div>
              </div>
              </div>
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Course History</h3>
                  <p className="text-gray-600 mb-4">
                    Explore all courses this professor has taught and is currently teaching.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Coming Soon:</strong> We're compiling comprehensive course history and teaching schedules.
                    </p>
                          </div>
                        </div>
                    </div>
                  )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left column - Reviews */}
                  <div className="md:w-1/2">
                    <CourseReviews professor={professor} />
                  </div>

                  {/* Right column - Professor Stats */}
                  <div className="md:w-1/2">
                    <ProfessorStats professor={professor} selectedCourse={selectedCourse} onCourseSelect={setSelectedCourse} />
                  </div>
                </div>

                {/* Student Tags Section */}
                <div className="border-t pt-8">
                  <RMPTags professor={professor} selectedCourse={selectedCourse} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 