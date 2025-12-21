/**
 * Swimmer TypeScript types for I Can Swim
 * Generic funding source system (replaces VMRC-specific types)
 */

export interface FundingSource {
  id: string;
  name: string;
  code: string;
  vendor_number?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  photo_url?: string;

  // Parent
  parent_id: string;
  parent?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };

  // Payment & Funding (Generic - not VMRC-specific)
  payment_type: 'private_pay' | 'funded' | 'scholarship' | 'other';
  funding_source_id?: string;
  funding_source?: FundingSource;

  // Coordinator (Generic - works for any funding source)
  coordinator_id?: string;
  coordinator_name?: string;
  coordinator_email?: string;
  coordinator_phone?: string;

  // Session tracking (Generic)
  funded_sessions_used?: number;
  funded_sessions_authorized?: number;
  current_po_number?: string;
  po_expires_at?: string;

  // Status
  enrollment_status: 'waitlist' | 'pending_enrollment' | 'enrolled' | 'inactive';
  assessment_status?: string;
  approval_status?: 'pending' | 'approved' | 'declined';

  // Level
  current_level_id?: string;
  current_level?: {
    id: string;
    name: string;
    display_name: string;
  };

  // Medical (keep existing)
  has_allergies?: boolean;
  allergies_description?: string;
  has_medical_conditions?: boolean;
  medical_conditions_description?: string;
  diagnosis?: string[];

  // Timestamps
  created_at: string;
  updated_at?: string;
}

// Helper function to check if swimmer is funded
export function isFundedSwimmer(swimmer: Swimmer): boolean {
  return swimmer.payment_type === 'funded' || !!swimmer.funding_source_id;
}

// Helper function to get funding source display name
export function getFundingSourceName(swimmer: Swimmer): string | null {
  if (!isFundedSwimmer(swimmer)) return null;
  return swimmer.funding_source?.name || 'Funding Source';
}

// Helper function to check if swimmer has coordinator
export function hasCoordinator(swimmer: Swimmer): boolean {
  return !!(swimmer.coordinator_name || swimmer.coordinator_email || swimmer.coordinator_phone);
}

// Helper function to get coordinator info
export function getCoordinatorInfo(swimmer: Swimmer): {
  name?: string;
  email?: string;
  phone?: string;
} {
  return {
    name: swimmer.coordinator_name,
    email: swimmer.coordinator_email,
    phone: swimmer.coordinator_phone,
  };
}

// Helper function to get remaining funded sessions
export function getRemainingFundedSessions(swimmer: Swimmer): number {
  if (!isFundedSwimmer(swimmer)) return 0;
  const authorized = swimmer.funded_sessions_authorized || 0;
  const used = swimmer.funded_sessions_used || 0;
  return Math.max(0, authorized - used);
}

// Helper function to check if PO is expired
export function isPOExpired(swimmer: Swimmer): boolean {
  if (!swimmer.po_expires_at) return false;
  const expiresAt = new Date(swimmer.po_expires_at);
  const now = new Date();
  return expiresAt < now;
}

// Helper function to get PO status
export function getPOStatus(swimmer: Swimmer): 'active' | 'expired' | 'none' {
  if (!swimmer.current_po_number) return 'none';
  if (isPOExpired(swimmer)) return 'expired';
  return 'active';
}