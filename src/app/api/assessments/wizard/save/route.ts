import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['admin', 'instructor'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      swimmerId,
      bookingId,
      sessionId,
      instructor,
      assessmentDate,
      strengths,
      challenges,
      swimSkills,
      roadblocks,
      swimSkillsGoals,
      safetyGoals,
      lessonDate,
      attendanceStatus,
      lessonSummary,
      swimmerMood,
      waterComfort,
      instructorNotesPrivate,
      parentNotes,
      sharedWithParent,
    } = body;

    if (!swimmerId || !bookingId || !assessmentDate) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'swimmerId, bookingId, and assessmentDate are required' },
        { status: 400 }
      );
    }

    // Guard: refuse to save a draft for a swimmer whose assessment is no
    // longer in a scheduled / in-progress state.
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .select('id, assessment_status')
      .eq('id', swimmerId)
      .single();

    if (swimmerError || !swimmer) {
      return NextResponse.json(
        {
          error: 'Swimmer not found',
          details: swimmerError?.message,
          code: swimmerError?.code,
        },
        { status: 404 }
      );
    }

    if (swimmer.assessment_status === 'completed') {
      return NextResponse.json(
        {
          error: 'Swimmer assessment is already completed',
          details: `assessment_status is '${swimmer.assessment_status}'`,
        },
        { status: 409 }
      );
    }

    // Determine if Step 5 has any content worth persisting to progress_notes.
    const hasNoteContent = !!(
      (lessonSummary && lessonSummary.trim().length > 0) ||
      (instructorNotesPrivate && instructorNotesPrivate.trim().length > 0) ||
      (parentNotes && parentNotes.trim().length > 0) ||
      swimmerMood ||
      waterComfort ||
      (attendanceStatus && attendanceStatus !== 'present')
    );

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'save_assessment_draft',
      {
        p_caller_id: user.id,
        p_swimmer_id: swimmerId,
        p_booking_id: bookingId,
        p_session_id: sessionId || null,
        p_instructor_id: user.id,
        p_assessment_date: new Date(assessmentDate).toISOString().split('T')[0],
        p_strengths: strengths || '',
        p_challenges: challenges || '',
        p_swim_skills: swimSkills || {},
        p_roadblocks: roadblocks || {},
        p_swim_skills_goals: swimSkillsGoals || '',
        p_safety_goals: safetyGoals || '',
        p_lesson_date: lessonDate || null,
        p_attendance_status: attendanceStatus || 'present',
        p_lesson_summary: lessonSummary || '',
        p_swimmer_mood: swimmerMood || '',
        p_water_comfort: waterComfort || '',
        p_instructor_notes_private: instructorNotesPrivate || '',
        p_parent_notes: parentNotes || '',
        p_shared_with_parent: !!sharedWithParent,
        p_has_note_content: hasNoteContent,
      }
    );

    if (rpcError) {
      console.error('save_assessment_draft RPC error:', rpcError);
      return NextResponse.json(
        {
          error: 'Failed to save draft',
          details: rpcError.message,
          code: rpcError.code,
          hint: rpcError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...((rpcResult as any) || {}),
    });
  } catch (error) {
    console.error('Unexpected error in wizard/save:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
