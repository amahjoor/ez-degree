"use client";

import React from 'react';
import Select from 'react-select';
import { MajorSelectorProps, MajorOption } from './types';

const MajorSelector: React.FC<MajorSelectorProps> = ({
  loading,
  majors,
  selectedMajor,
  concentrations,
  selectedConcentration,
  onMajorChange,
  onConcentrationChange,
  showMajorSelect,
  setShowMajorSelect,
}) => {
  // Convert majors to react-select options format
  const majorOptions: MajorOption[] = majors.map((major) => ({
    value: major.id,
    label: major.name
  }));

  // Get the selected major name for display
  const selectedMajorName = selectedMajor 
    ? majors.find(m => m.id === selectedMajor)?.name || selectedMajor
    : "Select a Major";

  // Custom react-select styles
  const customSelectStyles = {
    control: (provided: any) => ({
      ...provided,
      borderColor: '#D1D5DB',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3B82F6'
      }
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
      color: state.isSelected ? 'white' : '#1F2937',
      cursor: 'pointer'
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
      width: 'calc(100% + 2rem)',
      margin: '0',
      borderRadius: '0 0 0.5rem 0.5rem',
      border: '1px solid #E5E7EB',
      borderTop: 'none',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      position: 'absolute',
      left: '-1rem',
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: '0.5rem 0',
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999
    })
  };

  const handleMajorChange = (selectedOption: MajorOption | null) => {
    if (selectedOption) {
      onMajorChange(selectedOption.value);
      onConcentrationChange(''); // Clear concentration when major changes
    } else {
      onMajorChange('');
    }
  };

  return (
    <>
      {!selectedMajor || showMajorSelect ? (
        <Select
          id="major-select"
          options={majorOptions}
          value={majorOptions.find(option => option.value === selectedMajor) || null}
          onChange={(option) => {
            handleMajorChange(option);
            if (option) {
              setShowMajorSelect(false);
            }
          }}
          placeholder="Select Program..."
          isDisabled={loading}
          isSearchable={true}
          isClearable={true}
          className="react-select-container"
          classNamePrefix="react-select"
          styles={{
            ...customSelectStyles,
            control: (provided) => ({
              ...provided,
              border: 'none',
              boxShadow: 'none',
              backgroundColor: 'transparent',
              minHeight: '1.5rem',
              paddingLeft: '0.5rem',
              '&:hover': {
                border: 'none'
              }
            }),
            valueContainer: (provided) => ({
              ...provided,
              padding: '0',
            }),
            input: (provided) => ({
              ...provided,
              fontSize: '1.125rem',
              fontWeight: '500',
              margin: '0',
              padding: '0',
            }),
            singleValue: (provided) => ({
              ...provided,
              fontSize: '1.125rem',
              fontWeight: '500',
              color: '#1F2937',
              margin: '0',
            }),
            placeholder: (provided) => ({
              ...provided,
              fontSize: '1.125rem',
              fontWeight: '500',
              color: '#4B5563',
              margin: '0',
            }),
            indicatorSeparator: () => ({
              display: 'none'
            }),
            dropdownIndicator: (provided) => ({
              ...provided,
              padding: '0 0 0 8px'
            })
          }}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
        />
      ) : (
        <div className="flex justify-between items-center pl-2">
          <h2 className="font-medium text-lg truncate">{selectedMajorName}</h2>
          <button 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => {
              onMajorChange("");
              onConcentrationChange("");
              setShowMajorSelect(true);
            }}
            title="Change program"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Concentration Selection Panel */}
      {showMajorSelect && selectedMajor && concentrations.length > 0 && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div>
            <label htmlFor="concentration-select" className="block text-sm font-medium text-gray-700 mb-1">
              Concentration (optional):
            </label>
            <select
              id="concentration-select"
              value={selectedConcentration}
              onChange={(e) => onConcentrationChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-blue focus:border-primary-blue"
              disabled={loading}
            >
              <option value="">-- All Requirements --</option>
              {concentrations.map((concentration) => (
                <option key={concentration.id} value={concentration.id}>
                  {concentration.name}
                </option>
              ))}
            </select>
            
            <div className="mt-4 flex justify-end">
              <button 
                className="font-medium py-2 px-4 rounded shadow bg-primary-blue hover:bg-blue-700 text-white"
                onClick={() => setShowMajorSelect(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MajorSelector; 