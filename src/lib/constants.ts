import { SubscriptionTier } from './types';

// App configuration
export const APP_CONFIG = {
  name: 'I Can Swim',
  description: 'Simply Better Swim Software - Adaptive swim lessons for swimmers with special needs',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  version: '1.0.0',
  owner: 'Sutton Lucas',
  company: 'I Can Swim, LLC',
  email: 'info@icanswim209.com',
  phone: '209-778-7877',
  website: 'icanswim209.com',
  locations: {
    modesto: {
      name: 'Modesto',
      address: '1212 Kansas Ave, Modesto, CA 95351',
    },
    merced: {
      name: 'Merced',
      address: '750 Motel Dr, Merced, CA 95340',
    },
  },
  social: {
    facebook: 'https://facebook.com/icanswim209',
    instagram: 'https://instagram.com/icanswim209',
  },
} as const;

// Pricing configuration (in cents)
export const PRICING = {
  ASSESSMENT: 17500, // $175.00
  LESSON_PRIVATE_PAY: 9000, // $90.00
  FUNDING_SOURCE_LESSON: 0, // Billed to funding source (state/agency)
} as const;

// Default Funding Source Configuration
export const DEFAULT_FUNDING_SOURCE_CONFIG = {
  ASSESSMENT_SESSIONS: 1,
  LESSONS_PER_PO: 12,
  PO_DURATION_MONTHS: 3,
  RENEWAL_ALERT_THRESHOLD: 11, // Alert at 11/12 sessions
} as const;

// Session statuses
export const SESSION_STATUSES = {
  DRAFT: 'draft',
  AVAILABLE: 'available',
  OPEN: 'open',
  BOOKED: 'booked',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  CLOSED: 'closed',
} as const;

// Enrollment statuses
export const ENROLLMENT_STATUSES = {
  WAITLIST: 'waitlist',
  PENDING_ENROLLMENT: 'pending_enrollment',
  ENROLLED: 'enrolled',
  INACTIVE: 'inactive',
} as const;

// Assessment statuses
export const ASSESSMENT_STATUSES = {
  NOT_STARTED: 'not_started',
  SCHEDULED: 'scheduled',
  COMPLETE: 'complete',
  POS_AUTHORIZATION_NEEDED: 'pos_authorization_needed',
  POS_REQUEST_SENT: 'pos_request_sent',
} as const;

// Approval statuses
export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DECLINED: 'declined',
} as const;

// Payment types
export const PAYMENT_TYPES = {
  PRIVATE_PAY: 'private_pay',
  FUNDING_SOURCE: 'funding_source',
} as const;

// User roles
export const USER_ROLES = {
  PARENT: 'parent',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
  COORDINATOR: 'coordinator',
  // COORDINATOR: 'coordinator' - already defined above
} as const;

// Swim levels
export const SWIM_LEVELS = {
  WHITE: { name: 'White', description: 'Water Readiness', sequence: 1 },
  RED: { name: 'Red', description: 'Body Position', sequence: 2 },
  YELLOW: { name: 'Yellow', description: 'Forward Movement', sequence: 3 },
  GREEN: { name: 'Green', description: 'Water Competency', sequence: 4 },
  BLUE: { name: 'Blue', description: 'Streamlines', sequence: 5 },
} as const;

// Diagnosis options for enrollment form
export const DIAGNOSIS_OPTIONS = [
  'ADD/ADHD',
  'Autism',
  'Speech Impairment',
  'Developmental Delay',
  'Specific Learning Disability',
  'Sensory Processing',
  'Deaf/Hard of Hearing',
] as const;

// Swim goals options for enrollment form
export const SWIM_GOALS = [
  'Develop comfort and familiarity with water',
  'Front crawl',
  'Backstroke',
  'Improve basic water safety skills (e.g. floating, treading water)',
  'Learn basic swimming strokes (e.g. front stroke)',
  'Learn to swim with flotation device',
  'Become comfortable in water',
  'Enter and exit water',
  'To float on back',
  'Perform basic arm and leg movement',
  'Tread water',
] as const;

// Availability slots for enrollment form
export const AVAILABILITY_SLOTS = [
  'Flexible – I can adjust my schedule if needed',
  'Weekday Mornings (8 AM- 12 PM)',
  'Weekday Afternoons (12 PM – 4 PM)',
  'Weekday Evenings (4 PM – 7 PM)',
  'Saturday Availability',
  'Sunday Availability',
  'Other (please specify)',
] as const;

// Days of week for booking
export const DAYS_OF_WEEK = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 },
] as const;

// Subscription plans configuration (kept for framework compatibility)
export const SUBSCRIPTION_PLANS = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: {
      max_swimmers: 5,
      support_level: 'community',
    },
    stripe_price_id: null,
  },
  [SubscriptionTier.PRO]: {
    name: 'Pro',
    price: 0, // Not used - pay per session
    currency: 'USD',
    interval: 'month',
    features: {
      max_swimmers: -1,
      support_level: 'email',
    },
    stripe_price_id: null,
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: 'Enterprise',
    price: null,
    currency: 'USD',
    interval: 'month',
    features: {
      max_swimmers: -1,
      support_level: 'dedicated',
    },
    stripe_price_id: null,
  },
} as const;

// Feature flags
export const FEATURES = {
  AUTHENTICATION: 'authentication',
  PAYMENTS: 'payments',
  BOOKING: 'booking',
  PROGRESS_TRACKING: 'progress_tracking',
  FUNDING_SOURCE_MANAGEMENT: 'funding_source_management',
  INSTRUCTOR_DASHBOARD: 'instructor_dashboard',
  ADMIN_DASHBOARD: 'admin_dashboard',
  COORDINATOR_PORTAL: 'coordinator_portal',
} as const;

// API configuration
export const API_CONFIG = {
  base_url: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  retry_attempts: 3,
  retry_delay: 1000,
} as const;

// Pagination defaults
export const PAGINATION = {
  default_page: 1,
  default_limit: 10,
  max_limit: 100,
  limits: [10, 25, 50, 100],
} as const;

// Validation constants
export const VALIDATION = {
  password: {
    min_length: 8,
    max_length: 128,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_symbols: false,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  name: {
    min_length: 2,
    max_length: 50,
  },
  phone: {
    pattern: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
  },
} as const;

// Booking limits
export const BOOKING_LIMITS = {
  DEFAULT_PER_DAY: 4,
  BOOKING_HOLD_MINUTES: 5,
  CANCELLATION_HOURS: 24,
} as const;

// Cache configuration
export const CACHE = {
  user_session: 24 * 60 * 60,
  api_response: 5 * 60,
  static_content: 30 * 24 * 60 * 60,
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Booking
  SESSION_FULL: 'SESSION_FULL',
  SESSION_UNAVAILABLE: 'SESSION_UNAVAILABLE',
  BOOKING_LIMIT_EXCEEDED: 'BOOKING_LIMIT_EXCEEDED',
  CANCELLATION_TOO_LATE: 'CANCELLATION_TOO_LATE',
  RECURRING_SESSION_SINGLE_BOOKING_NOT_ALLOWED: 'RECURRING_SESSION_SINGLE_BOOKING_NOT_ALLOWED',
  NON_RECURRING_SESSION_IN_RECURRING_BOOKING: 'NON_RECURRING_SESSION_IN_RECURRING_BOOKING',
  
  // Funding Source
  PO_EXPIRED: 'PO_EXPIRED',
  PO_SESSIONS_EXHAUSTED: 'PO_SESSIONS_EXHAUSTED',
  PO_APPROVAL_REQUIRED: 'PO_APPROVAL_REQUIRED',

  // General
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: 'Account created successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PASSWORD_RESET_SENT: 'Password reset email sent',
  BOOKING_CONFIRMED: 'Booking confirmed successfully',
  BOOKING_CANCELLED: 'Booking cancelled successfully',
  SWIMMER_ENROLLED: 'Swimmer enrolled successfully',
  PROGRESS_UPDATED: 'Progress updated successfully',
  PO_APPROVED: 'Purchase Order approved successfully',
} as const;

// Navigation items
export const NAVIGATION_ITEMS = [
  { name: 'About', href: '/about', auth_required: false },
  { name: 'Pricing', href: '/pricing', auth_required: false },
  { name: 'Contact', href: '/contact', auth_required: false },
  { name: 'Dashboard', href: '/dashboard', auth_required: true },
] as const;

// Theme configuration
export const THEME = {
  default: 'system',
  options: ['light', 'dark', 'system'],
} as const;

// Legal documents
export const LIABILITY_WAIVER_TEXT = `WAIVER AND RELEASE OF LIABILITY

IN CONSIDERATION OF the risk of injury that exists while participating in SWIM LESSONS (hereinafter the "Activity"); and

IN CONSIDERATION OF my desire to participate in said Activity and being given the right to participate in same:

I HEREBY, for myself, my heirs, executors, administrators, assigns, or personal representatives (hereinafter collectively, "Releasor", "I", or "me", which terms shall also include Releasor's parents or guardian if Releasor is under 18 years of age), knowingly and voluntarily enter into this WAIVER AND RELEASE OF LIABILITY and hereby waive any and all rights, claims or causes of action of any kind arising out of my participation in the Activity; and

I HEREBY, release and forever discharge I CAN SWIM, LLC, located at 1212 Kansas Ave, Modesto, California 95351, their affiliates, managers, members, agents, attorneys, staff, volunteers, heirs, representatives, predecessors, successors and assigns (collectively "Releasee's), from any physical or psychological injury that I may suffer as a direct result of my participation in the aforementioned Activity.

I AM VOLUNTARILY PARTICIPATING IN THE AFOREMENTIONED ACTIVITY AND I AM PARTICIPATING IN THE ACTIVITY ENTIRELY AT MY OWN RISK. I AM AWARE OF THE RISKS ASSOCIATED WITH PARTICIPATING IN THIS ACTIVITY, WHICH MAY INCLUDE, BUT ARE NOT LIMITED TO: PHYSICAL OR PSYCHOLOGICAL INJURY, PAIN, SUFFERING, ILLNESS, DISFIGUREMENT, TEMPORARY OR PERMANENT DISABILITY (INCLUDING PARALYSIS), ECONOMIC OR EMOTIONAL LOSS, AND DEATH. I UNDERSTAND THAT THESE INJURIES OR OUTCOMES MAY ARISE FROM MY OWN OR OTHERS' NEGLIGENCE, CONDITIONS RELATED TO TRAVEL TO AND FROM THE ACTIVITY, OR FROM CONDITIONS AT THE ACTIVITY LOCATION(S). NONETHELESS, I ASSUME ALL RELATED RISKS, BOTH KNOWN AND UNKNOWN TO ME, OF MY PARTICIPATION IN THIS ACTIVITY.

I FURTHER AGREE to indemnify, defend and hold harmless the Releasees against any and all claims, suits or actions of any kind whatsoever for liability, damages, compensation or otherwise brought by me or anyone on my behalf, including attorney's fees and any related costs.

I FURTHER ACKNOWLEDGE that Releasees are not responsible for errors, omissions, acts or failures to act of any party or entity conducting a specific event or activity on behalf of Releasees. In the event that I should require medical care or treatment, I authorize I CAN SWIM, LLC to provide all emergency medical care deemed necessary, including but not limited to, first aid, CPR, the use of AEDs, emergency medical transport, and sharing of medical information with medical personnel. I further agree to assume all costs involved and agree to be financially responsible for any costs incurred as a result of such treatment. I am aware and understand that I should carry my own health insurance.

I FURTHER ACKNOWLEDGE that this Activity may involve a test of a person's physical and mental limits and may carry with it the potential for death, serious injury, and property loss. I agree not to participate in the Activity unless I am medically able and properly trained, and I agree to abide by the decision of I CAN SWIM, LLC official or agent, regarding my approval to participate in the Activity.

I HEREBY ACKNOWLEDGE THAT I HAVE CAREFULLY READ THIS "WAIVER AND RELEASE" AND FULLLY UNDERSTAND THAT IT IS A RELEASE OF LIABILITY. I EXPRESSLY AGREE TO RELEASE AND DISCHARGE SUTTON LUCAS DBA I CAN SWIM, AND ALL OF ITS AFFILIATES, MANAGERS, MEMBERS, AGENTS, ATTORNEYS, STAFF, VOLUNTEERS, HEIRS, REPRESENTATIVES, PREDECESSORS, SUCCESSORS AND ASSIGNS, FROM ANY AND ALL CLAIMS OR CAUSES OF ACTION AND I AGREE TO VOLUNTARILY GIVE UP OR WAIVE ANY RIGHT THAT I OTHERWISE HAVE TO BRING LEGAL ACTION AGAINST I CAN SWIM, LLC FOR PERSONAL INJURY OR PROPERTY DAMAGE.

To the extent that statute or case law does not prohibit releases for ordinary negligence, this release is also for such negligence on the part of I CAN SWIM, LLC its agents and employees.

I agree that this Release shall be governed for all purposes by California law without regard to any conflict of law principles. This Release supersedes any and all previous oral or written promises or other agreements.

In the event that any damage to equipment or facilities occurs as a result of my or my family's or my agent's willful actions, neglect or recklessness, I acknowledge and agree to be held liable for any and all costs associated with any such actions of neglect or recklessness.

THIS WAIVER AND RELEASE OF LIABILITY SHALL REMAIN IN EFFECT FOR THE DURATION OF MY PARTICIPATION IN THE ACTIVITY, DURING THIS INITIAL AND ALL SUBSEQUENT EVENTS OF PARTICIPATION.

THIS AGREEMENT was entered into at arm's length, without duress or coercion and is to be interpreted as an agreement between two parties of equal bargaining strength. Both Participant, and I CAN SWIM, LLC agree that this agreement is clear and unambiguous as to its terms, and that no other evidence shall be used or admitted to alter or explain the terms of this agreement, but that it will be interpreted based upon the language in accordance with the purposes for which it is entered into.

In the event that any provision contained within this Release of Liability shall be deemed to be severable or invalid, or if any term, condition, phrase or portion of this agreement shall be determined to be unlawful or otherwise unenforceable, the remainder of this agreement shall remain in full force and effect. If a court should find that any provision of this agreement to be invalid or unenforceable, but that by limiting said provision it would become valid and enforceable, then said provision shall be deemed to be written, construed and enforced as so limited.

PARENT / GUARDIAN WAIVER FOR MINORS

In the event that the participant is under the age of consent (18 years of age) then this release must be signed by a parent or guardian.

I HEREBY CERTIFY that I am the parent or guardian of the minor named in this enrollment, and do hereby give my consent without reservation to the foregoing on behalf of this individual.`;

export const CANCELLATION_POLICY_TEXT = `CANCELLATION POLICY

If you need to cancel a session, please do so at least 24 hours in advance.
This gives us time to offer the spot to another swimmer.

Cancellations can be made through your parent portal on the app or online.

We understand that life happens—illness, emergencies, and unexpected changes are part of life. But when we don't receive notice in time, the session goes unused, and another swimmer misses the opportunity to take that spot.

Late cancellations or no-calls/no-shows may result in drop of services.

We appreciate your understanding and support as we work to keep the pool full and every swimmer progressing.

Have an emergency? Contact us:
Sutton Lucas
Phone: (209) 778-7877
Email: info@icanswim209.com
Website: icanswim209.com`;
