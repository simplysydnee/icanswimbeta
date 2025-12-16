import { useQuery } from '@tanstack/react-query';

export interface SwimmerMetrics {
  totalSwimmers: number;
  waitlistedSwimmers: number;
  activeEnrolledSwimmers: number;
  averageLessons: number;
  vmrcClients: number;
  lastUpdated: string;
}

async function fetchSwimmerMetrics(): Promise<SwimmerMetrics> {
  const response = await fetch('/api/admin/swimmers/metrics');

  if (!response.ok) {
    throw new Error('Failed to fetch swimmer metrics');
  }

  return response.json();
}

export function useSwimmerMetrics() {
  return useQuery({
    queryKey: ['swimmer-metrics'],
    queryFn: fetchSwimmerMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });
}