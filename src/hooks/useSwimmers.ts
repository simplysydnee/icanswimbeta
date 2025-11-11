import { useState, useEffect } from 'react';
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

export const useSwimmers = () => {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSwimmers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Single query with joins - no N+1
      const { data, error: fetchError } = await supabase
        .from('swimmers')
        .select(`
          *,
          swim_levels!swimmers_current_level_id_fkey(display_name),
          profiles!swimmers_parent_id_fkey(full_name, email)
        `)
        .order('first_name');

      if (fetchError) throw fetchError;
      setSwimmers(data as any || []);
    } catch (err) {
      console.error('Error fetching swimmers:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwimmers();
  }, []);

  return { swimmers, loading, error, refetch: fetchSwimmers };
};
