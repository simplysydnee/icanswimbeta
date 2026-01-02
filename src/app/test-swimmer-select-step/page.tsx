'use client';

import { useState } from 'react';
import { SwimmerSelectStep } from '@/components/booking/steps/SwimmerSelectStep';
import type { Swimmer } from '@/types/booking';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for React Query
const queryClient = new QueryClient();

function SwimmerSelectStepDemo() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectionHistory, setSelectionHistory] = useState<Swimmer[]>([]);

  const handleSelectSwimmer = (swimmer: Swimmer) => {
    setSelectedId(swimmer.id);
    console.log('Selected:', swimmer);

    // Add to selection history
    setSelectionHistory(prev => {
      // Remove if already in history
      const filtered = prev.filter(s => s.id !== swimmer.id);
      // Add to beginning
      return [swimmer, ...filtered].slice(0, 5); // Keep last 5 selections
    });
  };

  const handleClearSelection = () => {
    setSelectedId(null);
    console.log('Selection cleared');
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Current Selection</h2>
        {selectedId ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Swimmer selected</p>
              <p className="text-sm text-muted-foreground">
                ID: {selectedId}
              </p>
            </div>
            <button
              onClick={handleClearSelection}
              className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
            >
              Clear Selection
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground">No swimmer selected yet</p>
        )}
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Swimmer Selection Step</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          This is the first step of the booking wizard. Select a swimmer to continue.
        </p>

        <SwimmerSelectStep
          selectedSwimmerId={selectedId}
          onSelectSwimmer={handleSelectSwimmer}
        />
      </div>

      {selectionHistory.length > 0 && (
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Selection History</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Last {selectionHistory.length} selection{selectionHistory.length !== 1 ? 's' : ''} (check console for details)
          </p>
          <div className="space-y-2">
            {selectionHistory.map((swimmer, index) => (
              <div
                key={`${swimmer.id}-${index}`}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">
                    {swimmer.firstName} {swimmer.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Status: {swimmer.enrollmentStatus}</span>
                    <span>•</span>
                    <span>Payment: {swimmer.paymentType}</span>
                    {swimmer.hasFundingAuthorization && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600">Funded</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedId(swimmer.id);
                    console.log('Reselected:', swimmer);
                  }}
                  className="rounded bg-primary/10 px-3 py-1 text-sm text-primary hover:bg-primary/20"
                >
                  Select Again
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Component Usage</h2>
        <pre className="rounded bg-gray-100 p-4 text-sm">
{`import { SwimmerSelectStep } from '@/components/booking/steps/SwimmerSelectStep';
import { useState } from 'react';
import { Swimmer } from '@/types/booking';

// In component:
const [selectedId, setSelectedId] = useState<string | null>(null);

<SwimmerSelectStep
  selectedSwimmerId={selectedId}
  onSelectSwimmer={(swimmer: Swimmer) => {
    setSelectedId(swimmer.id);
    console.log('Selected:', swimmer);
  }}
/>`}
        </pre>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-1 md:grid-cols-2">
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-800">Props</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li><code>selectedSwimmerId: string | null</code></li>
              <li><code>onSelectSwimmer: (swimmer: Swimmer) =&gt; void</code></li>
            </ul>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <h3 className="mb-2 font-semibold text-green-800">Features</h3>
            <ul className="space-y-1 text-sm text-green-700">
              <li>Fetches parent's swimmers from API</li>
              <li>Groups by enrollment status</li>
              <li>Loading, error, empty states</li>
              <li>Selection highlighting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestSwimmerSelectStepPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto p-8">
        <h1 className="mb-6 text-3xl font-bold">SwimmerSelectStep Test</h1>
        <p className="mb-8 text-muted-foreground">
          Testing the first step of the booking wizard with real data and selection handling.
        </p>

        <SwimmerSelectStepDemo />

        <div className="mt-8 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Testing Instructions</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>Open browser console</strong> (F12) to see selection logs
            </li>
            <li>
              <strong>Click on swimmer cards</strong> to select/deselect
            </li>
            <li>
              <strong>Observe different states:</strong> loading, error, empty, success
            </li>
            <li>
              <strong>Check selection history</strong> to see previous selections
            </li>
            <li>
              <strong>Use "Select Again" buttons</strong> to reselect from history
            </li>
          </ol>
        </div>
      </div>
    </QueryClientProvider>
  );
}