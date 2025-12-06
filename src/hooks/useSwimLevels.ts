import { useQuery } from '@tanstack/react-query';
import { CACHE_TIMES } from '@/config/constants';

export interface SwimLevel {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  sequence: number;
}

async function fetchSwimLevels(): Promise<SwimLevel[]> {
  const response = await fetch('/api/swim-levels');

  if (!response.ok) {
    throw new Error('Failed to fetch swim levels');
  }

  return response.json();
}

export function useSwimLevels() {
  return useQuery({
    queryKey: ['swim-levels'],
    queryFn: fetchSwimLevels,
    staleTime: CACHE_TIMES.VERY_LONG, // 30 minutes - swim levels rarely change
  });
}