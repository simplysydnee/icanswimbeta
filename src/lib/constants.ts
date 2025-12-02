import { SubscriptionTier } from './types';

// App configuration
export const APP_CONFIG = {
  name: 'I Can Swim',
  description: 'Simply Better Swim Software - Adaptive swim lessons for swimmers with special needs',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  version: '1.0.0',
  owner: 'Sutton Lucas',
  company: 'I Can Swim, LLC',
  email: 'sutton@icanswim209.com',
  phone: '209-985-1538',
  website: 'icanswim209.com',
  locations: {
    turlock: {
      name: 'Turlock',
      address: '2705 Sebastian Drive, Turlock, CA 95382',
    },
    modesto: {
      name: 'Modesto',
      address: '1212 Kansas Ave, Modesto, CA 95351',
    },
  },
  social: {
    facebook: 'https://facebook.com/icanswim209',
    instagram: 'https://instagram.com/icanswim209',
  },
} as const;

// Pricing configuration (in cents)
export const PRICING = {
  ASSESSMENT: 6500, // $65.00
  LESSON_PRIVATE_PAY: 7500, // $75.00
  VMRC_LESSON: 0, // Billed to state
} as const;

// VMRC Configuration
export const VMRC_CONFIG = {
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
  VMRC: 'vmrc',
  SCHOLARSHIP: 'scholarship',
  OTHER: 'other',
} as const;

// User roles
export const USER_ROLES = {
  PARENT: 'parent',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
  VMRC_COORDINATOR: 'vmrc_coordinator',
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
  VMRC_MANAGEMENT: 'vmrc_management',
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
  
  // VMRC
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
