"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  overall_difficulty?: number;
  overall_grade?: string;
}

interface CourseReview {
  professor_name: string;
  professor_department: string;
  comment: string;
  date: string;
  difficulty_rating: number;
  clarity_rating?: number;
  helpful_rating?: number;
  grade: string;
  textbook_use?: string;
  would_take_again?: boolean;
  attendance_mandatory?: string;
  is_for_credit?: boolean;
  is_for_online_class?: boolean;
  rating_tags?: string[];
  thumbs_down_total?: number;
  thumbs_up_total?: number;
}

interface ReviewSummary {
  total_reviews: number;
  average_ratings: {
    difficulty: number;
    clarity: number;
    helpful: number;
  };
  grade_distribution: Record<string, number>;
  top_tags: string[];
}

interface PaginatedReviews {
  total: number;
  page: number;
  total_pages: number;
  reviews: CourseReview[];
}

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
          className="text-blue-600 hover:text-blue-800 hover:underline"
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

// Add ProfessorModal component
function ProfessorModal({ professor, onClose }: { professor: Professor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {professor.firstName} {professor.lastName}
            </h3>
            <p className="text-sm text-gray-500">{professor.department}</p>
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

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700">Rating</h4>
              <p className="text-2xl font-bold text-gray-900">{professor.avgRating.toFixed(1)} / 5.0</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700">Difficulty</h4>
              <p className="text-2xl font-bold text-gray-900">{professor.avgDifficulty.toFixed(1)} / 5.0</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700">Would Take Again</h4>
              <p className="text-2xl font-bold text-gray-900">
                {professor.wouldTakeAgainPercent === -1 ? 'N/A' : `${Math.round(professor.wouldTakeAgainPercent)}%`}
              </p>
            </div>
            {professor.helpfulRating && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700">Helpfulness</h4>
                <p className="text-2xl font-bold text-gray-900">{professor.helpfulRating.toFixed(1)} / 5.0</p>
              </div>
            )}
            {professor.clarityRating && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700">Clarity</h4>
                <p className="text-2xl font-bold text-gray-900">{professor.clarityRating.toFixed(1)} / 5.0</p>
              </div>
            )}
            {professor.averageGrade && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700">Average Grade</h4>
                <p className="text-2xl font-bold text-gray-900">{professor.averageGrade}</p>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-4">Reviews</h4>
            <div className="space-y-4">
              {professor.reviews.map((review, index) => (
                <div key={index} className="border-t pt-4 first:border-t-0 first:pt-0">
                  {review.comment && (
                    <p className="text-gray-600 mb-2">{review.comment}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>Rating: {review.difficultyRating.toFixed(1)}</span>
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
        </div>
      </div>
    </div>
  );
}

export default function CourseDetail() {
  const params = useParams();
  const courseCode = params.courseCode as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  
  // New state variables for reviews
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Function to fetch reviews
  const fetchReviews = async (page: number = 1) => {
    setReviewsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseCode}/reviews?page=${page}`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data: PaginatedReviews = await response.json();
      setReviews(data.reviews);
      setTotalPages(data.total_pages);
      setCurrentPage(data.page);
      setReviewsError(null);
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : "Failed to fetch reviews");
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Function to fetch review summary
  const fetchReviewSummary = async () => {
    try {
      const response = await fetch(`/api/courses/${courseCode}/reviews/summary`);
      if (!response.ok) {
        throw new Error("Failed to fetch review summary");
      }
      const data = await response.json();
      setReviewSummary(data);
    } catch (err) {
      console.error("Error fetching review summary:", err);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/courses/${courseCode}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Course not found");
          }
          throw new Error("Failed to fetch course");
        }
        const data = await response.json();
        // Sort professors by rating (highest first)
        data.professors.sort((a: Professor, b: Professor) => b.avgRating - a.avgRating);
        setCourse(data);
        setLoading(false);
        
        // Fetch reviews and summary after course data is loaded
        fetchReviews();
        fetchReviewSummary();
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

  // Function to handle page changes
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchReviews(newPage);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Courses
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2">Loading course details...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p>{error}</p>
        </div>
      ) : course ? (
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {course.course_code}: {course.title}
            </h1>
            <p className="text-gray-600 mb-4">{course.credits} credits</p>
            
            {/* Course Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Information</h2>
                <div className="space-y-2">
                  <p><span className="font-medium">Subject:</span> {course.subject}</p>
                  <p><span className="font-medium">Prerequisites:</span> {parseCourseCodes(course.prerequisites) || 'None'}</p>
                  <p><span className="font-medium">Corequisites:</span> {parseCourseCodes(course.corequisites) || 'None'}</p>
                  <p><span className="font-medium">Restrictions:</span> {course.restrictions || 'None'}</p>
                  {course.notes && <p><span className="font-medium">Notes:</span> {course.notes}</p>}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Description</h2>
                <p className="text-gray-600">{parseCourseCodes(course.description)}</p>
              </div>
            </div>

            {/* Review Summary Section */}
            {reviewSummary && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Reviews Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium text-gray-700">Total Reviews</h3>
                    <p className="text-2xl font-bold text-gray-900">{reviewSummary.total_reviews}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium text-gray-700">Average Difficulty</h3>
                    <p className="text-2xl font-bold text-gray-900">{reviewSummary.average_ratings.difficulty.toFixed(1)} / 5.0</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium text-gray-700">Average Clarity</h3>
                    <p className="text-2xl font-bold text-gray-900">{reviewSummary.average_ratings.clarity.toFixed(1)} / 5.0</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium text-gray-700">Average Helpfulness</h3>
                    <p className="text-2xl font-bold text-gray-900">{reviewSummary.average_ratings.helpful.toFixed(1)} / 5.0</p>
                  </div>
                </div>
                
                {/* Grade Distribution */}
                <div className="mt-6">
                  <h3 className="font-medium text-gray-700 mb-2">Grade Distribution</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(reviewSummary.grade_distribution).map(([grade, count]) => (
                      <div key={grade} className="bg-white px-3 py-1 rounded-full text-sm">
                        {grade}: {count}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Top Tags */}
                {reviewSummary.top_tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-700 mb-2">Top Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {reviewSummary.top_tags.map(tag => (
                        <div key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Professors Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Professors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {course.professors.map((professor, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedProfessor(professor)}
                  >
                    <h3 className="font-semibold text-lg">
                      {professor.firstName} {professor.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{professor.department}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Rating:</span> {professor.avgRating.toFixed(1)} / 5.0
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Difficulty:</span> {professor.avgDifficulty.toFixed(1)} / 5.0
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Would Take Again:</span> {Math.round(professor.wouldTakeAgainPercent)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Reviews</h2>
              {reviewsLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-blue-500 border-r-transparent"></div>
                  <p className="mt-2">Loading reviews...</p>
                </div>
              ) : reviewsError ? (
                <div className="text-center py-4 text-red-600">
                  <p>{reviewsError}</p>
                </div>
              ) : reviews.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div key={index} className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{review.professor_name}</h3>
                            <p className="text-sm text-gray-600">{review.professor_department}</p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 mb-3">{review.comment}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>Rating: {review.difficulty_rating.toFixed(1)}</span>
                          {review.clarity_rating && <span>Clarity: {review.clarity_rating.toFixed(1)}</span>}
                          {review.helpful_rating && <span>Helpfulness: {review.helpful_rating.toFixed(1)}</span>}
                          {review.grade && <span>Grade: {review.grade}</span>}
                          {review.would_take_again !== undefined && (
                            <span>Would Take Again: {review.would_take_again ? 'Yes' : 'No'}</span>
                          )}
                          {review.textbook_use && <span>Textbook: {review.textbook_use}</span>}
                          {review.attendance_mandatory && <span>Attendance: {review.attendance_mandatory}</span>}
                          {review.is_for_online_class && <span>Online Class</span>}
                        </div>
                        {review.rating_tags && review.rating_tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {review.rating_tags.map(tag => (
                              <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-600 py-4">No reviews available for this course.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Professor Modal */}
      {selectedProfessor && (
        <ProfessorModal
          professor={selectedProfessor}
          onClose={() => setSelectedProfessor(null)}
        />
      )}
    </div>
  );
} 