import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is instructor or admin using has_role() function
    // Note: We need to check both roles since the function only checks one role at a time
    const { data: isAdmin } = await supabase.rpc('has_role', {
      user_id: user.id,
      check_role: 'admin'
    });

    const { data: isInstructor } = await supabase.rpc('has_role', {
      user_id: user.id,
      check_role: 'instructor'
    });

    if (!isAdmin && !isInstructor) {
      return NextResponse.json({ error: 'Instructor or admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      sessionId,
      bookingId,
      swimmerId,
      lessonSummary,
      instructorNotes,
      parentNotes,
      skillsWorkingOn = [],
      skillsMastered = [],
      currentLevelId,
      sharedWithParent = false,
      attendanceStatus = 'present',
      swimmerMood,
      waterComfort,
      focusLevel,
    } = body;

    // Validate required fields
    if (!sessionId || !bookingId || !swimmerId || !lessonSummary) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, bookingId, swimmerId, lessonSummary' },
        { status: 400 }
      );
    }

    // Verify instructor taught this session
    const { data: session } = await supabase
      .from('sessions')
      .select('instructor_id')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.instructor_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to update this session' }, { status: 403 });
    }

    // Check if progress note already exists for this booking
    const { data: existingNote } = await supabase
      .from('progress_notes')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    let result;
    if (existingNote) {
      // Update existing progress note
      const { data, error } = await supabase
        .from('progress_notes')
        .update({
          lesson_summary: lessonSummary,
          instructor_notes: instructorNotes,
          parent_notes: parentNotes,
          skills_working_on: skillsWorkingOn,
          skills_mastered: skillsMastered,
          current_level_id: currentLevelId,
          shared_with_parent: sharedWithParent,
          attendance_status: attendanceStatus,
          swimmer_mood: swimmerMood,
          water_comfort: waterComfort,
          focus_level: focusLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingNote.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating progress note:', error);
        return NextResponse.json({ error: 'Failed to update progress note' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new progress note
      const { data, error } = await supabase
        .from('progress_notes')
        .insert({
          session_id: sessionId,
          booking_id: bookingId,
          swimmer_id: swimmerId,
          instructor_id: user.id,
          lesson_summary: lessonSummary,
          instructor_notes: instructorNotes,
          parent_notes: parentNotes,
          skills_working_on: skillsWorkingOn,
          skills_mastered: skillsMastered,
          current_level_id: currentLevelId,
          shared_with_parent: sharedWithParent,
          attendance_status: attendanceStatus,
          swimmer_mood: swimmerMood,
          water_comfort: waterComfort,
          focus_level: focusLevel,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating progress note:', error);
        return NextResponse.json({ error: 'Failed to create progress note' }, { status: 500 });
      }
      result = data;
    }

    // Update swimmer_skills table for mastered skills
    if (skillsMastered.length > 0) {
      for (const skillId of skillsMastered) {
        // Check if skill record exists
        const { data: existingSkill } = await supabase
          .from('swimmer_skills')
          .select('id')
          .eq('swimmer_id', swimmerId)
          .eq('skill_id', skillId)
          .single();

        if (existingSkill) {
          // Update existing skill
          await supabase
            .from('swimmer_skills')
            .update({
              status: 'mastered',
              date_mastered: new Date().toISOString(),
              instructor_notes: instructorNotes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSkill.id);
        } else {
          // Create new skill record
          await supabase
            .from('swimmer_skills')
            .insert({
              swimmer_id: swimmerId,
              skill_id: skillId,
              status: 'mastered',
              date_mastered: new Date().toISOString(),
              instructor_notes: instructorNotes,
            });
        }
      }
    }

    // Update swimmer_skills table for skills being worked on
    if (skillsWorkingOn.length > 0) {
      for (const skillId of skillsWorkingOn) {
        // Skip if already mastered
        if (skillsMastered.includes(skillId)) continue;

        // Check if skill record exists
        const { data: existingSkill } = await supabase
          .from('swimmer_skills')
          .select('id, status, date_started')
          .eq('swimmer_id', swimmerId)
          .eq('skill_id', skillId)
          .single();

        if (existingSkill) {
          // Only update if not already mastered
          if (existingSkill.status !== 'mastered') {
            // Check if we need to set date_started (when status changes to in_progress)
            const updateData: any = {
              status: 'in_progress',
              instructor_notes: instructorNotes,
              updated_at: new Date().toISOString(),
            };

            // Set date_started if status is changing to in_progress and date_started is not set
            if (existingSkill.status !== 'in_progress' && !existingSkill.date_started) {
              updateData.date_started = new Date().toISOString();
            }

            await supabase
              .from('swimmer_skills')
              .update(updateData)
              .eq('id', existingSkill.id);
          }
        } else {
          // Create new skill record
          await supabase
            .from('swimmer_skills')
            .insert({
              swimmer_id: swimmerId,
              skill_id: skillId,
              status: 'in_progress',
              instructor_notes: instructorNotes,
              date_started: new Date().toISOString(),
            });
        }
      }
    }

    // Update session status to completed
    await supabase
      .from('sessions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Update booking status to completed
    await supabase
      .from('bookings')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      progressNote: result,
      message: existingNote ? 'Progress note updated' : 'Progress note created',
    });

  } catch (error) {
    console.error('Unexpected error in progress notes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const swimmerId = searchParams.get('swimmerId');
    const sessionId = searchParams.get('sessionId');
    const bookingId = searchParams.get('bookingId');

    let query = supabase
      .from('progress_notes')
      .select(`
        *,
        swimmers(first_name, last_name),
        sessions(start_time, end_time, location),
        swim_levels(name, display_name, color)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (swimmerId) {
      query = query.eq('swimmer_id', swimmerId);
    }
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }

    // RLS policies handle authorization:
    // - Admins can view all notes (has_role(auth.uid(), 'admin'))
    // - Instructors can view their own notes (instructor_id = auth.uid())
    // - Parents can view notes shared with them (shared_with_parent = true AND auth.uid() IN (SELECT swimmers.parent_id FROM swimmers WHERE swimmers.id = progress_notes.swimmer_id))
    // No additional filtering needed in API

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching progress notes:', error);
      return NextResponse.json({ error: 'Failed to fetch progress notes' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Unexpected error in progress notes GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}