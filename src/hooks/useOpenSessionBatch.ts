import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionGeneratorApi } from '@/lib/api-client';

export function useOpenSessionBatch() {
  const queryClient = useQueryClient();

  return useMutation<
    { updated: number },
    Error,
    string // batchId
  >({
    mutationFn: (batchId) => sessionGeneratorApi.openBatch(batchId),
    onSuccess: (result, batchId) => {
      // Invalidate session queries when batch is opened
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'batch', batchId] });

      // Also invalidate available sessions for parents
      queryClient.invalidateQueries({ queryKey: ['sessions', 'available'] });
    },
  });
}