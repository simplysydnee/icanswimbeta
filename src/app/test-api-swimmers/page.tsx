'use client';

import { useState, useEffect } from 'react';
import type { Swimmer } from '@/types/booking';

export default function TestApiSwimmersPage() {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSwimmers() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/swimmers');

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Not authenticated. Please log in first.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSwimmers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching swimmers:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSwimmers();
  }, []);

  const handleTestFetch = async () => {
    try {
      const response = await fetch('/api/swimmers');
      const data = await response.json();
      console.log('API Response:', data);
      alert(`Check console for API response. Status: ${response.status}`);
    } catch (err) {
      console.error('Fetch error:', err);
      alert(`Fetch error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold">Test Swimmers API</h1>

      <div className="mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Test Command</h2>
        <pre className="mb-4 rounded bg-gray-100 p-4 text-sm">
          fetch('/api/swimmers').then(r =&gt; r.json()).then(console.log)
        </pre>
        <button
          onClick={handleTestFetch}
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Run Test in Console
        </button>
        <p className="mt-2 text-sm text-muted-foreground">
          Click above to run the test command. Check browser console for results.
        </p>
      </div>

      <div className="mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">API Response</h2>

        {loading && <p className="text-muted-foreground">Loading swimmers...</p>}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-800">Error: {error}</p>
            <p className="mt-2 text-sm text-red-600">
              This API requires authentication. Make sure you're logged in.
            </p>
          </div>
        )}

        {!loading && !error && swimmers.length === 0 && (
          <p className="text-muted-foreground">No swimmers found for your account.</p>
        )}

        {!loading && !error && swimmers.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {swimmers.length} swimmer{swimmers.length !== 1 ? 's' : ''}:
            </p>
            <div className="grid gap-4 md:grid-cols-1 md:grid-cols-2">
              {swimmers.map(swimmer => (
                <div key={swimmer.id} className="rounded-lg border p-4">
                  <h3 className="font-semibold">
                    {swimmer.firstName} {swimmer.lastName}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Status: {swimmer.enrollmentStatus}</p>
                    <p>Payment: {swimmer.paymentType}</p>
                    {swimmer.currentLevelName && (
                      <p>Level: {swimmer.currentLevelName}</p>
                    )}
                    {swimmer.fundingSourceId && (
                      <p className="text-blue-600">Authorized Client ({swimmer.fundingSourceShortName || 'Funding Source'})</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">API Details</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Endpoint:</strong> <code>GET /api/swimmers</code>
          </li>
          <li>
            <strong>Authentication:</strong> Required (parent role)
          </li>
          <li>
            <strong>Response Format:</strong> Array of Swimmer objects
          </li>
          <li>
            <strong>Fields:</strong> id, firstName, lastName, dateOfBirth, enrollmentStatus, etc.
          </li>
          <li>
            <strong>Database Join:</strong> Includes swim_levels.name as currentLevelName
          </li>
          <li>
            <strong>Case Conversion:</strong> snake_case → camelCase
          </li>
        </ul>
      </div>
    </div>
  );
}