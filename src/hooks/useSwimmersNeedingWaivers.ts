import { useQuery } from '@tanstack/react-query';

export function useSwimmersNeedingWaivers(token: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['swimmers-needing-waivers', token],
    queryFn: async () => {
      const response = await fetch(`/api/waivers/swimmers?token=${token}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch swimmers');
      }

      return response.json();
    },
    enabled: enabled && !!token,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}