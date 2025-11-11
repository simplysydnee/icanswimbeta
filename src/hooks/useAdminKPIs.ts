import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminKPIs {
  totalSwimmers: number;
  waitlistCount: number;
  pendingApprovalCount: number;
  enrolledCount: number;
  recentBookings: number;
  recentCancellations: number;
}

export const useAdminKPIs = () => {
  const [kpis, setKpis] = useState<AdminKPIs>({
    totalSwimmers: 0,
    waitlistCount: 0,
    pendingApprovalCount: 0,
    enrolledCount: 0,
    recentBookings: 0,
    recentCancellations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Single query for swimmer counts
        const { data: swimmers, error: swimmersError } = await supabase
          .from('swimmers')
          .select('enrollment_status, approval_status');

        if (swimmersError) throw swimmersError;

        // Calculate swimmer KPIs from the data
        const waitlist = swimmers?.filter(s => s.enrollment_status === 'waitlist').length || 0;
        const pending = swimmers?.filter(s => s.approval_status === 'pending').length || 0;
        const enrolled = swimmers?.filter(s => s.enrollment_status === 'enrolled').length || 0;

        // Single query for recent bookings (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: recentBookingsCount, error: bookingsError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed')
          .gte('created_at', sevenDaysAgo.toISOString());

        if (bookingsError) throw bookingsError;

        // Single query for recent cancellations (last 7 days)
        const { count: recentCancellationsCount, error: cancellationsError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'cancelled')
          .gte('canceled_at', sevenDaysAgo.toISOString());

        if (cancellationsError) throw cancellationsError;

        setKpis({
          totalSwimmers: swimmers?.length || 0,
          waitlistCount: waitlist,
          pendingApprovalCount: pending,
          enrolledCount: enrolled,
          recentBookings: recentBookingsCount || 0,
          recentCancellations: recentCancellationsCount || 0,
        });
      } catch (err) {
        console.error('Error fetching KPIs:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  return { kpis, loading, error, refetch: () => window.location.reload() };
};
