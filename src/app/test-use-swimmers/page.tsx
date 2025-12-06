'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSwimmers } from '@/hooks/useSwimmers';
import { SwimmerCard } from '@/components/booking/SwimmerCard';
import { useState } from 'react';

// Create a client for React Query
const queryClient = new QueryClient();

function SwimmersTestContent() {
  const { data: swimmers, isLoading, error, refetch } = useSwimmers();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Log to console as requested
  console.log('Loading:', isLoading);
  console.log('Swimmers:', swimmers);
  console.log('Error:', error);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Hook Status</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Loading State</p>
            <p className={`text-lg font-semibold ${isLoading ? 'text-yellow-600' : 'text-green-600'}`}>
              {isLoading ? 'true' : 'false'}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Swimmer Count</p>
            <p className="text-lg font-semibold text-blue-600">
              {swimmers ? swimmers.length : '0'}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Error State</p>
            <p className={`text-lg font-semibold ${error ? 'text-red-600' : 'text-green-600'}`}>
              {error ? 'true' : 'false'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => refetch()}
            className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Refetch Data
          </button>
          <button
            onClick={() => {
              console.clear();
              console.log('Console cleared. Refetching...');
              refetch();
            }}
            className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Clear Console & Refetch
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-lg font-medium">Loading swimmers...</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check browser console for loading state
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="mb-2 font-semibold text-red-800">Error Loading Swimmers</h3>
          <p className="text-red-600">{error.message}</p>
          <p className="mt-2 text-sm text-red-600">
            Make sure you're logged in as a parent. The API requires authentication.
          </p>
        </div>
      )}

      {!isLoading && !error && swimmers && swimmers.length === 0 && (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-lg font-medium">No swimmers found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have any swimmers yet.
          </p>
        </div>
      )}

      {!isLoading && !error && swimmers && swimmers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Your Swimmers ({swimmers.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Click on a card to select/deselect
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {swimmers.map(swimmer => (
              <SwimmerCard
                key={swimmer.id}
                swimmer={swimmer}
                isSelected={selectedId === swimmer.id}
                onClick={() => {
                  setSelectedId(swimmer.id === selectedId ? null : swimmer.id);
                  console.log('Selected swimmer:', swimmer.firstName);
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Console Instructions</h2>
        <p className="mb-2 text-sm text-muted-foreground">
          Open browser console (F12) to see:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Loading state changes</li>
          <li>Swimmer data from API</li>
          <li>Any errors that occur</li>
          <li>Click events on swimmer cards</li>
        </ul>
        <div className="mt-4 rounded bg-gray-100 p-4">
          <pre className="text-sm">
            {`// Console output example:
Loading: true
Swimmers: null
Error: null

// After fetch:
Loading: false
Swimmers: [{...}, {...}]
Error: null`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function TestUseSwimmersPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto p-8">
        <h1 className="mb-6 text-3xl font-bold">useSwimmers Hook Test</h1>
        <p className="mb-8 text-muted-foreground">
          Testing the React Query hook for fetching swimmers data.
        </p>

        <SwimmersTestContent />

        <div className="mt-8 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Hook Details</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Hook:</strong> <code>useSwimmers()</code>
            </li>
            <li>
              <strong>Query Key:</strong> <code>['swimmers']</code>
            </li>
            <li>
              <strong>Stale Time:</strong> 5 minutes
            </li>
            <li>
              <strong>API Endpoint:</strong> <code>GET /api/swimmers</code>
            </li>
            <li>
              <strong>Authentication:</strong> Required (parent role)
            </li>
            <li>
              <strong>Returns:</strong> <code>{`{ data: Swimmer[], isLoading: boolean, error: Error }`}</code>
            </li>
          </ul>
        </div>
      </div>
    </QueryClientProvider>
  );
}