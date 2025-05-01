"use client";

import React, { useState, useRef, useEffect } from 'react';

interface Suggestion {
  name: string;
  qualityRating: string;  // e.g. "4.2"
  ratingCount: string;    // e.g. "123"
  category: 'Lecture' | 'Laboratory';
}

interface ProfessorsToAvoidSelectorProps {
  suggestions: Suggestion[];
  selectedProfessors: string[];
  onChange: (professors: string[]) => void;
  disabled?: boolean;
}

const getRatingBgClass = (rating: number) => {
  if (rating < 2)   return 'bg-red-200 text-gray-800';
  if (rating < 3)   return 'bg-yellow-200 text-gray-800';
  if (rating < 4)   return 'bg-green-200 text-gray-800';
  /* 4–5: dark green with white text */
  return 'bg-green-600 text-white';
};

const ProfessorsToAvoidSelector: React.FC<ProfessorsToAvoidSelectorProps> = ({
  suggestions,
  selectedProfessors,
  onChange,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click‐outside => hide dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showDropdown &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Only show suggestions not already picked
  const available = suggestions.filter(
    s => !selectedProfessors.includes(s.name)
  );

  // If empty box, show all; else filter by name
  const shown = searchTerm.trim() === ''
    ? available
    : available.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const addProf = (name: string) => {
    onChange([...selectedProfessors, name]);
    setSearchTerm('');
    // keep dropdown open in case they want to add more
  };

  return (
    <div ref={containerRef} className="relative">
      <h4 className="text-sm font-medium text-gray-700 mb-2">
        Professors to Avoid
      </h4>

      <input
        type="text"
        value={searchTerm}
        placeholder={disabled ? 'Pick a course first' : 'Type professor…'}
        disabled={disabled}
        onFocus={() => !disabled && setShowDropdown(true)}
        onChange={e => {
          setSearchTerm(e.target.value);
          if (!showDropdown) setShowDropdown(true);
        }}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-primary-blue'
        }`}
      />

      {!disabled && showDropdown && shown.length > 0 && (
        <div className="absolute z-10 left-0 right-0 bg-white border rounded-md max-h-60 overflow-auto mt-1">
          {(['Lecture', 'Laboratory'] as const).map(cat => {
            const group = shown.filter(s => s.category === cat);
            if (!group.length) return null;
            return (
              <div key={cat}>
                <div className="px-3 py-1 bg-gray-100 font-medium">
                  {cat}
                </div>
                {group.map(s => {
                  const ratingNum = parseFloat(s.qualityRating) || 0;
                  return (
                    <div
                      key={s.name}
                      onMouseDown={() => addProf(s.name)}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <span>Rating:</span>
                          <span
                            className={`px-1 rounded ${getRatingBgClass(ratingNum)}`}
                          >
                            {s.qualityRating}
                          </span>
                          <span>({s.ratingCount})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {selectedProfessors.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedProfessors.map(name => (
            <span
              key={name}
              className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-sm flex items-center"
            >
              {name}
              <button
                onClick={() =>
                  onChange(selectedProfessors.filter(p => p !== name))
                }
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessorsToAvoidSelector;
