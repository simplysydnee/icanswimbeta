import { EnrollmentStatus, ApprovalStatus, AssessmentStatus } from '@/hooks/useAdminSwimmers';

export interface SwimmerKPIs {
  // Totals
  total: number;
  vmrcClients: number;
  privatePayClients: number;

  // By Enrollment Status (using exact database values)
  enrolled: number;                    // 'enrolled' - 362 swimmers
  waitlist: number;                    // 'waitlist' - 572 swimmers
  pendingEnrollment: number;           // 'pending_enrollment' - 396 swimmers
  enrollmentExpired: number;           // 'enrollment_expired' - 132 swimmers
  declined: number;                    // 'declined' - 90 swimmers
  dropped: number;                     // 'dropped' - 67 swimmers
  pendingVmrcReferral: number;         // 'pending_vmrc_referral' - 15 swimmers
  pendingApprovalEnrollment: number;   // 'pending_approval' - 14 swimmers
  floating: number;                    // 'floating' - 2 swimmers
  noEnrollmentStatus: number;          // NULL or '' - 83 swimmers

  // By Approval Status
  approved: number;                    // 'approved'
  pendingApproval: number;             // 'pending'
  declinedApproval: number;            // 'declined'
  noApprovalStatus: number;            // NULL

  // By Assessment Status
  assessmentNotStarted: number;        // 'not_started' or NULL
  assessmentScheduled: number;         // 'scheduled'
  assessmentCompleted: number;         // 'completed'
  posAuthorizationNeeded: number;      // 'pos_authorization_needed'

  // Activity
  activeSwimmers: number;              // Has bookings in last 30 days
  swimmersWithBookings: number;
  flexibleSwimmers: number;

  // Legal
  signedWaivers: number;
  photoReleases: number;
}

export const calculateSwimmerKPIs = (swimmers: any[]): SwimmerKPIs => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    // Totals
    total: swimmers.length,
    vmrcClients: swimmers.filter(s => s.is_vmrc_client === true).length,
    privatePayClients: swimmers.filter(s => !s.is_vmrc_client).length,

    // By Enrollment Status (exact matches to database values)
    enrolled: swimmers.filter(s => s.enrollment_status === 'enrolled').length,
    waitlist: swimmers.filter(s => s.enrollment_status === 'waitlist').length,
    pendingEnrollment: swimmers.filter(s => s.enrollment_status === 'pending_enrollment').length,
    enrollmentExpired: swimmers.filter(s => s.enrollment_status === 'enrollment_expired').length,
    declined: swimmers.filter(s => s.enrollment_status === 'declined').length,
    dropped: swimmers.filter(s => s.enrollment_status === 'dropped').length,
    pendingVmrcReferral: swimmers.filter(s => s.enrollment_status === 'pending_vmrc_referral').length,
    pendingApprovalEnrollment: swimmers.filter(s => s.enrollment_status === 'pending_approval').length,
    floating: swimmers.filter(s => s.enrollment_status === 'floating').length,
    noEnrollmentStatus: swimmers.filter(s => !s.enrollment_status || s.enrollment_status === '').length,

    // By Approval Status
    approved: swimmers.filter(s => s.approval_status === 'approved').length,
    pendingApproval: swimmers.filter(s => s.approval_status === 'pending').length,
    declinedApproval: swimmers.filter(s => s.approval_status === 'declined').length,
    noApprovalStatus: swimmers.filter(s => !s.approval_status || s.approval_status === '').length,

    // By Assessment Status
    assessmentNotStarted: swimmers.filter(s =>
      s.assessment_status === 'not_started' || !s.assessment_status
    ).length,
    assessmentScheduled: swimmers.filter(s => s.assessment_status === 'scheduled').length,
    assessmentCompleted: swimmers.filter(s => s.assessment_status === 'completed').length,
    posAuthorizationNeeded: swimmers.filter(s =>
      s.assessment_status === 'pos_authorization_needed'
    ).length,

    // Activity
    activeSwimmers: swimmers.filter(s => {
      if (!s.bookings || !Array.isArray(s.bookings)) return false;
      return s.bookings.some(booking => {
        const sessionDate = new Date(booking.sessions?.start_time);
        return sessionDate >= thirtyDaysAgo;
      });
    }).length,
    swimmersWithBookings: swimmers.filter(s =>
      s.bookings && s.bookings.length > 0
    ).length,
    flexibleSwimmers: swimmers.filter(s => s.flexible_swimmer === true).length,

    // Legal
    signedWaivers: swimmers.filter(s => s.signed_waiver === true).length,
    photoReleases: swimmers.filter(s => s.photo_release === true).length,
  };
};

// Helper to format status for display (with emojis from CSV)
export const formatEnrollmentStatus = (status: EnrollmentStatus | null | undefined): string => {
  if (!status) return 'No Status';

  const statusMap: Record<EnrollmentStatus, string> = {
    'enrolled': 'Actively Enrolled ✅',
    'waitlist': 'Waitlist ⏳',
    'pending_enrollment': 'Pending Parent Enrollment 📝',
    'enrollment_expired': 'Enrollment Expired ⛔️',
    'declined': 'Declined 🚫',
    'dropped': 'Dropped ⚠️',
    'pending_vmrc_referral': 'Pending VMRC Referral 📣',
    'pending_approval': 'Pending Approval 🔔',
    'floating': 'Floating'
  };

  return statusMap[status] || status;
};

export const formatApprovalStatus = (status: ApprovalStatus | null | undefined): string => {
  if (!status) return 'No Status';

  const statusMap: Record<ApprovalStatus, string> = {
    'approved': 'Approved ✅',
    'pending': 'Pending 🔔',
    'declined': 'Declined 🚫'
  };

  return statusMap[status] || status;
};

export const formatAssessmentStatus = (status: AssessmentStatus | null | undefined): string => {
  if (!status) return 'Not Started';

  const statusMap: Record<AssessmentStatus, string> = {
    'not_started': 'Not Started',
    'scheduled': 'Scheduled 📅',
    'completed': 'Completed ✅',
    'pos_authorization_needed': 'POS Renewal Needed 🔄'
  };

  return statusMap[status] || status;
};

// Helper to get status badge color
export const getEnrollmentStatusColor = (status: EnrollmentStatus | null | undefined): string => {
  if (!status) return 'bg-gray-100 text-gray-800';

  const colorMap: Record<EnrollmentStatus, string> = {
    'enrolled': 'bg-green-100 text-green-800',
    'waitlist': 'bg-yellow-100 text-yellow-800',
    'pending_enrollment': 'bg-blue-100 text-blue-800',
    'enrollment_expired': 'bg-red-100 text-red-800',
    'declined': 'bg-red-100 text-red-800',
    'dropped': 'bg-gray-100 text-gray-800',
    'pending_vmrc_referral': 'bg-purple-100 text-purple-800',
    'pending_approval': 'bg-orange-100 text-orange-800',
    'floating': 'bg-cyan-100 text-cyan-800'
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800';
};