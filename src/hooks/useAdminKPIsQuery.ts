import { useQuery } from '@tanstack/react-query';
import { adminApi, AdminKPIs } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

export type { AdminKPIs };

export const useAdminKPIsQuery = () => {
  return useQuery({
    queryKey: ['admin-kpis'],
    queryFn: async () => {
      const { data, error } = await adminApi.getKPIs();
      if (error) {
        toast({
          title: 'Error fetching KPIs',
          description: error,
          variant: 'destructive',
        });
        throw new Error(error);
      }
      return data!;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
