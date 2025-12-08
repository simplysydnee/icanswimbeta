import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteSessionsRequest {
  sessionIds: string[];
}

interface DeleteSessionsResponse {
  success: boolean;
  count: number;
}

async function deleteSessions(data: DeleteSessionsRequest): Promise<DeleteSessionsResponse> {
  const response = await fetch('/api/admin/sessions/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to delete sessions');
  }

  return result;
}

export function useDeleteSessions() {
  const queryClient = useQueryClient();

  return useMutation<DeleteSessionsResponse, Error, DeleteSessionsRequest>({
    mutationFn: deleteSessions,
    onSuccess: () => {
      // Invalidate draft sessions query when sessions are deleted
      queryClient.invalidateQueries({ queryKey: ['draft-sessions'] });

      // Also invalidate other session queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'admin'] });
    },
  });
}