import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  enrollment_status: string;
  approval_status: string;
  assessment_status: string;
  is_vmrc_client: boolean;
  payment_type: string;
  current_level_id: string | null;
  flexible_swimmer: boolean;
  parent_id: string;
  vmrc_sessions_used: number;
  vmrc_sessions_authorized: number;
  vmrc_current_pos_number: string | null;
  photo_url: string | null;
  created_at: string;
  swim_levels?: {
    display_name: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

const fetchSwimmers = async (): Promise<Swimmer[]> => {
  const { data, error } = await supabase
    .from('swimmers')
    .select(`
      *,
      swim_levels!swimmers_current_level_id_fkey(display_name),
      profiles!swimmers_parent_id_fkey(full_name, email)
    `)
    .order('first_name');

  if (error) throw error;
  return (data as any) || [];
};

export const useSwimmersQuery = () => {
  return useQuery({
    queryKey: ['swimmers'],
    queryFn: fetchSwimmers,
  });
};

// Mutation for updating swimmers
export const useUpdateSwimmer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('swimmers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swimmers'] });
    },
  });
};

// Mutation for creating swimmers
export const useCreateSwimmer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (swimmer: Record<string, any>) => {
      const { data, error } = await supabase
        .from('swimmers')
        .insert([swimmer as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swimmers'] });
    },
  });
};
