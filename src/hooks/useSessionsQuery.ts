import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Session {
  id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  session_type: string;
  session_type_detail: string | null;
  booking_count: number;
  max_capacity: number;
  instructor_id: string | null;
  price_cents: number;
  profiles?: {
    full_name: string;
  };
  bookings?: Array<{
    id: string;
    status: string;
    swimmer_id: string;
    created_at: string;
    canceled_at: string | null;
    cancel_reason: string | null;
    cancel_source: string | null;
    swimmers?: {
      first_name: string;
      last_name: string;
    };
    profiles?: {
      full_name: string;
    };
  }>;
}

interface SessionFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
}

const fetchSessions = async (filters?: SessionFilters): Promise<Session[]> => {
  let query = supabase
    .from('sessions')
    .select(`
      *,
      profiles!sessions_instructor_id_fkey(full_name),
      bookings(
        id,
        status,
        swimmer_id,
        created_at,
        canceled_at,
        cancel_reason,
        cancel_source,
        swimmers!bookings_swimmer_id_fkey(first_name, last_name),
        profiles!bookings_parent_id_fkey(full_name)
      )
    `)
    .order('start_time', { ascending: true });

  if (filters?.startDate) {
    query = query.gte('start_time', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('start_time', filters.endDate);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as any) || [];
};

export const useSessionsQuery = (filters?: SessionFilters) => {
  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: () => fetchSessions(filters),
  });
};

// Mutation for updating sessions
export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

// Mutation for creating sessions
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Record<string, any>) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert([session as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};
