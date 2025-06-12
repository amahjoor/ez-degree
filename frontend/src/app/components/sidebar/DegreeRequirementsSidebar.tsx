"use client";

import React, { useState, useEffect } from 'react';
import { Major, Concentration, Requirements } from '@/types/course';
import { SkeletonList, SkeletonCard } from '../ui';
import MajorSelector from './MajorSelector';
import CourseOverlay from './CourseOverlay';
import RequirementsList from './RequirementsList';
import { DegreeRequirementsSidebarProps, RequirementGroup, Requirement } from './types';
import type { ClassSession } from '../SemesterCalendar';

// API configuration
const API_BASE_URL = '/api';

const DegreeRequirementsSidebar: React.FC<DegreeRequirementsSidebarProps> = ({
  isApiAvailable,
  onApiConnectionRetry,
  onCourseSelect,
  onAddSessions,
  currentSemester,
  availableDays,
  dayTimeRanges,
}) => {
  const [loading, setLoading] = useState(false);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [selectedConcentration, setSelectedConcentration] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [requirementsError, setRequirementsError] = useState<string>('');
  const [requirementGroups, setRequirementGroups] = useState<RequirementGroup[]>([]);
  const [showMajorSelect, setShowMajorSelect] = useState<boolean>(true);
  
  // Course overlay state
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');

  // Fetch majors on component mount
  useEffect(() => {
    if (!isApiAvailable) return;
    
    async function fetchMajors() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/requirements/majors`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Major requirements API endpoint not found');
          } else {
            throw new Error(`Failed to fetch majors: ${response.statusText}`);
          }
        }
        const data = await response.json();
        setMajors(data.majors);
      } catch (error) {
        console.error('Error fetching majors:', error);
        setRequirementsError('Error connecting to the requirements API. Please ensure the server is running.');
      } finally {
        setLoading(false);
      }
    }

    fetchMajors();
  }, [isApiAvailable]);

  // Fetch concentrations when a major is selected
  useEffect(() => {
    if (!selectedMajor || !isApiAvailable) {
      setConcentrations([]);
      setSelectedConcentration('');
      return;
    }

    async function fetchConcentrations() {
      try {
        const response = await fetch(`${API_BASE_URL}/requirements/majors/${selectedMajor}/concentrations`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setConcentrations([]);
            return;
          } else {
            throw new Error(`Failed to fetch concentrations: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        setConcentrations(data.concentrations || []);
      } catch (error) {
        console.error('Error fetching concentrations:', error);
        setConcentrations([]);
      }
    }

    fetchConcentrations();
  }, [selectedMajor, isApiAvailable]);

  // Fetch requirements for selected major
  useEffect(() => {
    if (!selectedMajor || !isApiAvailable) return;

    async function fetchRequirements() {
      setLoading(true);
      setRequirementsError('');
      
      try {
        let url = `${API_BASE_URL}/requirements/majors/${selectedMajor}`;
        if (selectedConcentration) {
          url += `?concentration_id=${selectedConcentration}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Requirements for ${selectedMajor} not found`);
          } else {
            throw new Error(`Failed to fetch requirements: ${response.statusText}`);
          }
        }
        const data = await response.json();
        setRequirements(data);
        
        // Convert API requirements to our sidebar format
        const convertedGroups: RequirementGroup[] = data.categories.map((category: any) => ({
          title: category.name,
          isOpen: false,
          requirements: category.courses.map((course: any) => ({
            id: course.code,
            title: `${course.code} - ${course.title}`,
            completed: false,
            credits: course.credits
          }))
        }));
        
        setRequirementGroups(convertedGroups);
      } catch (error: any) {
        setRequirementsError(error.message || 'Error loading requirements. Please try again later.');
        console.error('Error fetching requirements:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequirements();
  }, [selectedMajor, selectedConcentration, isApiAvailable]);

  const handleGroupToggle = (index: number) => {
    const updatedGroups = [...requirementGroups];
    updatedGroups[index].isOpen = !updatedGroups[index].isOpen;
    setRequirementGroups(updatedGroups);
  };

  const handleOptionSelect = (groupIndex: number, option: string) => {
    const updatedGroups = [...requirementGroups];
    updatedGroups[groupIndex].selectedOption = option;
    setRequirementGroups(updatedGroups);
  };

  const handleRequirementClick = (requirement: Requirement, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    const rect = event.currentTarget.getBoundingClientRect();
    setOverlayPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    
    setSelectedCourseCode(requirement.id);
    setOverlayVisible(true);
  };

  const handleRequirementDragStart = (e: React.DragEvent, requirement: Requirement) => {
    const courseData = {
      code: requirement.id,
      title: requirement.title.replace(`${requirement.id} - `, ''),
      credits: requirement.credits || 4
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(courseData));
    e.dataTransfer.setData('application/course-drag', requirement.id); // Set the actual course code
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Fixed header */}
      <div className="px-4 py-3 bg-blue-50 text-gray-800 border-b border-blue-100 flex-shrink-0 relative">
        <MajorSelector
          loading={loading}
          majors={majors}
          selectedMajor={selectedMajor}
          concentrations={concentrations}
          selectedConcentration={selectedConcentration}
          onMajorChange={setSelectedMajor}
          onConcentrationChange={setSelectedConcentration}
          showMajorSelect={showMajorSelect}
          setShowMajorSelect={setShowMajorSelect}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <RequirementsList
          loading={loading}
          requirementsError={requirementsError}
          requirementGroups={requirementGroups}
          requirements={requirements}
          showMajorSelect={showMajorSelect}
          onGroupToggle={handleGroupToggle}
          onOptionSelect={handleOptionSelect}
          onRequirementClick={handleRequirementClick}
          onRequirementDragStart={handleRequirementDragStart}
        />
      </div>
      
      {/* Course overlay */}
      {overlayVisible && (
  <CourseOverlay
        courseCode={selectedCourseCode}
        position={overlayPosition}
        onClose={() => setOverlayVisible(false)}
        onAddSessions={onAddSessions}      // ← pass through with term info
        currentSemester={currentSemester}  // ← pass current semester
        availableDays={availableDays}
        dayTimeRanges={dayTimeRanges}
      />
    )}
    </div>
  );
};

export default DegreeRequirementsSidebar; 