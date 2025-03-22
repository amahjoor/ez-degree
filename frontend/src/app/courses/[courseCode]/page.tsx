"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
}

export default function CourseDetail() {
  const params = useParams();
  const courseCode = params.courseCode as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : course ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-baseline">
              <span className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded-sm mr-2">
                {course.subject}
              </span>
              <h1 className="text-2xl font-bold">{course.course_code}</h1>
            </div>
            <h2 className="text-xl mt-1">{course.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{course.credits} Credits</p>
          </div>
          
          <div className="px-6 py-4">
            <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">{course.description}</p>
          </div>
          
          {course.prerequisites && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Prerequisites</h3>
              <p className="text-gray-600">{course.prerequisites}</p>
            </div>
          )}

          {course.corequisites && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Corequisites</h3>
              <p className="text-gray-600">{course.corequisites}</p>
            </div>
          )}

          {course.restrictions && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Registration Restrictions</h3>
              <p className="text-gray-600">{course.restrictions}</p>
            </div>
          )}

          {course.notes && (
            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-600">{course.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Course not found. Please check the course code and try again.
        </div>
      )}
    </div>
  );
} 