import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { swimmersApi, Swimmer } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

export type { Swimmer };

export const useSwimmersQuery = () => {
  return useQuery({
    queryKey: ['swimmers'],
    queryFn: async () => {
      const { data, error } = await swimmersApi.getAll();
      if (error) {
        toast({
          title: 'Error fetching swimmers',
          description: error,
          variant: 'destructive',
        });
        throw new Error(error);
      }
      return data || [];
    },
  });
};

// Mutation for updating swimmers
export const useUpdateSwimmer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await swimmersApi.update(id, updates);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swimmers'] });
      toast({
        title: 'Success',
        description: 'Swimmer updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating swimmer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Mutation for creating swimmers
export const useCreateSwimmer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (swimmer: Record<string, any>) => {
      const { data, error } = await swimmersApi.create(swimmer);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swimmers'] });
      toast({
        title: 'Success',
        description: 'Swimmer created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating swimmer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
