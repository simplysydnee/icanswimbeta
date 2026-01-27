"use client";

import React, { useState } from 'react';
import ThreeStateSwitch, { ThreeStateValue } from './ThreeStateSwitch';

const TestComponent: React.FC = () => {
  const [value, setValue] = useState<ThreeStateValue>('not_started');
  const [disabled, setDisabled] = useState(false);
  const [size, setSize] = useState<'sm' | 'md'>('md');

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">ThreeStateSwitch Test</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Current State: {value}</h2>
          <ThreeStateSwitch
            value={value}
            onChange={setValue}
            disabled={disabled}
            size={size}
          />
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Test Controls:</h3>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => setDisabled(e.target.checked)}
                className="rounded"
              />
              <span>Disabled</span>
            </label>

            <div className="flex items-center space-x-2">
              <span>Size:</span>
              <button
                onClick={() => setSize('sm')}
                className={`px-3 py-1 rounded ${size === 'sm' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                Small
              </button>
              <button
                onClick={() => setSize('md')}
                className={`px-3 py-1 rounded ${size === 'md' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
              >
                Medium
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setValue('not_started')}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded"
            >
              Set to (empty)
            </button>
            <button
              onClick={() => setValue('in_progress')}
              className="px-3 py-1 bg-amber-100 text-amber-700 rounded"
            >
              Set to Emerging
            </button>
            <button
              onClick={() => setValue('mastered')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded"
            >
              Set to Met
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">All States Preview:</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">not_started (empty) - LEFT segment should be gray:</span>
              <ThreeStateSwitch value="not_started" onChange={() => {}} />
            </div>
            <div>
              <span className="text-sm text-gray-600">in_progress (Emerging) - MIDDLE segment should be amber:</span>
              <ThreeStateSwitch value="in_progress" onChange={() => {}} />
            </div>
            <div>
              <span className="text-sm text-gray-600">mastered (Met) - RIGHT segment should be green:</span>
              <ThreeStateSwitch value="mastered" onChange={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;