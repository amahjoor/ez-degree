"use client";

import { useState, useEffect, useRef } from "react";
import { Course, Subject } from "@/types/course";

// API configuration
const API_BASE_URL = '/api';

interface CourseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse: (course: Course) => void;
  semesterTitle: string;
}

const CourseSelectionModal: React.FC<CourseSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectCourse,
  semesterTitle
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow value
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling on the body
      document.body.style.overflow = 'hidden';
      
      // Restore the original overflow when component unmounts or modal closes
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Close modal with escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);
  
  // Fetch subjects when component mounts
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/subjects/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch subjects: ${response.statusText}`);
        }
        const data = await response.json();
        setSubjects(data);
      } catch (err) {
        setError("Failed to load subjects");
        console.error(err);
      }
    };
    
    fetchSubjects();
  }, [isOpen]);
  
  // Fetch courses when search or subject filters change
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Construct URL with search and subject parameters
        let url = `${API_BASE_URL}/courses/?limit=20`;
        
        if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }
        
        if (selectedSubject) {
          url += `&subject=${encodeURIComponent(selectedSubject)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setCourses(data.courses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [searchTerm, selectedSubject, isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Add Course to {semesterTitle}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Subject Filter */}
            <div className="w-full sm:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.id} - {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Search Input */}
            <div className="w-full sm:w-2/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses by name or code..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-grow p-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-blue"></div>
              <span className="ml-3">Loading courses...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No courses found. Try adjusting your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {courses.map((course) => (
                <div
                  key={course.course_code}
                  className="border border-gray-200 rounded-md p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectCourse(course);
                    onClose();
                  }}
                >
                  <div className="font-medium text-primary-blue">{course.course_code}</div>
                  <div className="text-sm text-gray-600 mt-1">{course.title}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-primary-green font-medium">{course.credits} credits</span>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{course.subject}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 mr-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseSelectionModal; 