"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CourseOverlayProps, CourseDetails } from './types';

const CourseOverlay: React.FC<{
  courseCode: string;
  onClose: () => void;
  position: { x: number; y: number };
}> = ({ courseCode, onClose, position }) => {
  // --- TABS ---
  const [activeTab, setActiveTab] = useState<'summary' | 'add'>('add');

  // --- COURSE SUMMARY STATES ---
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState<CourseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- ADD-CLASS STATES ---
  const [terms, setTerms] = useState<string[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>('');

  const [codeData, setCodeData] = useState<any[]>([]);
  const [codeDataLoading, setCodeDataLoading] = useState(false);
  const [codeDataError, setCodeDataError] = useState<string | null>(null);

  // Fetch course details when switching into summary
  useEffect(() => {
    if (activeTab !== 'summary') return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`http://127.0.0.1:8000/courses/${courseCode}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: CourseDetails) => {
        if (!cancelled) setCourseData(data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load course details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeTab, courseCode]);

  // Derive mostCommonGrade & totalReviews
  useEffect(() => {
    if (!courseData?.professors) return;
    const grades: Record<string, number> = {};
    let total = 0;

    courseData.professors.forEach(p =>
      p.reviews?.forEach(r => {
        if (r.grade) grades[r.grade] = (grades[r.grade] || 0) + 1;
        total++;
      })
    );

    let mcg = 'N/A', max = 0;
    for (const [g, cnt] of Object.entries(grades)) {
      if (cnt > max) {
        mcg = g;
        max = cnt;
      }
    }

    setCourseData(prev =>
      prev && ({ ...prev, mostCommonGrade: mcg, totalReviews: total })
    );
  }, [courseData?.professors]);

  const professors = courseData?.professors ?? [];

  // Fetch term list on mount
  useEffect(() => {
    let cancelled = false;
    setTermsLoading(true);
    setTermsError(null);

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v2/schedule-builder/term-list`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch terms');
        return res.json();
      })
      .then((list: string[]) => {
        if (!cancelled) setTerms(list);
      })
      .catch(() => {
        if (!cancelled) setTermsError('Failed to load terms');
      })
      .finally(() => {
        if (!cancelled) setTermsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Handler for Get Data button
  const fetchCourseCodeData = () => {
    if (!selectedTerm) return;
    setCodeDataLoading(true);
    setCodeDataError(null);
    setCodeData([]);

    const url =
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v2/schedule-builder/get-course-code-data` +
      `?Term=${encodeURIComponent(selectedTerm)}` +
      `&CourseCode=${encodeURIComponent(courseCode)}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch course-code-data');
        return res.json(); // expecting JSON array
      })
      .then((data: any[]) => {
        setCodeData(data);
      })
      .catch(() => {
        setCodeDataError('Failed to load course code data');
      })
      .finally(() => {
        setCodeDataLoading(false);
      });
  };

  // Positioning helper
  const adjustPosition = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = position.x;
    let y = position.y;
    const width = 400, height = 300, offsetY = 10;

    if (x + width / 2 > vw) x = vw - width / 2 - 10;
    if (x - width / 2 < 0) x = width / 2 + 10;
    if (y - height < 20) {
      return { top: `${y + offsetY}px`, left: `${x}px`, transform: 'translate(-50%, 0)' };
    } else {
      return { top: `${y}px`, left: `${x}px`, transform: 'translate(-50%, -100%)' };
    }
  };
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    maxWidth: '400px',
    width: '100%',
    ...adjustPosition(),
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('.course-overlay') && !el.closest('.course-chip')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      className="course-overlay bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={overlayStyle}
    >
      {/* NAVBAR */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 text-center font-medium ${
            activeTab === 'summary'
              ? 'text-primary-blue border-b-2 border-primary-blue'
              : 'text-gray-600'
          }`}
        >
          Course Summary
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-2 text-center font-medium ${
            activeTab === 'add'
              ? 'text-primary-blue border-b-2 border-primary-blue'
              : 'text-gray-600'
          }`}
        >
          Add Class
        </button>
      </div>

      {/* CLOSE BUTTON */}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        onClick={onClose}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* TAB CONTENT */}
      {activeTab === 'summary' ? (
        loading ? (
          <div className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-20 bg-gray-200 rounded mb-4" />
            <div className="flex space-x-4">
              <div className="h-8 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : courseData ? (
          <>
            {/* HEADER */}
            <div className="flex justify-between items-center bg-blue-50 p-4 border-b border-blue-100">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{courseData.course_code}</h3>
                <p className="text-gray-600 text-sm">{courseData.credits} credits</p>
              </div>
              {courseData.mostCommonGrade && courseData.mostCommonGrade !== 'N/A' && (
                <div className="bg-primary-blue text-white text-2xl font-bold px-4 py-2 rounded-lg">
                  {courseData.mostCommonGrade}
                </div>
              )}
            </div>

            {/* BODY */}
            <div className="p-4">
              <h4 className="font-medium text-base mb-2">{courseData.title}</h4>
              {courseData.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {courseData.description}
                </p>
              )}
              {/* PROFESSORS */}
              {professors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Top Professors:</p>
                  {professors.slice(0, 2).map((p, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm">{p.firstName} {p.lastName}</span>
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-sm font-medium">
                          {p.avgRating?.toFixed(1) ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="mt-4 flex justify-between items-center pt-2 border-t border-gray-100">
              {courseData.totalReviews !== undefined && (
                <span className="text-xs text-gray-500">
                  {courseData.totalReviews} {courseData.totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              )}
              <Link
                href={`/courses/${encodeURIComponent(courseData.course_code)}`}
                className="text-primary-blue hover:text-blue-700 text-sm font-medium"
              >
                View Details →
              </Link>
            </div>
          </>
        ) : (
          <div className="p-4 text-gray-500">No course data available</div>
        )
      ) : (
        // --- ADD CLASS TAB ---
        <div className="p-4 space-y-4">
          {termsLoading ? (
            <p>Loading terms…</p>
          ) : termsError ? (
            <p className="text-red-500">{termsError}</p>
          ) : (
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Select a term</option>
              {terms.map(term => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchCourseCodeData}
            className="w-full bg-primary-blue text-white py-2 rounded disabled:opacity-50"
            disabled={!selectedTerm}
          >
            Get Data
          </button>

          {codeDataLoading && <p>Loading data…</p>}
          {codeDataError && <p className="text-red-500">{codeDataError}</p>}

          {codeData.length > 0 && (
            <div className="max-h-48 overflow-y-auto border-t pt-2">
              {codeData.map((row, idx) => (
                <div
                  key={idx}
                  onClick={() => console.log('clicked row', row)}
                  className="cursor-pointer py-2 px-3 hover:bg-gray-100 border-b last:border-none"
                >
                  <div className="font-medium text-gray-900">
                    {`${row.CourseSubject} ${row.CourseNumber}-${row.CourseSection}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {row.MeetingDays} @ {row.MeetingTimes}
                  </div>
                  <div className="text-sm text-gray-600">
                    {row.Seats}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseOverlay;