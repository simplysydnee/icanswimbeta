"use client";

import React, { useState } from 'react';
import InlineNote from '@/components/staff-mode/InlineNote';

export default function TestInlineNotePage() {
  const [notes, setNotes] = useState<Record<string, string>>({
    empty: '',
    short: 'This is a short note',
    long: 'This is a very long note that exceeds the character limit and should show truncation in collapsed state',
    veryLong: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  });

  const handleSave = (key: string) => (note: string) => {
    setNotes(prev => ({ ...prev, [key]: note }));
    console.log(`Saved note for ${key}:`, note);
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">InlineNote Component Test</h1>

      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Test Cases</h2>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">1. Empty Note (Collapsed)</h3>
              <p className="text-sm text-gray-600 mb-2">Shows placeholder text "Add note..."</p>
              <InlineNote
                value={notes.empty}
                onSave={handleSave('empty')}
                placeholder="Add note..."
              />
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">2. Short Note (Collapsed)</h3>
              <p className="text-sm text-gray-600 mb-2">Shows full note text (under 25 chars)</p>
              <InlineNote
                value={notes.short}
                onSave={handleSave('short')}
                placeholder="Add note..."
              />
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">3. Long Note (Collapsed)</h3>
              <p className="text-sm text-gray-600 mb-2">Shows truncated text with "..." (over 25 chars)</p>
              <InlineNote
                value={notes.long}
                onSave={handleSave('long')}
                placeholder="Add note..."
              />
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">4. Very Long Note (Expanded shows character count)</h3>
              <p className="text-sm text-gray-600 mb-2">When expanded, shows character count for notes over 150 chars</p>
              <InlineNote
                value={notes.veryLong}
                onSave={handleSave('veryLong')}
                placeholder="Add note..."
              />
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">5. Custom Placeholder</h3>
              <p className="text-sm text-gray-600 mb-2">Uses custom placeholder text</p>
              <InlineNote
                value={null}
                onSave={handleSave('custom')}
                placeholder="Click to add a custom note..."
              />
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">6. Custom Max Length (50 chars)</h3>
              <p className="text-sm text-gray-600 mb-2">Limits input to 50 characters</p>
              <InlineNote
                value=""
                onSave={handleSave('limited')}
                placeholder="Add short note..."
                maxLength={50}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Interactive Demo</h2>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Try it out:</h3>
            <p className="text-sm text-gray-600 mb-4">
              Click on any note to edit. Press Enter to save, Escape to cancel, or click outside to save.
            </p>
            <div className="space-y-3">
              <InlineNote
                value=""
                onSave={(note) => {
                  console.log('Demo note saved:', note);
                  alert(`Note saved: "${note}"`);
                }}
                placeholder="Click me to add a note..."
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Behavior Notes</h2>
          <div className="p-4 border rounded-lg bg-gray-50">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                <span><strong>Collapsed Empty:</strong> Shows 💬 icon + placeholder text in gray</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                <span><strong>Collapsed with Note:</strong> Shows 💬 icon + truncated note (max 25 chars)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                <span><strong>Expanded:</strong> Text input with auto-focus, border, and save button (✓)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                <span><strong>Character Count:</strong> Shows when note exceeds 150 characters</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                <span><strong>Keyboard Shortcuts:</strong> Enter = save, Escape = cancel</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                <span><strong>Blur Behavior:</strong> Clicking outside saves the note</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                <span><strong>Whitespace:</strong> Trims whitespace before saving</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                <span><strong>Optimized Updates:</strong> Only calls onSave if value actually changed</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}