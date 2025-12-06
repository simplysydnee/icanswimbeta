import { z } from 'zod';

// ============================================
// SESSION GENERATION MODES
// ============================================

// Discriminated union for different session modes
export const SessionMode = z.enum(['single', 'repeating', 'assessment']);
export type SessionMode = z.infer<typeof SessionMode>;

export const SESSION_MODES = [
  {
    value: 'single' as const,
    label: 'Single (Floating)',
    description: 'One-time session for makeup or special booking',
    icon: 'Calendar',
  },
  {
    value: 'repeating' as const,
    label: 'Repeating (Weekly)',
    description: 'Recurring weekly lessons on a specific day',
    icon: 'Repeat',
  },
  {
    value: 'assessment' as const,
    label: 'Assessment Block',
    description: 'One-time assessment sessions',
    icon: 'ClipboardCheck',
  },
] as const;

// ============================================
// BREAK TIME SCHEMA
// ============================================

export const BreakSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
});

export type Break = z.infer<typeof BreakSchema>;

// ============================================
// GENERATE SESSIONS REQUEST SCHEMA
// ============================================

// Base schema with common fields
const BaseRequestSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time'),
  durationMinutes: z.union([z.literal(30), z.literal(45)]),
  maxCapacity: z.number().int().min(1).max(10),
  location: z.string().min(1, 'Location is required'),
  instructorIds: z.array(z.string().uuid()).min(1, 'At least one instructor required'),
  allowedSwimLevels: z.array(z.string().uuid()).optional(),
  breaks: z.array(BreakSchema).optional(),
  notes: z.string().optional(),
});

// Single session (one day, one-time)
export const SingleSessionRequestSchema = BaseRequestSchema.extend({
  mode: z.literal('single'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

// Repeating session (date range, specific day of week)
export const RepeatingSessionRequestSchema = BaseRequestSchema.extend({
  mode: z.literal('repeating'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  repeatDay: z.number().int().min(0).max(6),
  blackoutDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

// Assessment session (one day, one-time, type=assessment)
export const AssessmentSessionRequestSchema = BaseRequestSchema.extend({
  mode: z.literal('assessment'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

// Combined discriminated union
export const GenerateSessionsRequestSchema = z.discriminatedUnion('mode', [
  SingleSessionRequestSchema,
  RepeatingSessionRequestSchema,
  AssessmentSessionRequestSchema,
]);

export type GenerateSessionsRequest = z.infer<typeof GenerateSessionsRequestSchema>;
export type SingleSessionRequest = z.infer<typeof SingleSessionRequestSchema>;
export type RepeatingSessionRequest = z.infer<typeof RepeatingSessionRequestSchema>;
export type AssessmentSessionRequest = z.infer<typeof AssessmentSessionRequestSchema>;

// ============================================
// RESPONSE TYPES
// ============================================

export interface GenerateSessionsResponse {
  success: boolean;
  sessionsCreated: number;
  sessionsByInstructor: Record<string, number>;
  batchId: string;
  mode: SessionMode;
  dates: string[];
  errors?: string[];
}

// ============================================
// UI HELPER TYPES
// ============================================

export interface TimeSlot {
  value: string;  // 24-hour format: "15:00"
  label: string;  // 12-hour format: "3:00 PM"
}

// Generate time slots from 6 AM to 9 PM in 30-min increments
export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const h24 = hour.toString().padStart(2, '0');
      const m = min.toString().padStart(2, '0');
      const value = `${h24}:${m}`;

      const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      const label = `${h12}:${m.padStart(2, '0')} ${period}`;

      slots.push({ value, label });
    }
  }
  return slots;
};

export const TIME_SLOTS = generateTimeSlots();

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format 24-hour time to 12-hour display
export const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Parse 12-hour time to 24-hour format
export const parseTime12Hour = (time12: string): string => {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12;

  let [, hours, minutes, period] = match;
  let h = parseInt(hours, 10);

  if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (period.toUpperCase() === 'AM' && h === 12) h = 0;

  return `${h.toString().padStart(2, '0')}:${minutes}`;
};