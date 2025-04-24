"use client";

import React, { useState } from 'react';

// API configuration
const API_BASE_URL = '/api';

interface ProfessorInfo {
  id: string;
  name: string;
  department: string;
  rating: number | null;
}

interface ProfessorsToAvoidSelectorProps {
  selectedProfessors: string[];
  onChange: (professors: string[]) => void;
}

const ProfessorsToAvoidSelector: React.FC<ProfessorsToAvoidSelectorProps> = ({
  selectedProfessors,
  onChange
}) => {
  // State for professor search
  const [professorSearchTerm, setProfessorSearchTerm] = useState<string>("");
  const [professorSearchResults, setProfessorSearchResults] = useState<ProfessorInfo[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleAddProfessor = (professor: ProfessorInfo) => {
    if (!selectedProfessors.includes(professor.name)) {
      onChange([...selectedProfessors, professor.name]);
    }
    setProfessorSearchTerm("");
    setProfessorSearchResults([]);
  };

  const handleRemoveProfessor = (professorName: string) => {
    onChange(selectedProfessors.filter(p => p !== professorName));
  };

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
        Professors to Avoid
        <div className="relative ml-1 group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute left-0 -bottom-1 transform translate-y-full w-64 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
            The AI will avoid scheduling classes with these professors when possible.
          </div>
        </div>
      </h4>
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={professorSearchTerm}
            onChange={(e) => {
              setProfessorSearchTerm(e.target.value);
              const searchValue = e.target.value.trim();
              if (searchValue.length > 2) {
                setIsSearching(true);
                setSearchError(null);
                
                // Debounce the API call
                const timeoutId = setTimeout(() => {
                  // Use the real API endpoint for professors
                  const fetchProfessors = async () => {
                    try {
                      // Use the same API structure as the course search
                      const url = `${API_BASE_URL}/professors/?search=${encodeURIComponent(searchValue)}&limit=10`;
                      const response = await fetch(url);
                      
                      if (!response.ok) {
                        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                      }
                      
                      const data = await response.json();
                      // Format professors to match our state structure
                      const formattedProfessors = data.professors?.map((prof: any) => ({
                        id: prof.id || `${prof.lastName}_${prof.firstName}`.toLowerCase(),
                        name: `${prof.firstName} ${prof.lastName}`,
                        department: prof.department || '',
                        rating: prof.averageRating || null
                      })) || [];
                      
                      setProfessorSearchResults(formattedProfessors);
                    } catch (err) {
                      console.error("Error fetching professors:", err);
                      setSearchError("Failed to fetch professors");
                      
                      // Fallback to mock data in case the API isn't available
                      const mockProfessors = [
                        { id: 'smith_john', name: 'John Smith', department: 'Computer Science', rating: 4.2 },
                        { id: 'doe_jane', name: 'Jane Doe', department: 'Mathematics', rating: 3.8 },
                        { id: 'johnson_robert', name: 'Robert Johnson', department: 'Physics', rating: 4.5 },
                        { id: 'williams_mary', name: 'Mary Williams', department: 'Biology', rating: 4.0 },
                      ].filter(prof => prof.name.toLowerCase().includes(searchValue.toLowerCase()));
                      
                      setProfessorSearchResults(mockProfessors);
                    } finally {
                      setIsSearching(false);
                    }
                  };
                  
                  fetchProfessors();
                }, 300);
                
                return () => clearTimeout(timeoutId);
              } else {
                setProfessorSearchResults([]);
                setIsSearching(false);
              }
            }}
            placeholder="Search professors..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-blue"
          />
          {professorSearchTerm.trim().length > 2 && (
            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-40 overflow-y-auto">
              {isSearching ? (
                <div className="flex justify-center items-center p-4">
                  <svg className="animate-spin h-5 w-5 text-primary-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : searchError ? (
                <div className="p-3 text-sm text-red-500 text-center">
                  {searchError}
                </div>
              ) : professorSearchResults.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No professors found matching "{professorSearchTerm}"
                </div>
              ) : (
                professorSearchResults.map(professor => (
                  <div 
                    key={professor.id}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => handleAddProfessor(professor)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-700">{professor.name}</div>
                        {professor.department && (
                          <div className="text-xs text-gray-500">{professor.department}</div>
                        )}
                      </div>
                      {professor.rating && (
                        <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-medium text-yellow-700">{professor.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        {selectedProfessors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedProfessors.map(professor => (
              <div 
                key={professor} 
                className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-sm flex items-center border border-red-100"
              >
                <span className="mr-1">{professor}</span>
                <button
                  onClick={() => handleRemoveProfessor(professor)}
                  className="text-red-400 hover:text-red-600"
                  aria-label={`Remove ${professor}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessorsToAvoidSelector; 