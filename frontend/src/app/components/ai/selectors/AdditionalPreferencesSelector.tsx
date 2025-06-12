"use client";

import React from 'react';

interface AdditionalPreferences {
  considerSeats: boolean;
  considerRMP: boolean;
}

interface AdditionalPreferencesSelectorProps {
  preferences: AdditionalPreferences;
  onChange: (preferences: AdditionalPreferences) => void;
}

const AdditionalPreferencesSelector: React.FC<AdditionalPreferencesSelectorProps> = ({
  preferences,
  onChange
}) => {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Preferences</h4>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Seat availability</span>
          <button 
            onClick={() => onChange({
              ...preferences,
              considerSeats: !preferences.considerSeats
            })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${preferences.considerSeats ? 'bg-primary-blue' : 'bg-gray-200'}`}
            role="switch"
            aria-checked={preferences.considerSeats}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${preferences.considerSeats ? 'translate-x-[24px]' : 'translate-x-[3px]'}`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Professor ratings</span>
          <button 
            onClick={() => onChange({
              ...preferences,
              considerRMP: !preferences.considerRMP
            })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${preferences.considerRMP ? 'bg-primary-blue' : 'bg-gray-200'}`}
            role="switch"
            aria-checked={preferences.considerRMP}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${preferences.considerRMP ? 'translate-x-[24px]' : 'translate-x-[3px]'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdditionalPreferencesSelector; 