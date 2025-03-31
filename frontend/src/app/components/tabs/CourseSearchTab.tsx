import { useState, useEffect } from "react";
import Link from "next/link";

interface Course {
  course_code: string;
  title: string;
  credits: number;
  subject: string;
}

interface CourseSearchTabProps {
  isApiAvailable: boolean;
  API_BASE_URL: string;
}

export function CourseSearchTab({ isApiAvailable, API_BASE_URL }: CourseSearchTabProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const itemsPerPage = 10;

  // Fetch courses when search, subject filters, or page changes
  useEffect(() => {
    if (!isApiAvailable) return;

    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Calculate pagination parameters
        const skip = (currentPage - 1) * itemsPerPage;
        const limit = itemsPerPage;
        
        // Construct URL with search and pagination parameters
        let url = `${API_BASE_URL}/courses/?skip=${skip}&limit=${limit}`;
        
        if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setCourses(data.courses);
        setTotalCourses(data.total);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch courses");
        setCourses([]);
        setTotalCourses(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [searchTerm, currentPage, isApiAvailable, API_BASE_URL]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCourses / itemsPerPage);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const displayRange = 2; // Number of pages to show before and after current page
    
    // Always show page 1
    pageNumbers.push(1);
    
    // Calculate range of pages to show
    let rangeStart = Math.max(2, currentPage - displayRange);
    let rangeEnd = Math.min(totalPages - 1, currentPage + displayRange);
    
    // If current page is close to start, show more pages after
    if (currentPage - displayRange < 2) {
      rangeEnd = Math.min(totalPages - 1, rangeEnd + (2 - (currentPage - displayRange)));
    }
    
    // If current page is close to end, show more pages before
    if (currentPage + displayRange > totalPages - 1) {
      rangeStart = Math.max(2, rangeStart - ((currentPage + displayRange) - (totalPages - 1)));
    }
    
    // Add ellipsis if needed
    if (rangeStart > 2) {
      pageNumbers.push("...");
    }
    
    // Add range of pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis if needed
    if (rangeEnd < totalPages - 1) {
      pageNumbers.push("...");
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="mb-8 bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Course Search
        </h2>
        <div className="flex space-x-4">
          <input
            type="text"
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search for courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
            onClick={() => {
              // Implement course search functionality
              console.log("Searching for courses:", searchTerm);
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Course Results */}
      <div className="mt-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-2">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No courses found. Try adjusting your search criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.course_code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link href={`/courses/${encodeURIComponent(course.course_code)}`}>
                          {course.course_code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.subject}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
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
                  
                  {getPageNumbers().map((page, idx) => (
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
                        onClick={() => handlePageChange(page as number)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        } text-sm font-medium`}
                      >
                        {page}
                      </button>
                    )
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
    </div>
  );
} 