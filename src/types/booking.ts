/**
 * Booking wizard TypeScript types for I Can Swim
 */

// Enrollment status types
export type EnrollmentStatus =
  | 'waitlist'
  | 'pending_enrollment'
  | 'enrolled'
  | 'inactive'
  | 'declined';

// Payment type options
export type PaymentType =
  | 'private_pay'
  | 'funding_source';

// Session type options
export type SessionType =
  | 'single'
  | 'recurring';

// Booking wizard step progression
export type BookingStep =
  | 'select-swimmer'
  | 'assessment'
  | 'session-type'
  | 'select-instructor'
  | 'select-date'
  | 'confirm';

// Swimmer interface
export interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  enrollmentStatus: EnrollmentStatus;
  assessmentStatus: string | null;
  currentLevelId: string | null;
  currentLevelName?: string;
  paymentType: PaymentType;
  fundingSourceId?: string | null;
  fundingSourceName?: string;
  fundingSourceShortName?: string;
  coordinatorId?: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
  coordinatorPhone?: string;
  sessionsUsed?: number;
  sessionsAuthorized?: number;
  currentPosNumber?: string;
  posExpiresAt?: string;
  photoUrl?: string;
}

// Instructor interface
export interface Instructor {
  id: string;
  fullName: string;
  avatarUrl?: string;
  email?: string;
}

// Available session interface
export interface AvailableSession {
  id: string;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  instructorId: string;
  instructorName: string;
  instructorAvatarUrl?: string | null;
  location: string;
  sessionType: SessionType;
  maxCapacity: number;
  currentBookings: number;
  isFull: boolean;
  priceCents: number;
  isRecurring?: boolean; // Added for session type enforcement
  spotsRemaining?: number; // Added for availability display
}

// Booking wizard state
export interface BookingWizardState {
  currentStep: BookingStep;
  selectedSwimmerId: string | null;
  selectedSessionType: SessionType | null;
  selectedInstructorId: string | null;
  selectedDate: string | null; // ISO date string
  selectedSessionIds: string[]; // For recurring bookings
  isLoading: boolean;
  error: string | null;
}

// Booking request payload
export interface BookingRequest {
  swimmerId: string;
  sessionIds: string[];
  parentId: string;
  notes?: string;
  paymentMethod?: 'card' | 'funding_source_po';
  poNumber?: string; // For funding source clients
  fundingSourceId?: string; // For funding source clients
}

// Booking confirmation response
export interface BookingConfirmation {
  bookingId: string;
  swimmerName: string;
  sessionDetails: {
    date: string;
    startTime: string;
    endTime: string;
    instructorName: string;
    location: string;
  }[];
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'vmrc_pending';
  confirmationNumber: string;
}

// Assessment session specific interface
export interface AssessmentSession extends AvailableSession {
  isAssessment: true;
  assessmentPriceCents: number;
}

// Weekly booking options
export interface WeeklyBookingOption {
  dayOfWeek: number;
  timeSlots: AvailableSession[];
  preferredInstructorId?: string;
}

// Date availability
export interface DateAvailability {
  date: string; // ISO date string
  availableSessions: AvailableSession[];
  isFullyBooked: boolean;
}

// VMRC PO (Purchase Order) details
export interface VmrcPurchaseOrder {
  id: string;
  poNumber: string;
  swimmerId: string;
  coordinatorName: string;
  authorizedSessions: number;
  usedSessions: number;
  remainingSessions: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending';
}

// Booking validation error
export interface BookingValidationError {
  field: string;
  message: string;
  code: string;
}

// Booking wizard navigation
export interface BookingWizardNavigation {
  canGoBack: boolean;
  canGoForward: boolean;
  isComplete: boolean;
  steps: {
    id: BookingStep;
    label: string;
    isComplete: boolean;
    isCurrent: boolean;
  }[];
}