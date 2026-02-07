"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Check } from 'lucide-react';

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
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
        <div className="absolute right-10 top-2 text-xs text-gray-500">
          {inputValue.length}/{maxLength}
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="absolute right-2 top-2 text-gray-600 hover:text-gray-900"
          aria-label="Save note"
        >
          <Check size={16} />
        </button>
      </div>
    );
  }

  // Collapsed state
  return (
    <button
      type="button"
      onClick={handleExpand}
      className="flex items-center gap-2 h-8 px-3 w-full text-left rounded-md hover:bg-gray-50 transition-colors"
    >
      <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
      {hasNote ? (
        <span className="text-gray-600 text-sm truncate">{truncatedNote}</span>
      ) : (
        <span className="text-gray-400 text-sm">{placeholder}</span>
      )}
    </button>
  );
};

export default InlineNote;