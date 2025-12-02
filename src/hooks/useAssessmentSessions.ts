'use client';

import { useState, useEffect } from 'react';
import { AssessmentSession } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';

export function useAssessmentSessions() {
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const availableSessions = await apiClient.getAvailableAssessmentSessions();
        setSessions(availableSessions);
        setError(null);
      } catch (err) {
        console.error('Error fetching assessment sessions:', err);
        setError('Failed to load available assessment sessions');
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const availableSessions = await apiClient.getAvailableAssessmentSessions();
      setSessions(availableSessions);
      setError(null);
    } catch (err) {
      console.error('Error refetching assessment sessions:', err);
      setError('Failed to load available assessment sessions');
    } finally {
      setLoading(false);
    }
  };

  return {
    sessions,
    loading,
    error,
    refetch,
  };
}