import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { startOfMonth, startOfYear } from 'date-fns';

interface RevenueData {
  privatePayRevenue: number; // in dollars
  fundedRevenue: number; // in dollars
  totalRevenue: number; // in dollars
  bookingCount: number;
}

interface UseAdminRevenueOptions {
  startDate?: Date;
  endDate?: Date;
  timePeriod?: 'month' | 'year' | 'custom';
}

export const useAdminRevenue = (options: UseAdminRevenueOptions = {}) => {
  const { startDate, endDate, timePeriod = 'month' } = options;

  return useQuery({
    queryKey: ['admin-revenue', startDate?.toISOString(), endDate?.toISOString(), timePeriod],
    queryFn: async (): Promise<RevenueData> => {
      const supabase = createClient();

      // Determine date range
      let queryStartDate: Date;
      let queryEndDate: Date = new Date();

      if (startDate) {
        queryStartDate = startDate;
      } else if (timePeriod === 'year') {
        queryStartDate = startOfYear(new Date());
      } else {
        // Default to month-to-date
        queryStartDate = startOfMonth(new Date());
      }

      if (endDate) {
        queryEndDate = endDate;
      }

      // Fetch bookings with session and swimmer data
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          session:sessions(
            price_cents,
            start_time
          ),
          swimmer:swimmers(
            payment_type
          )
        `)
        .or('status.eq.confirmed,status.eq.completed')
        .gte('session.start_time', queryStartDate.toISOString())
        .lte('session.start_time', queryEndDate.toISOString());

      if (error) {
        console.error('Revenue query error:', error);
        throw error;
      }

      // Calculate revenue based on correct business rules
      const now = new Date();
      let privatePayRevenueCents = 0;
      let fundedRevenueCents = 0;
      let privatePayCount = 0;
      let fundedCount = 0;
      let skippedCount = 0;

      bookings?.forEach((booking) => {
        // Skip if no session or swimmer data
        if (!booking.session || !booking.swimmer) {
          skippedCount++;
          return;
        }

        const sessionStartTime = new Date(booking.session.start_time);

        // Determine if session should count as attended
        // Completed bookings always count, confirmed bookings only count if session is in the past
        const isAttended =
          booking.status === 'completed' ||
          (booking.status === 'confirmed' && sessionStartTime < now);

        // Only count attended sessions
        if (!isAttended) {
          skippedCount++;
          return;
        }

        const priceCents = booking.session.price_cents || 0;

        // Route revenue based on swimmer's payment type
        // Private Pay: payment_type = 'private_pay'
        // Funded: payment_type = 'funding_source', 'scholarship', or 'other'
        if (booking.swimmer.payment_type === 'private_pay') {
          privatePayRevenueCents += priceCents;
          privatePayCount++;
        } else if (['funding_source', 'scholarship', 'other'].includes(booking.swimmer.payment_type)) {
          fundedRevenueCents += priceCents;
          fundedCount++;
        } else {
          // Unknown payment type
          console.warn(`Unknown payment type: ${booking.swimmer.payment_type} for booking ${booking.id}`);
          skippedCount++;
        }
      });

      // Convert to dollars for return value
      const privatePayRevenue = privatePayRevenueCents / 100;
      const fundedRevenue = fundedRevenueCents / 100;

      console.log(`useAdminRevenue calculation:
        Private Pay: ${privatePayCount} bookings, $${privatePayRevenue.toFixed(2)} (${privatePayRevenueCents} cents)
        Funded: ${fundedCount} bookings, $${fundedRevenue.toFixed(2)} (${fundedRevenueCents} cents)
        Skipped: ${skippedCount} bookings`);

      return {
        privatePayRevenue,
        fundedRevenue,
        totalRevenue: privatePayRevenue + fundedRevenue,
        bookingCount
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true
  });
};

// Helper function to format currency
export const formatRevenueCurrency = (dollars: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
};