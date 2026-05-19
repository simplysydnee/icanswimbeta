import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PostgREST returns embedded resources as either a single object or an array
// depending on the relationship cardinality detected at runtime. Treat both
// shapes defensively.
function pick<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole) {
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 404 }
      );
    }

    // Get assessment booking details. Uses Supabase aliasing syntax
    // (`alias:column`, NOT `column as alias` — the latter was silently
    // dropping fields in the previous version), and !inner so the
    // session_type='assessment' filter actually restricts parent rows.
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        session_id,
        swimmer_id,
        parent_id,
        booking_status:status,
        created_at,
        sessions!inner (
          id,
          start_time,
          end_time,
          instructor_id,
          location,
          session_type,
          session_status:status,
          instructor:profiles!sessions_instructor_id_fkey (
            id,
            full_name
          )
        ),
        swimmers!inner (
          id,
          first_name,
          last_name,
          date_of_birth,
          comfortable_in_water,
          current_level_id,
          payment_type,
          funding_source_id,
          funding_coordinator_name,
          assessment_status,
          enrollment_status,
          has_allergies,
          allergies_description,
          has_medical_conditions,
          medical_conditions_description,
          diagnosis,
          previous_swim_lessons,
          swim_goals,
          parent:profiles!swimmers_parent_id_fkey (
            id,
            full_name,
            email
          ),
          funding_source:funding_sources (
            id,
            name
          ),
          current_level:swim_levels!swimmers_current_level_id_fkey (
            id,
            name,
            display_name
          )
        )
      `)
      .eq('id', id)
      .eq('sessions.session_type', 'assessment')
      .maybeSingle();

    if (error) {
      console.error('Error fetching assessment detail:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch assessment',
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Assessment not found', details: `No assessment booking with id ${id}` },
        { status: 404 }
      );
    }

    const session = pick<any>((booking as any).sessions);
    const swimmer = pick<any>((booking as any).swimmers);

    if (!session || !swimmer) {
      return NextResponse.json(
        {
          error: 'Assessment not found',
          details: 'Booking record has no linked session or swimmer.',
        },
        { status: 404 }
      );
    }

    // Check if user has permission
    // Admin can see all, instructor can only see their own assessments
    if (
      userRole.role === 'instructor' &&
      session.instructor_id !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parent = pick<any>(swimmer.parent);
    const instructor = pick<any>(session.instructor);
    const currentLevel = pick<any>(swimmer.current_level);
    const fundingSource = pick<any>(swimmer.funding_source);

    // Calculate age
    let age = 0;
    if (swimmer.date_of_birth) {
      const birthDate = new Date(swimmer.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Pull the wizard-captured details. The assessment_reports row is keyed
    // by booking_id (added in 20260519000003); the progress_notes row by
    // (swimmer_id, booking_id). Either may not exist yet for assessments
    // that haven't reached even Step 1 of the wizard.
    const { data: report } = await supabase
      .from('assessment_reports')
      .select(
        'id, strengths, challenges, swim_skills, roadblocks, swim_skills_goals, safety_goals, approval_status, created_at, updated_at'
      )
      .eq('booking_id', booking.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: note } = await supabase
      .from('progress_notes')
      .select(
        'id, lesson_date, attendance_status, lesson_summary, swimmer_mood, water_comfort, instructor_notes, parent_notes, shared_with_parent, created_at, updated_at'
      )
      .eq('swimmer_id', swimmer.id)
      .eq('booking_id', booking.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const assessment = {
      id: booking.id,
      session_id: session.id,
      swimmer_id: swimmer.id,
      swimmer_name: `${swimmer.first_name} ${swimmer.last_name}`,
      swimmer_age: age,
      parent_name: parent?.full_name || 'Unknown',
      parent_email: parent?.email || '',
      start_time: session.start_time,
      end_time: session.end_time,
      instructor_id: session.instructor_id,
      instructor_name: instructor?.full_name || 'Unknown',
      location: session.location,
      status: (booking as any).booking_status as 'scheduled' | 'completed' | 'cancelled',
      assessment_status: swimmer.assessment_status,
      comfortable_in_water: swimmer.comfortable_in_water,
      current_level_id: swimmer.current_level_id,
      current_level_name: currentLevel?.display_name || null,
      payment_type: swimmer.payment_type,
      is_funded_client: swimmer.payment_type === 'funded' || !!swimmer.funding_source_id,
      funding_source_name: fundingSource?.name || null,
      coordinator_name: swimmer.funding_coordinator_name,
      has_allergies: swimmer.has_allergies,
      allergies_description: swimmer.allergies_description,
      has_medical_conditions: swimmer.has_medical_conditions,
      medical_conditions_description: swimmer.medical_conditions_description,
      diagnosis: swimmer.diagnosis || [],
      previous_swim_lessons: swimmer.previous_swim_lessons,
      swim_goals: swimmer.swim_goals || [],
      // Wizard-captured detail
      report: report
        ? {
            id: report.id,
            strengths: report.strengths || '',
            challenges: report.challenges || '',
            swim_skills: report.swim_skills || {},
            roadblocks: report.roadblocks || {},
            swim_skills_goals: report.swim_skills_goals || '',
            safety_goals: report.safety_goals || '',
            approval_status: report.approval_status || null,
            created_at: report.created_at,
            updated_at: report.updated_at,
          }
        : null,
      note: note
        ? {
            id: note.id,
            lesson_date: note.lesson_date,
            attendance_status: note.attendance_status,
            lesson_summary: note.lesson_summary || '',
            swimmer_mood: note.swimmer_mood || '',
            water_comfort: note.water_comfort || '',
            instructor_notes: note.instructor_notes || '',
            parent_notes: note.parent_notes || '',
            shared_with_parent: !!note.shared_with_parent,
            created_at: note.created_at,
            updated_at: note.updated_at,
          }
        : null,
    };

    return NextResponse.json(assessment);

  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
