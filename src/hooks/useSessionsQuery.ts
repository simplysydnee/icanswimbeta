import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi, Session } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

export type { Session };

interface SessionFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const useSessionsQuery = (filters?: SessionFilters) => {
  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: async () => {
      const { data, error } = await sessionsApi.getAll(filters);
      if (error) {
        toast({
          title: 'Error fetching sessions',
          description: error,
          variant: 'destructive',
        });
        throw new Error(error);
      }
      return data || [];
    },
  });
};

// Mutation for updating sessions
export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await sessionsApi.update(id, updates);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: 'Success',
        description: 'Session updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating session',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Mutation for creating sessions
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Record<string, any>) => {
      const { data, error } = await sessionsApi.create(session);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: 'Success',
        description: 'Session created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating session',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
