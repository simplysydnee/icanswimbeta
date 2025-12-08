import { useMutation, useQueryClient } from '@tanstack/react-query';

interface OpenSessionsRequest {
  sessionIds: string[];
}

interface OpenSessionsResponse {
  success: boolean;
  count: number;
}

async function openSessions(data: OpenSessionsRequest): Promise<OpenSessionsResponse> {
  const response = await fetch('/api/admin/sessions/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to open sessions');
  }

  return result;
}

export function useOpenSessions() {
  const queryClient = useQueryClient();

  return useMutation<OpenSessionsResponse, Error, OpenSessionsRequest>({
    mutationFn: openSessions,
    onSuccess: () => {
      // Invalidate draft sessions query when sessions are opened
      queryClient.invalidateQueries({ queryKey: ['draft-sessions'] });

      // Also invalidate other session queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'available'] });
    },
  });
}