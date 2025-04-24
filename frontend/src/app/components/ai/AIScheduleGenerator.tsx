"use client";

import React, { useState, useEffect } from 'react';
import ProfessorsToAvoidSelector from './selectors/ProfessorsToAvoidSelector';
import CourseSelector from './selectors/CourseSelector';
import CreditLimitsSelector from './selectors/CreditLimitsSelector';
import CampusPreferencesSelector from './selectors/CampusPreferencesSelector';
import AdditionalPreferencesSelector from './selectors/AdditionalPreferencesSelector';

// API configuration
const API_BASE_URL = '/api';

// Define ClassSession interface locally instead of importing it
interface ClassSession {
  id: string;
  courseCode: string;
  title: string;
  day: number; // 0-4 for Monday-Friday
  startTime: number; // Hour in 24h format (8-20)
  endTime: number; // Hour in 24h format (9-21)
  location: string;
  instructor: string;
  color: string;
  credits?: number;
}

// Define CourseInfo interface to match CourseSelector
interface CourseInfo {
  id: string;
  code: string;
  title: string;
}

interface SchedulePreferences {
  locations: {
    fairfax: boolean;
    arlington: boolean;
    virtual: boolean;
  };
  creditLimits: {
    min: number;
    max: number;
  };
  considerSeats: boolean;
  considerRMP: boolean;
  professorsToAvoid: string[];
}

interface AIScheduleGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: SchedulePreferences;
  setPreferences: React.Dispatch<React.SetStateAction<SchedulePreferences>>;
  onGenerateSchedule: (generatedClasses: ClassSession[]) => void;
  existingClasses?: ClassSession[];
}

const AIScheduleGenerator: React.FC<AIScheduleGeneratorProps> = ({
  isOpen,
  onClose,
  preferences,
  setPreferences,
  onGenerateSchedule,
  existingClasses = []
}) => {
  // State for tracking AI schedule generation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // State for selected courses in AI generator
  const [selectedCourses, setSelectedCourses] = useState<CourseInfo[]>([]);
  
  // Pre-populate selected courses from existingClasses when the modal opens
  useEffect(() => {
    if (isOpen && existingClasses.length > 0) {
      const coursesFromExisting = existingClasses.map(cls => ({
        id: cls.id,
        code: cls.courseCode,
        title: cls.title
      }));
      
      // Filter out any duplicates (by id)
      const uniqueCourses = coursesFromExisting.filter(
        (course, index, self) => index === self.findIndex(c => c.id === course.id)
      );
      
      setSelectedCourses(uniqueCourses);
    }
  }, [isOpen, existingClasses]);

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  // Handler functions for each preference component
  const handleCreditLimitsChange = (creditLimits: { min: number; max: number }) => {
    setPreferences(prev => ({
      ...prev,
      creditLimits
    }));
  };

  const handleCampusPreferencesChange = (locations: { fairfax: boolean; arlington: boolean; virtual: boolean }) => {
    setPreferences(prev => ({
      ...prev,
      locations
    }));
  };

  const handleAdditionalPreferencesChange = (additionalPrefs: { considerSeats: boolean; considerRMP: boolean }) => {
    setPreferences(prev => ({
      ...prev,
      considerSeats: additionalPrefs.considerSeats,
      considerRMP: additionalPrefs.considerRMP
    }));
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={(e) => {
        // Close modal when clicking the overlay
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">AI Schedule Generation</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Split into 2 columns - 50/50 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Classes You Want and Professors to Avoid */}
            <div className="space-y-6">
              {/* Classes You Want - using the CourseSelector component */}
              <CourseSelector 
                selectedCourses={selectedCourses}
                onChange={setSelectedCourses}
              />

              {/* Professors to Avoid */}
              <div>
                <ProfessorsToAvoidSelector
                  selectedProfessors={preferences.professorsToAvoid}
                  onChange={(professors) => setPreferences(prev => ({
                    ...prev,
                    professorsToAvoid: professors
                  }))}
                />
              </div>
            </div>

            {/* Right Column - All other preferences using component-based approach */}
            <div className="space-y-6">
              {/* Semester Credit Limits */}
              <CreditLimitsSelector 
                creditLimits={preferences.creditLimits}
                onChange={handleCreditLimitsChange}
              />

              {/* Campus Preferences */}
              <CampusPreferencesSelector 
                locations={preferences.locations}
                onChange={handleCampusPreferencesChange}
              />
              
              {/* Additional Preferences */}
              <AdditionalPreferencesSelector 
                preferences={{
                  considerSeats: preferences.considerSeats,
                  considerRMP: preferences.considerRMP
                }}
                onChange={handleAdditionalPreferencesChange}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => {
              setIsGenerating(true);
              // Simulate schedule generation
              setTimeout(() => {
                setIsGenerating(false);
                onClose();
                // TODO: This is where you would actually generate schedules with AI
                // and display the results
                onGenerateSchedule([]);
              }, 2000);
            }}
            disabled={isGenerating}
            className={`px-4 py-2 ${isGenerating ? 'bg-gray-400' : 'bg-primary-blue hover:bg-blue-600'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue flex items-center`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              "Generate Schedules"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIScheduleGenerator; 