import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminKPIs {
  totalSwimmers: number;
  activeSwimmers: number;
  pendingApprovals: number;
  totalSessions: number;
  upcomingSessions: number;
}

const fetchAdminKPIs = async (): Promise<AdminKPIs> => {
  // Fetch all swimmers
  const { data: swimmers, error: swimmersError } = await supabase
    .from('swimmers')
    .select('id, enrollment_status, approval_status');

  if (swimmersError) throw swimmersError;

  // Fetch all sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, start_time, status');

  if (sessionsError) throw sessionsError;

  const now = new Date();
  const upcomingSessions = sessions?.filter(
    (s) => new Date(s.start_time) > now && s.status === 'available'
  ).length || 0;

  return {
    totalSwimmers: swimmers?.length || 0,
    activeSwimmers: swimmers?.filter((s) => s.enrollment_status === 'active').length || 0,
    pendingApprovals: swimmers?.filter((s) => s.approval_status === 'pending').length || 0,
    totalSessions: sessions?.length || 0,
    upcomingSessions,
  };
};

export const useAdminKPIsQuery = () => {
  return useQuery({
    queryKey: ['admin-kpis'],
    queryFn: fetchAdminKPIs,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
