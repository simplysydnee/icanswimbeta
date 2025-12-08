import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SESSION_STATUS } from '@/config/constants';

interface DraftSession {
  id: string;
  instructor_id: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
  location: string;
  max_capacity: number;
  booking_count: number;
  is_full: boolean;
  session_type: string;
  status: string;
  price_cents: number;
  batch_id: string;
  created_at: string;
  updated_at: string;
  open_at: string | null;
  instructor_name?: string;
}

interface BatchGroup {
  batch_id: string;
  created_at: string;
  session_count: number;
  date_range: {
    start: string;
    end: string;
  };
  location: string;
  instructor: {
    id: string;
    name: string;
  };
  sessions: DraftSession[];
}

interface DraftSessionsResponse {
  batches: BatchGroup[];
}

export async function GET() {
  try {
    const supabase = await createClient();

    // ========== STEP 1: Authentication ==========
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ========== STEP 2: Authorization ==========
    // Check if user is admin using user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // ========== STEP 3: Fetch Draft Sessions ==========
    // Get all draft sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', SESSION_STATUS.DRAFT)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching draft sessions:', sessionsError);
      return NextResponse.json(
        { error: `Failed to fetch draft sessions: ${sessionsError.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 4: Get Instructor Information ==========
    // Get unique instructor IDs from sessions
    const instructorIds = [...new Set(sessions.map(s => s.instructor_id).filter(Boolean))];

    let instructorsMap = new Map<string, { id: string; name: string }>();

    if (instructorIds.length > 0) {
      const { data: instructorProfiles, error: instructorsError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', instructorIds);

      if (instructorsError) {
        console.error('Error fetching instructor profiles:', instructorsError);
        // Continue without instructor names - they'll show as "Unknown Instructor"
      } else if (instructorProfiles) {
        instructorProfiles.forEach(profile => {
          instructorsMap.set(profile.id, {
            id: profile.id,
            name: profile.full_name || 'Unknown Instructor'
          });
        });
      }
    }

    // ========== STEP 5: Group by Batch ID ==========
    const batchesMap = new Map<string, BatchGroup>();

    for (const session of sessions) {
      const batchId = session.batch_id;

      if (!batchId) {
        // Skip sessions without batch_id (shouldn't happen for drafts)
        continue;
      }

      if (!batchesMap.has(batchId)) {
        // Create new batch group
        const instructor = instructorsMap.get(session.instructor_id) || {
          id: session.instructor_id,
          name: 'Unknown Instructor'
        };

        batchesMap.set(batchId, {
          batch_id: batchId,
          created_at: session.created_at,
          session_count: 0,
          date_range: {
            start: session.start_time,
            end: session.start_time, // Will be updated as we process more sessions
          },
          location: session.location,
          instructor: instructor,
          sessions: [],
        });
      }

      const batch = batchesMap.get(batchId)!;

      // Update session count
      batch.session_count++;

      // Update date range
      const sessionDate = new Date(session.start_time);
      const currentStart = new Date(batch.date_range.start);
      const currentEnd = new Date(batch.date_range.end);

      if (sessionDate < currentStart) {
        batch.date_range.start = session.start_time;
      }
      if (sessionDate > currentEnd) {
        batch.date_range.end = session.start_time;
      }

      // Add session to batch with instructor name
      batch.sessions.push({
        ...session,
        instructor_name: batch.instructor.name,
      });
    }

    // ========== STEP 5: Convert Map to Array and Sort ==========
    const batches = Array.from(batchesMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // ========== STEP 6: Return Response ==========
    const response: DraftSessionsResponse = {
      batches,
    };

    console.log(`✅ Fetched ${batches.length} draft batches with ${sessions.length} total sessions`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get draft sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}