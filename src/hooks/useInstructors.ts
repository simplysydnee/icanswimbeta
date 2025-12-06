import { useQuery } from '@tanstack/react-query';
import { CACHE_TIMES } from '@/config/constants';

export interface Instructor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string;
}

async function fetchInstructors(): Promise<Instructor[]> {
  const response = await fetch('/api/instructors');

  if (!response.ok) {
    throw new Error('Failed to fetch instructors');
  }

  return response.json();
}

export function useInstructors() {
  return useQuery({
    queryKey: ['instructors'],
    queryFn: fetchInstructors,
    staleTime: CACHE_TIMES.LONG, // 10 minutes - instructors don't change often
  });
}