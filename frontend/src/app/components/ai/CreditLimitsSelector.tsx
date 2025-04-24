"use client";

import React from 'react';

interface CreditLimits {
  min: number;
  max: number;
}

interface CreditLimitsSelectorProps {
  creditLimits: CreditLimits;
  onChange: (creditLimits: CreditLimits) => void;
}

const CreditLimitsSelector: React.FC<CreditLimitsSelectorProps> = ({
  creditLimits,
  onChange
}) => {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Semester Credit Limits</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex h-10 w-full max-w-[110px] overflow-hidden rounded-md border border-gray-300 focus-within:border-primary-blue focus-within:ring-1 focus-within:ring-primary-blue">
            <div className="relative flex-grow">
              <input
                type="number"
                value={creditLimits.min}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (value <= creditLimits.max) {
                    onChange({
                      ...creditLimits,
                      min: value
                    });
                  }
                }}
                min="0"
                max="18"
                className="w-[85px] h-full pl-2 pr-12 py-2 border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">credits</span>
            </div>
            <div className="flex flex-col border-l border-gray-300">
              <button 
                type="button"
                className="h-5 px-2 hover:bg-gray-100 active:bg-gray-200 text-gray-600 focus:outline-none flex items-center justify-center"
                onClick={() => {
                  const newValue = creditLimits.min + 1;
                  if (newValue <= creditLimits.max) {
                    onChange({
                      ...creditLimits,
                      min: newValue
                    });
                  }
                }}
              >
                <span className="text-sm font-medium leading-none">+</span>
              </button>
              <div className="border-t border-gray-300"></div>
              <button 
                type="button"
                className="h-5 px-2 hover:bg-gray-100 active:bg-gray-200 text-gray-600 focus:outline-none flex items-center justify-center"
                onClick={() => {
                  const newValue = creditLimits.min - 1;
                  if (newValue >= 0) {
                    onChange({
                      ...creditLimits,
                      min: newValue
                    });
                  }
                }}
              >
                <span className="text-sm font-medium leading-none">−</span>
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-1">Minimum</div>
        </div>
        <div>
          <div className="flex h-10 w-full max-w-[110px] overflow-hidden rounded-md border border-gray-300 focus-within:border-primary-blue focus-within:ring-1 focus-within:ring-primary-blue">
            <div className="relative flex-grow">
              <input
                type="number"
                value={creditLimits.max}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (value >= creditLimits.min) {
                    onChange({
                      ...creditLimits,
                      max: value
                    });
                  }
                }}
                min="0"
                max="21"
                className="w-[85px] h-full pl-2 pr-12 py-2 border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-1 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">credits</span>
            </div>
            <div className="flex flex-col border-l border-gray-300">
              <button 
                type="button"
                className="h-5 px-2 hover:bg-gray-100 active:bg-gray-200 text-gray-600 focus:outline-none flex items-center justify-center"
                onClick={() => {
                  const newValue = creditLimits.max + 1;
                  if (newValue <= 21) {
                    onChange({
                      ...creditLimits,
                      max: newValue
                    });
                  }
                }}
              >
                <span className="text-sm font-medium leading-none">+</span>
              </button>
              <div className="border-t border-gray-300"></div>
              <button 
                type="button"
                className="h-5 px-2 hover:bg-gray-100 active:bg-gray-200 text-gray-600 focus:outline-none flex items-center justify-center"
                onClick={() => {
                  const newValue = creditLimits.max - 1;
                  if (newValue >= creditLimits.min) {
                    onChange({
                      ...creditLimits,
                      max: newValue
                    });
                  }
                }}
              >
                <span className="text-sm font-medium leading-none">−</span>
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-1">Maximum</div>
        </div>
      </div>
    </div>
  );
};

export default CreditLimitsSelector; 