import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { DEFAULT_FUNDING_SOURCE_CONFIG } from '@/lib/constants';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission (admin or instructor)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      recommended_level_id,
      water_comfort,
      skills_observed,
      instructor_notes,
      ready_for_lessons,
    } = body;

    // Validate required fields
    if (!recommended_level_id || !instructor_notes?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the assessment booking details
    const { data: assessmentBooking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        session_id,
        swimmer_id,
        parent_id,
        status,
        sessions (
          id,
          start_time,
          end_time,
          session_type,
          status
        ),
        swimmers (
          id,
          first_name,
          last_name,
          payment_type,
          funding_source_id,
          current_level_id,
          assessment_status,
          enrollment_status,
          funded_sessions_used,
          funded_sessions_authorized,
          current_po_number,
          po_expires_at
        )
      `)
      .eq('id', id)
      .single();

    if (bookingError || !assessmentBooking) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check if assessment is already completed
    if (assessmentBooking.status === 'completed') {
      return NextResponse.json(
        { error: 'Assessment already completed' },
        { status: 400 }
      );
    }

    // Start a transaction
    const { error: transactionError } = await supabase.rpc('complete_assessment_transaction', {
      p_booking_id: id,
      p_session_id: assessmentBooking.session_id,
      p_swimmer_id: assessmentBooking.swimmer_id,
      p_recommended_level_id: recommended_level_id,
      p_water_comfort: water_comfort,
      p_skills_observed: skills_observed,
      p_instructor_notes: instructor_notes,
      p_ready_for_lessons: ready_for_lessons,
      p_completed_by: user.id,
    });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to complete assessment' },
        { status: 500 }
      );
    }

    // Check if swimmer is funded and create PO if needed
    const swimmer = assessmentBooking.swimmers;
    if (swimmer.payment_type === 'funded' || swimmer.funding_source_id) {
      await createLessonsPO(
        supabase,
        swimmer.id,
        swimmer.funding_source_id,
        user.id,
        assessmentBooking.parent_id
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment completed successfully',
    });

  } catch (error) {
    console.error('Error completing assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createLessonsPO(
  supabase: any,
  swimmerId: string,
  fundingSourceId: string | null,
  completedBy: string,
  parentId: string
) {
  try {
    // Calculate PO dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + DEFAULT_FUNDING_SOURCE_CONFIG.PO_DURATION_MONTHS);

    // Generate PO number
    const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create PO record
    const { error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        swimmer_id: swimmerId,
        funding_source_id: fundingSourceId,
        parent_id: parentId,
        created_by: completedBy,
        po_type: 'lessons',
        po_number: poNumber,
        authorized_sessions: DEFAULT_FUNDING_SOURCE_CONFIG.LESSONS_PER_PO,
        used_sessions: 0,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'pending',
        notes: 'Automatically created after assessment completion',
      });

    if (poError) {
      console.error('Error creating PO:', poError);
      // Don't fail the whole request if PO creation fails
      return;
    }

    // Update swimmer's PO info
    const { error: swimmerError } = await supabase
      .from('swimmers')
      .update({
        current_po_number: poNumber,
        po_expires_at: endDate.toISOString(),
        funded_sessions_authorized: DEFAULT_FUNDING_SOURCE_CONFIG.LESSONS_PER_PO,
        funded_sessions_used: 0,
      })
      .eq('id', swimmerId);

    if (swimmerError) {
      console.error('Error updating swimmer PO info:', swimmerError);
    }

  } catch (error) {
    console.error('Error in createLessonsPO:', error);
  }
}