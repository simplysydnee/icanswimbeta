"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';

export interface InlineNoteProps {
  value: string | null | undefined;
  onSave: (note: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const InlineNote: React.FC<InlineNoteProps> = ({
  value,
  onSave,
  placeholder = 'Add note...',
  maxLength = 500,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [originalValue, setOriginalValue] = useState(value || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(value || '');
    setOriginalValue(value || '');
  }, [value]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleSave = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue !== originalValue.trim()) {
      onSave(trimmedValue);
    }
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setInputValue(originalValue);
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const truncatedNote = inputValue.length > 25
    ? `${inputValue.substring(0, 25)}...`
    : inputValue;

  const hasNote = inputValue.trim().length > 0;

  if (isExpanded) {
    return (
      <div className="relative w-full">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-500">
            {inputValue.length}/{maxLength} characters
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-3 text-sm min-h-[44px] border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-3 text-sm min-h-[44px] bg-blue-500 text-white rounded hover:bg-blue-600"
              aria-label="Save note"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed state
  return (
    <button
      type="button"
      onClick={handleExpand}
      className="flex items-center gap-2 h-11 min-h-[44px] px-4 w-full text-left rounded-md hover:bg-gray-50 transition-colors"
    >
      <MessageSquare size={18} className="text-gray-400 flex-shrink-0" />
      {hasNote ? (
        <span className="text-gray-600 text-sm truncate">{truncatedNote}</span>
      ) : (
        <span className="text-gray-400 text-sm">{placeholder}</span>
      )}
    </button>
  );
};

export default InlineNote;