import { useQuery } from '@tanstack/react-query';
import type { Swimmer } from '@/types/booking';

async function fetchSwimmers(): Promise<Swimmer[]> {
  const response = await fetch('/api/swimmers');

  if (!response.ok) {
    let errorMessage = 'Failed to fetch swimmers';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // ignore
    }
    console.error('Swimmers API error:', response.status, errorMessage);
    throw new Error(errorMessage);
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