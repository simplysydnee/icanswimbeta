import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionGeneratorApi } from '@/lib/api-client';
import type { GenerateSessionsRequest, GenerateSessionsResponse } from '@/types/session-generator';

export function useGenerateSessions() {
  const queryClient = useQueryClient();

  return useMutation<
    GenerateSessionsResponse,
    Error,
    GenerateSessionsRequest
  >({
    mutationFn: (data) => sessionGeneratorApi.generate(data),
    onSuccess: (result) => {
      // Invalidate relevant queries when sessions are generated
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'admin'] });

      // If we have a batch ID, we could also set up optimistic updates
      // for batch-specific queries
      if (result.batchId) {
        queryClient.setQueryData(['sessions', 'batch', result.batchId], result);
      }
    },
  });
}