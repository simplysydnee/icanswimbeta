"use client";

import React from 'react';

export type ThreeStateValue = 'not_started' | 'in_progress' | 'mastered';
export type ThreeStateSize = 'xs' | 'sm' | 'md';

export interface ThreeStateSwitchProps {
  value: ThreeStateValue;
  onChange: (newValue: ThreeStateValue) => void;
  disabled?: boolean;
  size?: ThreeStateSize;
}

const ThreeStateSwitch: React.FC<ThreeStateSwitchProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'md',
}) => {
  const handleClick = (newValue: ThreeStateValue) => {
    if (!disabled) {
      onChange(newValue);
    }
  };

  const sizeClasses = {
    xs: 'text-xs max-w-[120px]',
    sm: 'text-xs max-w-[140px]',
    md: 'text-sm max-w-[180px]',
  };

  const getSegmentClasses = (segmentValue: ThreeStateValue) => {
    const baseClasses = `flex-1 text-center font-medium transition-all duration-200 ${
      size === 'xs' ? 'py-1 px-2 min-h-[32px]' :
      size === 'sm' ? 'py-2 px-2 min-h-[36px]' :
      'py-2 px-3 min-h-[44px]'
    }`;

    if (value === segmentValue) {
      // Selected segment - colored background
      switch (segmentValue) {
        case 'not_started':
          return `${baseClasses} bg-gray-300 text-gray-700`; // Using darker gray for better visibility
        case 'in_progress':
          return `${baseClasses} bg-amber-100 text-amber-700`;
        case 'mastered':
          return `${baseClasses} bg-green-100 text-green-700`;
        default:
          // This should never happen, but TypeScript needs it
          return `${baseClasses} bg-white text-gray-400`;
      }
    } else {
      // Unselected segment - white background
      return `${baseClasses} bg-white text-gray-400`;
    }
  };

  const getDisplayText = (segmentValue: ThreeStateValue) => {
    switch (segmentValue) {
      case 'not_started':
        return ''; // Empty for not_started
      case 'in_progress':
        return 'Emerging';
      case 'mastered':
        return 'Met';
      default:
        // This should never happen, but TypeScript needs it
        return '';
    }
  };

  return (
    <div className={`max-w-[180px] border border-gray-300 rounded-lg overflow-hidden bg-white ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="flex gap-px">
        <button
          type="button"
          onClick={() => handleClick('not_started')}
          className={getSegmentClasses('not_started')}
          disabled={disabled}
          aria-label="Not started"
          aria-pressed={value === 'not_started'}
        >
          {getDisplayText('not_started')}
        </button>

        <button
          type="button"
          onClick={() => handleClick('in_progress')}
          className={getSegmentClasses('in_progress')}
          disabled={disabled}
          aria-label="In progress"
          aria-pressed={value === 'in_progress'}
        >
          {getDisplayText('in_progress')}
        </button>

        <button
          type="button"
          onClick={() => handleClick('mastered')}
          className={getSegmentClasses('mastered')}
          disabled={disabled}
          aria-label="Mastered"
          aria-pressed={value === 'mastered'}
        >
          {getDisplayText('mastered')}
        </button>
      </div>
    </div>
  );
};

export default ThreeStateSwitch;