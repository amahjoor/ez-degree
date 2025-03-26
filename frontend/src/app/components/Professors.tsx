import { useState, useEffect } from 'react';
import { Professor } from '@/types/professor';
import Link from 'next/link';

const API_BASE_URL = '/api';

export default function Professors() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [professorsLoading, setProfessorsLoading] = useState<boolean>(false);
  const [professorsError, setProfessorsError] = useState<string | null>(null);
  const [professorSearchTerm, setProfessorSearchTerm] = useState('');
  const [currentProfessorPage, setCurrentProfessorPage] = useState<number>(1);
  const [totalProfessors, setTotalProfessors] = useState<number>(0);
  const professorsPerPage = 10;

  // Fetch professors when component mounts or when search/page changes
  useEffect(() => {
    const fetchProfessors = async () => {
      setProfessorsLoading(true);
      setProfessorsError(null);
      try {
        const skip = (currentProfessorPage - 1) * professorsPerPage;
        const response = await fetch(
          `${API_BASE_URL}/professors?skip=${skip}&limit=${professorsPerPage}${
            professorSearchTerm ? `&search=${encodeURIComponent(professorSearchTerm)}` : ''
          }`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch professors');
        }
        const data = await response.json();
        setProfessors(data.professors);
        setTotalProfessors(data.total);
      } catch (error) {
        setProfessorsError(error instanceof Error ? error.message : 'Failed to fetch professors');
        setProfessors([]); // Set empty array on error
      } finally {
        setProfessorsLoading(false);
      }
    };

    // Add debounce to search
    const timeoutId = setTimeout(() => {
      fetchProfessors();
    }, 300); // Wait 300ms after the last keystroke

    return () => clearTimeout(timeoutId);
  }, [currentProfessorPage, professorSearchTerm]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentProfessorPage(1);
  }, [professorSearchTerm]);

  // Calculate total pages
  const totalProfessorPages = Math.ceil(totalProfessors / professorsPerPage);

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
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2">Loading professors...</p>
        </div>
      ) : professorsError ? (
        <div className="text-center py-8 text-red-500">
          {professorsError}
        </div>
      ) : (
        <>
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
                {professors.map((professor) => (
                  <tr 
                    key={`${professor.firstName}-${professor.lastName}-${professor.department}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/professors/${professor.url?.split('/').pop() || ''}`}
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
                      <div className="text-sm text-gray-900">
                        {professor.wouldTakeAgainPercent === -1 ? 'N/A' : `${professor.wouldTakeAgainPercent}%`}
                      </div>
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
          </div>

          {/* Professor Pagination */}
          {totalProfessorPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentProfessorPage(prev => Math.max(1, prev - 1))}
                  disabled={currentProfessorPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentProfessorPage === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
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

                {/* Page Numbers */}
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

                {/* Next Button */}
                <button
                  onClick={() => setCurrentProfessorPage(prev => Math.min(totalProfessorPages, prev + 1))}
                  disabled={currentProfessorPage === totalProfessorPages}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentProfessorPage === totalProfessorPages 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
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
        </>
      )}
    </div>
  );
}