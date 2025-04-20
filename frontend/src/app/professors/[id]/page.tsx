'use client';

import { useEffect, useState } from 'react';
import { Professor } from '@/types/professor';
import { useRouter } from 'next/navigation';
import { use } from 'react';

const API_BASE_URL = '/api';

export default function ProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-blue border-r-transparent mr-2"></div>
            <p>Loading professor details...</p>
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

  // Calculate quality rating for the professor (average of helpfulness and clarity)
  const professorQuality = professor.helpfulRating || professor.clarityRating ? 
    ((professor.helpfulRating || 0) + (professor.clarityRating || 0)) / 
    ((professor.helpfulRating ? 1 : 0) + (professor.clarityRating ? 1 : 0)) : 
    null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {professor.firstName} {professor.lastName}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{professor.department}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {professorQuality && (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="font-semibold text-gray-700">Quality</h3>
                <p className={`text-2xl font-bold ${getQualityColor(professorQuality)}`}>
                  {professorQuality.toFixed(1)} <span className="text-gray-500 text-sm">/ 5.0</span>
                </p>
              </div>
            )}
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-gray-700">Difficulty</h3>
              <p className={`text-2xl font-bold ${getDifficultyColor(professor.avgDifficulty)}`}>
                {professor.avgDifficulty.toFixed(1)} <span className="text-gray-500 text-sm">/ 5.0</span>
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h3 className="font-semibold text-gray-700">Would Take Again</h3>
              <p className={`text-2xl font-bold ${getWouldTakeAgainColor(professor.wouldTakeAgainPercent)}`}>
                {professor.wouldTakeAgainPercent}%
              </p>
            </div>
            {professor.averageGrade ? (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="font-semibold text-gray-700">Average Grade</h3>
                <p className={`text-2xl font-bold ${getGradeColor(professor.averageGrade)}`}>
                  {professor.averageGrade}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="font-semibold text-gray-700">Average Grade</h3>
                <p className="text-2xl font-bold text-gray-400">
                  N/A
                </p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Reviews</h2>
            <div className="space-y-6">
              {Object.entries(professor.reviews).map(([courseCode, reviews]) => (
                <div key={courseCode} className="border rounded-lg p-6">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => toggleCourse(courseCode)}
                  >
                    <h3 className="text-xl font-semibold text-primary-blue">{courseCode}</h3>
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="text-lg font-semibold">
                        {calculateQualityRating(reviews)}
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
                      {reviews.map((review, index) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 