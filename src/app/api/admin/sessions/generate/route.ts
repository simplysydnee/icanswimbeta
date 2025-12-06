import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  GenerateSessionsRequestSchema,
  GenerateSessionsResponse,
  Break
} from '@/types/session-generator';
import { SESSION_STATUS, SESSION_TYPE } from '@/config/constants';
import {
  format,
  parseISO,
  eachDayOfInterval,
  getDay
} from 'date-fns';
import { ZodError } from 'zod';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Combine a date and time string into an ISO datetime
 * Example: date=2024-12-10, time="15:00" → "2024-12-10T15:00:00.000Z"
 */
function combineDateAndTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined.toISOString();
}

/**
 * Add minutes to a time string
 * Example: time="15:00", minutes=30 → "15:30"
 */
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

/**
 * Compare two time strings (24-hour format)
 * Returns true if time1 is before time2
 */
function isTimeBefore(time1: string, time2: string): boolean {
  return time1 < time2;
}

/**
 * Check if a time slot overlaps with any break period
 * Example: slot 4:00-4:30 overlaps with break 4:15-4:45
 */
function isSlotInBreak(
  slotStart: string,
  slotEnd: string,
  breaks: Break[]
): boolean {
  for (const brk of breaks) {
    // Overlap exists if: slotStart < breakEnd AND slotEnd > breakStart
    if (slotStart < brk.endTime && slotEnd > brk.startTime) {
      return true;
    }
  }
  return false;
}

/**
 * Generate time slots for a day, handling breaks correctly
 * Requirements:
 * 1. All sessions are exactly the specified duration
 * 2. After a break ends, next session starts immediately at break end time
 * 3. If the last session would go past original endTime, extend endTime to fit the full session
 *
 * Example with 30-min sessions, 3:00 PM - 6:00 PM, break 4:00-4:10:
 * - 3:00-3:30
 * - 3:30-4:00
 * - BREAK 4:00-4:10
 * - 4:10-4:40 ← starts right when break ends
 * - 4:40-5:10
 * - 5:10-5:40
 * - 5:40-6:10 ← extends past 6:00 to complete full 30-min session
 */
function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  breaks: Break[]
): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  let currentStart = startTime;
  const originalEndTime = endTime; // Store original end time for comparison

  // Sort breaks by start time to process them in order
  const sortedBreaks = [...breaks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Keep creating slots until we reach or exceed the original end time
  while (isTimeBefore(currentStart, originalEndTime) || currentStart === originalEndTime) {
    const currentEnd = addMinutesToTime(currentStart, durationMinutes);

    // Check if this slot overlaps with any break
    let slotOverlapsBreak = false;
    let overlappingBreak: Break | null = null;

    for (const brk of sortedBreaks) {
      // Check for overlap: slot starts before break ends AND slot ends after break starts
      if (currentStart < brk.endTime && currentEnd > brk.startTime) {
        slotOverlapsBreak = true;
        overlappingBreak = brk;
        break;
      }
    }

    if (slotOverlapsBreak && overlappingBreak) {
      // If slot overlaps with a break, jump to the end of the break
      currentStart = overlappingBreak.endTime;
      continue; // Skip adding this slot and try again from after the break
    }

    // Add the slot (it doesn't overlap with any break)
    slots.push({ start: currentStart, end: currentEnd });

    // Move to next potential slot
    currentStart = currentEnd;
  }

  return slots;
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function POST(request: Request) {
  console.log('=== API: Generate sessions endpoint called ===');

  try {
    const supabase = await createClient();

    // ========== STEP 1: Authentication ==========
    // Check if user is logged in
    console.log('API: Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('API: Authentication failed -', authError?.message || 'No user');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('API: User authenticated -', user.email);

    // ========== STEP 2: Authorization ==========
    // Check if user has admin role
    console.log('API: Checking admin role for user', user.id);
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    console.log('API: Role query result -', { roleData, roleError });

    if (!roleData) {
      console.log('API: User is not an admin');
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    console.log('API: User is admin');

    // ========== STEP 3: Validation ==========
    // Parse request body and validate with Zod schema
    console.log('API: Parsing request body...');
    const body = await request.json();
    console.log('API: Request body:', body);

    console.log('API: Validating with Zod schema...');
    const validatedData = GenerateSessionsRequestSchema.parse(body);
    console.log('API: Validation successful');

    // Destructure validated data
    const {
      mode,
      startTime,
      endTime,
      durationMinutes,
      maxCapacity,
      location,
      instructorIds,
      allowedSwimLevels = [],
      breaks = [],
      notes,
    } = validatedData;

    // ========== STEP 4: Calculate Target Dates ==========
    // Generate unique batch ID to group these sessions
    const batchId = crypto.randomUUID();

    let targetDates: Date[] = [];

    if (mode === 'single' || mode === 'assessment') {
      // Single day only - use startDate
      targetDates = [parseISO(validatedData.startDate)];

    } else if (mode === 'repeating') {
      // Get all days in the date range
      const allDays = eachDayOfInterval({
        start: parseISO(validatedData.startDate),
        end: parseISO(validatedData.endDate),
      });

      // Filter to only the selected day of week (e.g., only Mondays)
      targetDates = allDays.filter(date => getDay(date) === validatedData.repeatDay);

      // Remove any blackout dates
      if (validatedData.blackoutDates?.length) {
        const blackoutSet = new Set(validatedData.blackoutDates);
        targetDates = targetDates.filter(
          date => !blackoutSet.has(format(date, 'yyyy-MM-dd'))
        );
      }
    }

    // Validate we have dates to work with
    if (targetDates.length === 0) {
      return NextResponse.json(
        { error: 'No valid dates found for the selected criteria' },
        { status: 400 }
      );
    }

    // ========== STEP 5: Generate Time Slots ==========
    const timeSlots = generateTimeSlots(startTime, endTime, durationMinutes, breaks);

    if (timeSlots.length === 0) {
      return NextResponse.json(
        { error: 'No time slots generated. Check that end time is after start time and breaks don\'t cover the entire range.' },
        { status: 400 }
      );
    }

    // ========== STEP 6: Build Session Records ==========
    // Create a session for each: instructor × date × time slot
    const sessions: Array<Record<string, unknown>> = [];
    const sessionsByInstructor: Record<string, number> = {};

    for (const instructorId of instructorIds) {
      sessionsByInstructor[instructorId] = 0;

      for (const date of targetDates) {
        for (const slot of timeSlots) {
          sessions.push({
            id: crypto.randomUUID(),
            instructor_id: instructorId,
            start_time: combineDateAndTime(date, slot.start),
            end_time: combineDateAndTime(date, slot.end),
            day_of_week: getDay(date).toString(), // Convert number to string
            month_year: format(date, 'yyyy-MM'),
            location: location,
            max_capacity: maxCapacity,
            booking_count: 0,
            is_full: false,
            session_type: mode === 'assessment' ? SESSION_TYPE.ASSESSMENT : SESSION_TYPE.LESSON,
            session_type_detail: null, // Added missing column
            status: SESSION_STATUS.DRAFT, // Always start as draft
            price_cents: 7500, // Default price
            is_recurring: mode === 'repeating',
            recurrence_pattern: mode === 'repeating' ? 'weekly' : null,
            batch_id: batchId,
            allowed_swim_levels: allowedSwimLevels.length > 0 ? allowedSwimLevels : null,
            notes: notes || null, // Changed from notes_tags to notes
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            open_at: null,
          });

          sessionsByInstructor[instructorId]++;
        }
      }
    }

    // ========== STEP 7: Insert Into Database ==========
    console.log(`API: Attempting to insert ${sessions.length} sessions into database...`);
    console.log('API: First session sample:', sessions[0]);

    const { error: insertError } = await supabase
      .from('sessions')
      .insert(sessions);

    if (insertError) {
      console.error('API: Session insert error:', insertError);
      console.error('API: Insert error details:', insertError.details, insertError.hint);
      return NextResponse.json(
        { error: `Failed to create sessions: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log(`API: Successfully inserted ${sessions.length} sessions`);

    // ========== STEP 8: Return Success Response ==========
    const response: GenerateSessionsResponse = {
      success: true,
      sessionsCreated: sessions.length,
      sessionsByInstructor,
      batchId,
      mode,
      dates: targetDates.map(d => format(d, 'yyyy-MM-dd')),
    };

    console.log(`✅ Generated ${sessions.length} sessions (batch: ${batchId})`);

    return NextResponse.json(response);

  } catch (error) {
    // Handle Zod validation errors specially
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      );
    }

    // Handle all other errors
    console.error('Generate sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}