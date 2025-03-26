'use client';

import { useEffect, useState } from 'react';
import { Professor } from '@/types/professor';
import Link from 'next/link';
import { use } from 'react';

const API_BASE_URL = '/api';

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex gap-4">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfessor = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/professors/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch professor details');
        }
        const data = await response.json();
        setProfessor(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch professor details');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessor();
  }, [resolvedParams.id]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !professor) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-500 py-4">
            {error || 'Professor not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link 
            href="/?tab=professors"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Professors
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {professor.firstName} {professor.lastName}
                </h1>
                <p className="mt-1 text-lg text-gray-500">{professor.department}</p>
              </div>
              {professor.url && (
                <a
                  href={professor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View on RateMyProfessor
                </a>
              )}
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {professor.avgRating.toFixed(1)} / 5.0
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Difficulty</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {professor.avgDifficulty.toFixed(1)} / 5.0
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Would Take Again</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {professor.wouldTakeAgainPercent}%
                </p>
              </div>
              {professor.helpfulRating && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Helpfulness</h3>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {professor.helpfulRating.toFixed(1)} / 5.0
                  </p>
                </div>
              )}
              {professor.clarityRating && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Clarity</h3>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {professor.clarityRating.toFixed(1)} / 5.0
                  </p>
                </div>
              )}
              {professor.averageGrade && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Average Grade</h3>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {professor.averageGrade}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Reviews</h2>
              <div className="space-y-6">
                {Object.entries(professor.reviews).map(([courseCode, reviews]) => (
                  <div key={courseCode} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{courseCode}</h3>
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-gray-900">
                          {(reviews.reduce((acc, review) => acc + review.difficultyRating, 0) / reviews.length).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {reviews.map((review, index) => (
                        <div key={index} className="border-t pt-4 first:border-t-0 first:pt-0">
                          {review.comment && (
                            <p className="text-gray-600 mb-2">{review.comment}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span>Difficulty: {review.difficultyRating.toFixed(1)}</span>
                            <span>Would Take Again: {review.wouldTakeAgain ? 'Yes' : 'No'}</span>
                            {review.grade && <span>Grade: {review.grade}</span>}
                            {review.date && <span>Date: {new Date(review.date).toLocaleDateString()}</span>}
                            {review.isForOnlineClass && <span>Online Class</span>}
                            {review.isForCredit && <span>For Credit</span>}
                            {review.attendanceMandatory && <span>Attendance: {review.attendanceMandatory}</span>}
                            {review.textbookUse && <span>Textbook: {review.textbookUse}</span>}
                          </div>
                          {review.ratingTags && review.ratingTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {review.ratingTags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
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
    </div>
  );
} 