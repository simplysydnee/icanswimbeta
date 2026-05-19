import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId query param is required' },
        { status: 400 }
      );
    }

    const { data: assessmentRow, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, swimmer_id, instructor_id, assessment_date, status, session_id, booking_id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (assessmentError) {
      console.error('Error reading assessments row:', assessmentError);
      return NextResponse.json(
        {
          error: 'Failed to read draft',
          details: assessmentError.message,
          code: assessmentError.code,
        },
        { status: 500 }
      );
    }

    if (!assessmentRow || assessmentRow.status === 'completed') {
      return NextResponse.json({ exists: false });
    }

    // Pull the granular fields from assessment_reports (if any) by
    // (swimmer_id, assessment_date), matching the upsert key.
    const { data: reportRow, error: reportError } = await supabase
      .from('assessment_reports')
      .select(
        'id, strengths, challenges, swim_skills, roadblocks, swim_skills_goals, safety_goals, approval_status'
      )
      .eq('swimmer_id', assessmentRow.swimmer_id)
      .eq('assessment_date', assessmentRow.assessment_date)
      .maybeSingle();

    if (reportError) {
      console.error('Error reading assessment_reports row:', reportError);
      return NextResponse.json(
        {
          error: 'Failed to read draft',
          details: reportError.message,
          code: reportError.code,
        },
        { status: 500 }
      );
    }

    // Pull Step-5 progress note (if any) by (swimmer_id, booking_id).
    const { data: noteRow } = await supabase
      .from('progress_notes')
      .select(
        'lesson_date, attendance_status, lesson_summary, swimmer_mood, water_comfort, instructor_notes, parent_notes, shared_with_parent'
      )
      .eq('swimmer_id', assessmentRow.swimmer_id)
      .eq('booking_id', bookingId)
      .maybeSingle();

    return NextResponse.json({
      exists: true,
      assessmentId: assessmentRow.id,
      assessmentReportId: reportRow?.id || null,
      // Granular fields the wizard's AssessmentData consumes:
      strengths: reportRow?.strengths || '',
      challenges: reportRow?.challenges || '',
      swimSkills: reportRow?.swim_skills || {},
      roadblocks: reportRow?.roadblocks || {},
      swimSkillsGoals: reportRow?.swim_skills_goals || '',
      safetyGoals: reportRow?.safety_goals || '',
      // Step 5
      lessonDate: noteRow?.lesson_date || null,
      attendanceStatus: noteRow?.attendance_status || 'present',
      lessonSummary: noteRow?.lesson_summary || '',
      swimmerMood: noteRow?.swimmer_mood || '',
      waterComfort: noteRow?.water_comfort || '',
      instructorNotesPrivate: noteRow?.instructor_notes || '',
      parentNotes: noteRow?.parent_notes || '',
      sharedWithParent: !!noteRow?.shared_with_parent,
    });
  } catch (error) {
    console.error('Unexpected error in wizard/draft:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
