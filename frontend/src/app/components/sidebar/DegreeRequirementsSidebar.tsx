"use client";

import React, { useState, useEffect } from 'react';
import { Major, Concentration, Requirements, ParsedMajorData, ParsedRequirementGroup, ProgramTypeFilter } from '@/types/course';
import { SkeletonList, SkeletonCard } from '../ui';
import MajorSelector from './MajorSelector';
import CourseOverlay from './CourseOverlay';
import RequirementsList from './RequirementsList';
import { DegreeRequirementsSidebarProps, RequirementGroup, Requirement } from './types';
import type { ClassSession } from '../SemesterCalendar';
import { majorDataService } from '@/utils/majorDataService';

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
  const [programs, setPrograms] = useState<ParsedMajorData[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [selectedConcentration, setSelectedConcentration] = useState<string>('');
  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [requirementsError, setRequirementsError] = useState<string>('');
  const [requirementGroups, setRequirementGroups] = useState<RequirementGroup[]>([]);
  const [showMajorSelect, setShowMajorSelect] = useState<boolean>(true);
  
  // New state for enhanced functionality
  const [programTypeFilter, setProgramTypeFilter] = useState<ProgramTypeFilter>({
    undergraduate: true,
    graduate: true,
    major: true,
    minor: true,
    certificate: true
  });
  const [selectedProgramTypes, setSelectedProgramTypes] = useState<string[]>(['Major']);
  
  // Helper function to convert string concentrations to Concentration objects
  const stringToConcentrations = (names: string[]): Concentration[] => {
    return names.map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name
    }));
  };
  
  // Course overlay state
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>('');

  // Fetch programs on component mount
  useEffect(() => {
    async function fetchPrograms() {
      try {
        setLoading(true);
        setRequirementsError('');
        
        // Load all programs from local data
        const allPrograms = await majorDataService.getAllPrograms();
        setPrograms(allPrograms);
        
        // Filter for majors to maintain backward compatibility
        const majorPrograms = allPrograms.filter(p => p.programType === 'Major');
        const majorData: Major[] = majorPrograms.map(program => ({
          id: program.banner,
          name: program.name,
          college: program.college,
          degree_type: program.degreeType
        }));
        setMajors(majorData);
        
      } catch (error) {
        console.error('Error fetching programs:', error);
        setRequirementsError('Error loading program data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, []);

  // Fetch concentrations when a major is selected
  useEffect(() => {
    if (!selectedMajor) {
      setConcentrations([]);
      setSelectedConcentration('');
      return;
    }

    async function fetchConcentrations() {
      try {
        // Find the selected program
        const program = programs.find(p => p.banner === selectedMajor || p.name === selectedMajor);
        if (program && program.concentrations.length > 0) {
          const concentrationData = stringToConcentrations(program.concentrations);
          setConcentrations(concentrationData);
        } else {
          setConcentrations([]);
        }
      } catch (error) {
        console.error('Error fetching concentrations:', error);
        setConcentrations([]);
      }
    }

    fetchConcentrations();
  }, [selectedMajor, programs]);

  // Fetch requirements for selected major
  useEffect(() => {
    if (!selectedMajor) return;

    async function fetchRequirements() {
      setLoading(true);
      setRequirementsError('');
      
      try {
        // Find the selected program
        const program = programs.find(p => p.banner === selectedMajor || p.name === selectedMajor);
        if (!program) {
          throw new Error(`Program ${selectedMajor} not found`);
        }
        
        // Get requirements, filtering by concentration if selected
        const requirementGroups = await majorDataService.getProgramRequirements(
          program.name, 
          selectedConcentration || undefined
        );
        
        // Convert to sidebar format
        const convertedGroups: RequirementGroup[] = requirementGroups.map((group: ParsedRequirementGroup) => ({
          title: group.title,
          isOpen: false,
          requirements: group.courses.map(course => ({
            id: course.code,
            title: `${course.code} - ${course.name}`,
            completed: false,
            credits: course.credits || undefined
          }))
        }));
        
        setRequirementGroups(convertedGroups);
        
        // Create a requirements object for backward compatibility
        setRequirements({
          degree_name: program.name,
          total_credits: parseInt(program.totalCredits) || 120,
          categories: convertedGroups.map(group => ({
            name: group.title,
            total_credits: 0, // Will be calculated or provided by the parsed data
            courses: group.requirements?.map(req => ({
              code: req.id,
              title: req.title.replace(`${req.id} - `, ''),
              credits: req.credits || 0,
              alternatives: [],
              prerequisites: '',
              corequisites: ''
            })) || []
          }))
        });
        
      } catch (error: any) {
        setRequirementsError(error.message || 'Error loading requirements. Please try again later.');
        console.error('Error fetching requirements:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRequirements();
  }, [selectedMajor, selectedConcentration, programs]);

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