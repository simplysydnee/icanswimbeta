export type PriorityBookingReason = 'manual' | 'attendance' | 'medical' | 'behavioral';

export interface SwimmerInstructorAssignment {
  id: string;
  swimmer_id: string;
  instructor_id: string;
  assigned_by: string | null;
  assigned_at: string;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  instructor?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  swimmer?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface SwimmerPriorityInfo {
  is_priority_booking: boolean;
  priority_booking_reason: PriorityBookingReason | null;
  priority_booking_notes: string | null;
  priority_booking_set_at: string | null;
  priority_booking_set_by: string | null;
  priority_booking_expires_at: string | null;
  assigned_instructors?: SwimmerInstructorAssignment[];
}

export interface SetPriorityBookingParams {
  swimmerId: string;
  isPriority: boolean;
  reason?: PriorityBookingReason;
  notes?: string;
  expiresAt?: string | null;
  instructorIds?: string[];
}

export interface AssignInstructorParams {
  swimmerId: string;
  instructorId: string;
  isPrimary?: boolean;
  notes?: string;
}