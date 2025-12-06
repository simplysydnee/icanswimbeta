import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionGeneratorApi } from '@/lib/api-client';

export function useDeleteSessionBatch() {
  const queryClient = useQueryClient();

  return useMutation<
    { deleted: number },
    Error,
    string // batchId
  >({
    mutationFn: (batchId) => sessionGeneratorApi.deleteBatch(batchId),
    onSuccess: (result, batchId) => {
      // Invalidate session queries when batch is deleted
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'admin'] });

      // Remove the batch data from cache
      queryClient.removeQueries({ queryKey: ['sessions', 'batch', batchId] });
    },
  });
}