import { useQuery } from '@tanstack/react-query';
import type { Swimmer } from '@/types/booking';

async function fetchSwimmers(): Promise<Swimmer[]> {
  const response = await fetch('/api/swimmers');

  if (!response.ok) {
    throw new Error('Failed to fetch swimmers');
  }

  return response.json();
}

export function useSwimmers() {
  return useQuery({
    queryKey: ['swimmers'],
    queryFn: fetchSwimmers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}