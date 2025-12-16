import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SESSION_STATUS } from '@/config/constants';

interface UpdateSessionRequest {
  start_time?: string;
  end_time?: string;
  instructor_id?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
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
    // Check if user has admin role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // ========== STEP 3: Parse Request Body ==========
    const body = await request.json();
    const { start_time, end_time, instructor_id }: UpdateSessionRequest = body;

    // Validate at least one field is being updated
    if (!start_time && !end_time && !instructor_id) {
      return NextResponse.json(
        { error: 'No fields to update provided' },
        { status: 400 }
      );
    }

    // ========== STEP 4: Validate Session Exists and is Draft ==========
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return NextResponse.json(
        { error: `Session not found: ${sessionError.message}` },
        { status: 404 }
      );
    }

    if (session.status !== SESSION_STATUS.DRAFT) {
      return NextResponse.json(
        { error: 'Only draft sessions can be edited' },
        { status: 400 }
      );
    }

    // ========== STEP 5: Validate Time Logic ==========
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);

      if (end <= start) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    // ========== STEP 6: Validate Instructor Exists ==========
    if (instructor_id) {
      const { data: instructor, error: instructorError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', instructor_id)
        .single();

      if (instructorError || !instructor) {
        return NextResponse.json(
          { error: 'Instructor not found' },
          { status: 400 }
        );
      }
    }

    // ========== STEP 7: Build Update Object ==========
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (start_time) updates.start_time = start_time;
    if (end_time) updates.end_time = end_time;
    if (instructor_id) updates.instructor_id = instructor_id;

    // Update day_of_week if date changed
    if (start_time) {
      const newDate = new Date(start_time);
      updates.day_of_week = newDate.getDay().toString();
    }

    // ========== STEP 8: Update Session ==========
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('status', SESSION_STATUS.DRAFT) // Ensure still draft
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json(
        { error: `Failed to update session: ${updateError.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 9: Return Response ==========
    console.log(`✅ Updated session ${sessionId}`);

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });

  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}