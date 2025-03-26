import { useState, useEffect, useMemo } from 'react';
import { Professor } from '@/types/professor';
import Link from 'next/link';

const API_BASE_URL = '/api';

// Modal component for professor details
function ProfessorModal({ professor, onClose }: { professor: Professor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">
            {professor.firstName} {professor.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-gray-700">Department</h3>
            <p>{professor.department}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Average Rating</h3>
            <p>{professor.avgRating.toFixed(1)} / 5.0</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Difficulty</h3>
            <p>{professor.avgDifficulty.toFixed(1)} / 5.0</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Would Take Again</h3>
            <p>{professor.wouldTakeAgainPercent}%</p>
          </div>
          {professor.helpfulRating && (
            <div>
              <h3 className="font-semibold text-gray-700">Helpfulness</h3>
              <p>{professor.helpfulRating.toFixed(1)} / 5.0</p>
            </div>
          )}
          {professor.clarityRating && (
            <div>
              <h3 className="font-semibold text-gray-700">Clarity</h3>
              <p>{professor.clarityRating.toFixed(1)} / 5.0</p>
            </div>
          )}
          {professor.averageGrade && (
            <div>
              <h3 className="font-semibold text-gray-700">Average Grade</h3>
              <p>{professor.averageGrade}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Course Reviews</h3>
          <div className="space-y-4">
            {Object.entries(professor.reviews).map(([courseCode, reviews]) => (
              <div key={courseCode} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{courseCode}</h4>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span>
                      {(reviews.reduce((acc, review) => acc + review.difficultyRating, 0) / reviews.length).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {reviews.map((review, index) => (
                    <div key={index} className="border-t pt-3 first:border-t-0 first:pt-0">
                      {review.comment && (
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Difficulty: {review.difficultyRating.toFixed(1)}</span>
                        <span>Would Take Again: {review.wouldTakeAgain ? 'Yes' : 'No'}</span>
                        {review.grade && <span>Grade: {review.grade}</span>}
                        {review.date && <span>Date: {new Date(review.date).toLocaleDateString()}</span>}
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
  );
}

export default function Professors() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [professorsLoading, setProfessorsLoading] = useState<boolean>(false);
  const [professorsError, setProfessorsError] = useState<string | null>(null);
  const [professorSearchTerm, setProfessorSearchTerm] = useState('');
  const [currentProfessorPage, setCurrentProfessorPage] = useState<number>(1);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const professorsPerPage = 10;

  // Calculate filtered professors
  const filteredProfessors = useMemo(() => {
    return professors.filter(professor => 
      professor.firstName.toLowerCase().includes(professorSearchTerm.toLowerCase()) ||
      professor.lastName.toLowerCase().includes(professorSearchTerm.toLowerCase()) ||
      professor.department.toLowerCase().includes(professorSearchTerm.toLowerCase())
    );
  }, [professors, professorSearchTerm]);

  // Calculate total pages and paginated professors
  const totalProfessorPages = Math.ceil(filteredProfessors.length / professorsPerPage);
  const paginatedProfessors = useMemo(() => {
    const startIndex = (currentProfessorPage - 1) * professorsPerPage;
    return filteredProfessors.slice(startIndex, startIndex + professorsPerPage);
  }, [filteredProfessors, currentProfessorPage]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentProfessorPage(1);
  }, [professorSearchTerm]);

  // Function to get page numbers for pagination
  const getProfessorPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalProfessorPages <= maxVisiblePages) {
      return Array.from({ length: totalProfessorPages }, (_, i) => i + 1);
    }
    
    pages.push(1);
    
    if (currentProfessorPage > 3) {
      pages.push('...');
    }
    
    for (let i = Math.max(2, currentProfessorPage - 1); i <= Math.min(totalProfessorPages - 1, currentProfessorPage + 1); i++) {
      pages.push(i);
    }
    
    if (currentProfessorPage < totalProfessorPages - 2) {
      pages.push('...');
    }
    
    pages.push(totalProfessorPages);
    
    return pages;
  };

  // Fetch professors when component mounts
  useEffect(() => {
    const fetchProfessors = async () => {
      setProfessorsLoading(true);
      setProfessorsError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/professors`);
        if (!response.ok) {
          throw new Error('Failed to fetch professors');
        }
        const data = await response.json();
        setProfessors(Array.isArray(data.professors) ? data.professors : []);
      } catch (error) {
        setProfessorsError(error instanceof Error ? error.message : 'Failed to fetch professors');
        setProfessors([]); // Set empty array on error
      } finally {
        setProfessorsLoading(false);
      }
    };

    fetchProfessors();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search professors by name or department..."
          value={professorSearchTerm}
          onChange={(e) => setProfessorSearchTerm(e.target.value)}
        />
      </div>
      {professorsLoading ? (
        <div className="text-center py-4">Loading professors...</div>
      ) : professorsError ? (
        <div className="text-red-500 text-center py-4">{professorsError}</div>
      ) : (
        <div className="overflow-x-auto">
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
              {paginatedProfessors.map((professor) => (
                <tr 
                  key={`${professor.firstName}-${professor.lastName}-${professor.department}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/professors/${encodeURIComponent(`${professor.firstName}-${professor.lastName}`)}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {professor.firstName} {professor.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{professor.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{professor.avgRating.toFixed(1)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{professor.avgDifficulty.toFixed(1)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{professor.wouldTakeAgainPercent}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {Object.keys(professor.reviews).length} courses
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Professor Pagination */}
          {totalProfessorPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentProfessorPage(prev => Math.max(1, prev - 1))}
                  disabled={currentProfessorPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentProfessorPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                
                {getProfessorPageNumbers().map((page, idx) => (
                  page === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${page}`}
                      onClick={() => setCurrentProfessorPage(page as number)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentProfessorPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } text-sm font-medium`}
                    >
                      {page}
                    </button>
                  )
                ))}

                <button
                  onClick={() => setCurrentProfessorPage(prev => Math.min(totalProfessorPages, prev + 1))}
                  disabled={currentProfessorPage === totalProfessorPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentProfessorPage === totalProfessorPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </div>
      )}

      {/* Professor Details Modal */}
      {selectedProfessor && (
        <ProfessorModal
          professor={selectedProfessor}
          onClose={() => setSelectedProfessor(null)}
        />
      )}
    </div>
  );
} 