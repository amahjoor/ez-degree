"use client";

import React from 'react';
import Link from 'next/link';
import { Professor } from '@/types/professor';

interface ProfessorTableProps {
  professors: Professor[];
  showAll?: boolean;
  onViewAllProfessors?: () => void;
}

export default function ProfessorTable({ 
  professors, 
  showAll = false,
  onViewAllProfessors 
}: ProfessorTableProps) {
  // Number of professors to show in the preview
  const MAX_PREVIEW_PROFESSORS = 4;
  const displayProfessors = showAll ? professors : professors.slice(0, MAX_PREVIEW_PROFESSORS);

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-4">Professors</h3>
      {professors.length > 0 ? (
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
                {displayProfessors.map((professor) => (
                  <tr key={`${professor.firstName}-${professor.lastName}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/professors/${professor.url?.split('/').pop() || ''}`}
                        className="text-sm font-medium text-blue-500 hover:text-blue-700"
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
          {!showAll && professors.length > MAX_PREVIEW_PROFESSORS && (
            <div className="mt-3 text-right">
              <button 
                onClick={onViewAllProfessors}
                className="text-blue-500 hover:underline text-sm font-medium"
              >
                View all {professors.length} professors
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic">No professor data available.</p>
      )}
    </div>
  );
} 