"use client";

import React from 'react';

interface CampusLocations {
  fairfax: boolean;
  arlington: boolean;
  virtual: boolean;
}

interface CampusPreferencesSelectorProps {
  locations: CampusLocations;
  onChange: (locations: CampusLocations) => void;
}

const CampusPreferencesSelector: React.FC<CampusPreferencesSelectorProps> = ({
  locations,
  onChange
}) => {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Campus Preferences</h4>
      <div className="flex flex-wrap gap-2">
        {['fairfax', 'arlington', 'virtual'].map((location) => (
          <button
            key={location}
            onClick={() => onChange({
              ...locations,
              [location]: !locations[location as keyof typeof locations]
            })}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              locations[location as keyof typeof locations] 
                ? 'bg-primary-blue text-white' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            type="button"
          >
            {location.charAt(0).toUpperCase() + location.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CampusPreferencesSelector; 