import { useQuery } from '@tanstack/react-query';

interface TokenValidation {
  valid: boolean;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  error?: string;
}

export function useWaiverToken(token: string | null) {
  return useQuery({
    queryKey: ['waiver-token', token],
    queryFn: async (): Promise<TokenValidation> => {
      if (!token) throw new Error('No token provided');

      const response = await fetch('/api/waivers/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Token validation failed');
      }

      return response.json();
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity // Token validation doesn't change
  });
}