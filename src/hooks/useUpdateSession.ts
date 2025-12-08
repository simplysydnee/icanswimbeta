import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateSessionRequest {
  start_time?: string;
  end_time?: string;
  instructor_id?: string;
}

interface UpdateSessionResponse {
  success: boolean;
  session: {
    id: string;
    start_time: string;
    end_time: string;
    instructor_id: string;
    [key: string]: unknown;
  };
}

async function updateSession(
  sessionId: string,
  data: UpdateSessionRequest
): Promise<UpdateSessionResponse> {
  const response = await fetch(`/api/admin/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update session');
  }

  return result;
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateSessionResponse,
    Error,
    { sessionId: string; data: UpdateSessionRequest }
  >({
    mutationFn: ({ sessionId, data }) => updateSession(sessionId, data),
    onSuccess: () => {
      // Invalidate draft sessions query when a session is updated
      queryClient.invalidateQueries({ queryKey: ['draft-sessions'] });

      // Also invalidate other session queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'admin'] });
    },
  });
}