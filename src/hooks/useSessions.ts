import { useState, useEffect } from 'react';
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
    swimmers?: {
      first_name: string;
      last_name: string;
    };
    profiles?: {
      full_name: string;
    };
  }>;
}

export const useSessions = (filters?: { 
  startDate?: string; 
  endDate?: string;
  status?: string;
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('sessions')
        .select(`
          *,
          profiles!sessions_instructor_id_fkey(full_name),
          bookings(
            id,
            status,
            swimmer_id,
            swimmers!bookings_swimmer_id_fkey(first_name, last_name),
            profiles!bookings_parent_id_fkey(full_name)
          )
        `)
        .order('start_time', { ascending: true });

      // Apply filters if provided
      if (filters?.startDate) {
        query = query.gte('start_time', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('start_time', filters.endDate);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setSessions(data as any || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filters?.startDate, filters?.endDate, filters?.status]);

  return { sessions, loading, error, refetch: fetchSessions };
};
