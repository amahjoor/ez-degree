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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-4">Loading professor details...</div>
        </div>
      </div>
    );
  }

  if (error || !professor) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-4 text-red-500">
            {error || 'Professor not found'}
          </div>
        </div>
      </div>
    );
  }

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700">Average Rating</h3>
              <p className="text-2xl font-bold text-gray-900">{professor.avgRating.toFixed(1)} / 5.0</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700">Difficulty</h3>
              <p className="text-2xl font-bold text-gray-900">{professor.avgDifficulty.toFixed(1)} / 5.0</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700">Would Take Again</h3>
              <p className="text-2xl font-bold text-gray-900">{professor.wouldTakeAgainPercent}%</p>
            </div>
            {professor.helpfulRating && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700">Helpfulness</h3>
                <p className="text-2xl font-bold text-gray-900">{professor.helpfulRating.toFixed(1)} / 5.0</p>
              </div>
            )}
            {professor.clarityRating && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700">Clarity</h3>
                <p className="text-2xl font-bold text-gray-900">{professor.clarityRating.toFixed(1)} / 5.0</p>
              </div>
            )}
            {professor.averageGrade && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700">Average Grade</h3>
                <p className="text-2xl font-bold text-gray-900">{professor.averageGrade}</p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Reviews</h2>
            <div className="space-y-6">
              {Object.entries(professor.reviews).map(([courseCode, reviews]) => (
                <div key={courseCode} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{courseCode}</h3>
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="text-lg font-semibold">
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
                          {review.clarityRating && <span>Clarity: {review.clarityRating.toFixed(1)}</span>}
                          {review.helpfulRating && <span>Helpfulness: {review.helpfulRating.toFixed(1)}</span>}
                          {review.textbookUse && <span>Textbook: {review.textbookUse}</span>}
                          {review.attendanceMandatory && <span>Attendance: {review.attendanceMandatory}</span>}
                          {review.isForOnlineClass && <span>Online Class</span>}
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