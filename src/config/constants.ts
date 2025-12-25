// ============================================
// SESSION GENERATOR CONSTANTS
// ============================================

// Cache times (in milliseconds) for React Query
export const CACHE_TIMES = {
  SHORT: 1000 * 60 * 2,      // 2 minutes - frequently changing data
  MEDIUM: 1000 * 60 * 5,     // 5 minutes - moderate change frequency
  LONG: 1000 * 60 * 10,      // 10 minutes - rarely changing data
  VERY_LONG: 1000 * 60 * 30, // 30 minutes - almost static data
} as const;

// Session status values
export const SESSION_STATUS = {
  DRAFT: 'draft',
  AVAILABLE: 'available',
  OPEN: 'open',
  BOOKED: 'booked',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

// Session types
export const SESSION_TYPE = {
  LESSON: 'lesson',
  ASSESSMENT: 'assessment',
} as const;

export type SessionType = typeof SESSION_TYPE[keyof typeof SESSION_TYPE];

// Locations
export const LOCATIONS = [
  { value: 'Modesto', label: 'Modesto - 1212 Kansas Ave' },
  { value: 'Turlock', label: 'Turlock - 2705 Sebastian Drive' },
] as const;

// Session durations (in minutes)
export const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
] as const;

// Days of week (0 = Sunday per JavaScript Date.getDay())
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;