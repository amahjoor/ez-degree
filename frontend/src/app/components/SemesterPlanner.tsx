"use client";

import React, { useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import Link from 'next/link';
import CourseSelectionModal from './CourseSelectionModal';
import { Course } from '@/types/course';

interface CourseEntry {
  id: string;
  code: string;
  title: string;
  credits: number;
}

interface SemesterData {
  id: string;
  name: string;
  year: number;
  courses: CourseEntry[];
}

// Export a handle type for external control
export interface SemesterPlannerHandle {
  addCourse: (courseCode: string, courseTitle: string, credits: number, targetYear?: number, targetSemester?: string) => void;
}

const SemesterPlanner = forwardRef<SemesterPlannerHandle>((props, ref) => {
  // State to store courses for each semester
  const [semesters, setSemesters] = useState<{[key: string]: CourseEntry[]}>({});
  const [draggedCourse, setDraggedCourse] = useState<CourseEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSemester, setSelectedSemester] = useState<{year: number, name: string} | null>(null);
  
  // Years array (1-4)
  const years = [1, 2, 3, 4];
  
  // Semesters for each year
  const semesterTypes = ["Fall", "Spring", "Summer"];

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addCourse: (courseCode: string, courseTitle: string, credits: number, targetYear?: number, targetSemester?: string) => {
      // Default to the current semester or first available one
      const year = targetYear || 1;
      const semester = targetSemester || "Fall";
      
      const semesterId = `${year}-${semester}`;
      const newCourse: CourseEntry = {
        id: `course-${Date.now()}-${courseCode}`,
        code: courseCode,
        title: courseTitle,
        credits: Number(credits)
      };
      
      setSemesters(prev => ({
        ...prev,
        [semesterId]: [...(prev[semesterId] || []), newCourse]
      }));
    }
  }));
  
  // Function to open course selection modal
  const openCourseSelectionModal = (yearNum: number, semesterName: string) => {
    setSelectedSemester({ year: yearNum, name: semesterName });
    setIsModalOpen(true);
  };
  
  // Function to add a course to a semester from API data
  const addCourseFromSelection = (course: Course) => {
    if (!selectedSemester) return;
    
    const semesterId = `${selectedSemester.year}-${selectedSemester.name}`;
    const newCourse: CourseEntry = {
      id: `course-${Date.now()}-${course.course_code}`,
      code: course.course_code,
      title: course.title,
      credits: Number(course.credits) // Ensure credits is stored as a number
    };
    
    setSemesters(prev => ({
      ...prev,
      [semesterId]: [...(prev[semesterId] || []), newCourse]
    }));
  };
  
  // Function to remove a course from a semester
  const removeCourse = (semesterId: string, courseId: string) => {
    setSemesters(prev => ({
      ...prev,
      [semesterId]: prev[semesterId]?.filter(course => course.id !== courseId) || []
    }));
  };
  
  // Functions for drag and drop
  const handleDragStart = (course: CourseEntry) => {
    setDraggedCourse(course);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, targetSemesterId: string, sourceSemesterId: string) => {
    e.preventDefault();
    
    // Try to get drag data from the DegreeRequirementsSidebar first
    try {
      const externalData = e.dataTransfer.getData('text/plain');
      if (externalData) {
        const courseData = JSON.parse(externalData);
        if (courseData && courseData.code) {
          // Create a new course entry from the external data
          const newCourse: CourseEntry = {
            id: `course-${Date.now()}-${courseData.code}`,
            code: courseData.code,
            title: courseData.title,
            credits: Number(courseData.credits) || 4
          };
          
          // Add the course to the target semester
          setSemesters(prev => ({
            ...prev,
            [targetSemesterId]: [...(prev[targetSemesterId] || []), newCourse]
          }));
          return;
        }
      }
    } catch (error) {
      console.error('Error handling external course drop:', error);
    }
    
    // Handle internal dragging if no external data or if external data processing failed
    if (!draggedCourse) return;
    
    // Remove from source semester and add to target semester
    setSemesters(prev => {
      const newSemesters = {...prev};
      
      // Remove from source
      if (sourceSemesterId) {
        newSemesters[sourceSemesterId] = 
          prev[sourceSemesterId]?.filter(course => course.id !== draggedCourse.id) || [];
      }
      
      // Add to target
      newSemesters[targetSemesterId] = [...(prev[targetSemesterId] || []), draggedCourse];
      
      return newSemesters;
    });
    
    setDraggedCourse(null);
  };
  
  // Calculate summary statistics with proper type handling
  const summaryStats = useMemo(() => {
    // Flatten all courses from all semesters into a single array
    const allCourses = Object.values(semesters).flat();
    
    // Calculate total credits, ensuring numeric values
    const totalCredits = allCourses.reduce((sum, course) => {
      // Ensure the credits value is treated as a number
      const credits = typeof course.credits === 'number' ? course.credits : Number(course.credits) || 0;
      return sum + credits;
    }, 0);
    
    return {
      totalCourses: allCourses.length,
      totalCredits
    };
  }, [semesters]);
  
  return (
    <div className="space-y-8 mb-8">
      {years.map(year => (
        <div key={`year-${year}`} className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-primary-green">Year {year}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {semesterTypes.map(semester => {
              const semesterId = `${year}-${semester}`;
              const semesterCourses = semesters[semesterId] || [];
              
              return (
                <div 
                  key={semesterId} 
                  className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, semesterId, draggedCourse ? 
                    Object.keys(semesters).find(id => 
                      semesters[id]?.some(course => course.id === draggedCourse.id)
                    ) || '' : ''
                  )}
                >
                  <div className="flex justify-between items-center px-4 py-3 bg-gray-100 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800">{semester}</h3>
                    <button 
                      className="text-primary-blue w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded"
                      onClick={() => openCourseSelectionModal(year, semester)}
                      title="Add course"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-4 min-h-[120px]">
                    {semesterCourses.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">Drag courses here or click + to add</p>
                    ) : (
                      <div className="space-y-2">
                        {semesterCourses.map(course => (
                          <div 
                            key={course.id}
                            className="bg-blue-50 border border-blue-100 p-2 rounded text-gray-800 text-sm flex justify-between items-center cursor-grab active:cursor-grabbing shadow-sm hover:shadow"
                            draggable
                            onDragStart={() => handleDragStart(course)}
                          >
                            <div>
                              <div className="font-medium text-primary-blue">{course.code}</div>
                              <div className="text-xs text-gray-600">{course.title}</div>
                              <div className="text-xs text-primary-green font-medium mt-1">{course.credits} credits</div>
                            </div>
                            <button
                              className="text-gray-400 hover:text-red-500"
                              onClick={() => removeCourse(semesterId, course.id)}
                              title="Remove course"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className="mt-8 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
        <h3 className="font-bold mb-4 text-gray-800">Plan Summary</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-500 mb-1">Total Credits:</p>
            <p className="font-bold text-xl text-primary-blue">
              {summaryStats.totalCredits}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <p className="text-sm text-gray-500 mb-1">Total Courses:</p>
            <p className="font-bold text-xl text-primary-green">
              {summaryStats.totalCourses}
            </p>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Drag and drop courses between semesters to reorganize your plan.</p>
        </div>
      </div>
      
      {/* Course Selection Modal */}
      {selectedSemester && (
        <CourseSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectCourse={addCourseFromSelection}
          semesterTitle={`Year ${selectedSemester.year} ${selectedSemester.name}`}
        />
      )}
    </div>
  );
});

SemesterPlanner.displayName = 'SemesterPlanner';

export default SemesterPlanner; 