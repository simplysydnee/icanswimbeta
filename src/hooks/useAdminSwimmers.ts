import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/server';

// Type-safe status values matching your Supabase enums
export type EnrollmentStatus =
  | 'waitlist'
  | 'pending_enrollment'
  | 'enrolled'
  | 'enrollment_expired'
  | 'declined'
  | 'dropped'
  | 'pending_vmrc_referral'
  | 'pending_approval'
  | 'floating';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'declined';

export type AssessmentStatus =
  | 'not_started'
  | 'scheduled'
  | 'completed'
  | 'pos_authorization_needed';

export interface AdminSwimmersFilters {
  enrollmentStatus?: EnrollmentStatus[];
  approvalStatus?: ApprovalStatus[];
  assessmentStatus?: AssessmentStatus[];
  isVmrcClient?: boolean;
  search?: string;
}

export const useAdminSwimmers = (filters?: AdminSwimmersFilters) => {
  return useQuery({
    queryKey: ['admin-swimmers', filters],
    queryFn: async () => {
      const supabase = await createClient();

      // Base query - get ALL swimmers
      let query = supabase
        .from('swimmers')
        .select(`
          id,
          first_name,
          last_name,
          date_of_birth,
          enrollment_status,
          approval_status,
          assessment_status,
          is_vmrc_client,
          flexible_swimmer,
          client_booking_limit,
          parent_id,
          current_level_id,
          signed_waiver,
          photo_release,
          created_at,
          updated_at,
          parent:profiles!parent_id(
            id,
            email,
            full_name,
            phone
          ),
          current_level:swim_levels(
            id,
            name,
            display_name
          ),
          bookings!swimmer_id(
            id,
            status,
            session_id,
            sessions(start_time)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (filters?.enrollmentStatus?.length) {
        query = query.in('enrollment_status', filters.enrollmentStatus);
      }

      if (filters?.approvalStatus?.length) {
        query = query.in('approval_status', filters.approvalStatus);
      }

      if (filters?.assessmentStatus?.length) {
        query = query.in('assessment_status', filters.assessmentStatus);
      }

      if (filters?.isVmrcClient !== undefined) {
        query = query.eq('is_vmrc_client', filters.isVmrcClient);
      }

      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching swimmers:', error);
        throw new Error(`Failed to fetch swimmers: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 3
  });
};