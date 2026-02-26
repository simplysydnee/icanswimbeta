import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

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
      // Build query parameters from filters
      const params = new URLSearchParams();

      if (filters?.enrollmentStatus?.length) {
        params.append('status', filters.enrollmentStatus.join(','));
      }

      if (filters?.search) {
        params.append('search', filters.search);
      }

      // Add other filter parameters as needed
      const queryString = params.toString();
      const url = `/api/admin/swimmers${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch swimmers: ${response.statusText}`);
      }

      const data = await response.json();
      return data.swimmers || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 3
  });
};