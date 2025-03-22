"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Subject {
  id: string;
  name: string;
  course_count: number;
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://127.0.0.1:8000/subjects/");
        if (!response.ok) {
          throw new Error("Failed to fetch subjects");
        }
        const data = await response.json();
        setSubjects(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load subjects. Make sure the API server is running.");
        setLoading(false);
        console.error(err);
      }
    };

    fetchSubjects();
  }, []);

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

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GMU Subjects</h1>
        <p className="text-gray-600">Browse all available subjects and departments</p>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2">Loading subjects...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{subject.id}</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {subject.course_count} courses
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{subject.name}</p>
                <div className="mt-4">
                  <Link
                    href={`/?subject=${subject.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View courses →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 