import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const body = await request.json();
    const { close_reason, close_reason_notes } = body;

    if (!close_reason || !['pool_closed', 'instructor_unavailable', 'other'].includes(close_reason)) {
      return NextResponse.json(
        { error: 'Valid close reason required: pool_closed, instructor_unavailable, or other' },
        { status: 400 }
      );
    }

    if (close_reason === 'other' && !close_reason_notes) {
      return NextResponse.json(
        { error: 'Additional notes required when reason is "other"' },
        { status: 400 }
      );
    }

    // Get session with bookings
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        instructor:profiles!instructor_id(full_name),
        bookings(
          id,
          status,
          swimmer:swimmers(id, first_name, last_name, parent_id),
          parent:profiles!parent_id(id, full_name, email)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Validate session can be closed
    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Cannot close a completed session' }, { status: 400 });
    }
    if (session.status === 'closed') {
      return NextResponse.json({ error: 'Session already closed' }, { status: 400 });
    }

    // Update session status to closed
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'closed',
        close_reason,
        close_reason_notes: close_reason_notes || null,
        closed_at: new Date().toISOString(),
        closed_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // Cancel all active bookings
    const activeBookings = session.bookings?.filter((b: any) =>
      b.status === 'confirmed' || b.status === 'booked'
    ) || [];

    let floatingSessionsCreated = 0;
    for (const booking of activeBookings) {
      // Update booking status
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancel_reason: 'session_closed',
          cancel_source: 'admin',
          canceled_at: new Date().toISOString(),
          canceled_by: user.id
        })
        .eq('id', booking.id);

      // Create floating session for makeup lesson (if applicable)
      // Follow pattern from other cancellation endpoints
      const { data: floatingSession } = await supabase
        .from('floating_sessions')
        .insert({
          original_session_id: sessionId,
          original_booking_id: booking.id,
          available_until: session.start_time,
          month_year: new Date(session.start_time).toISOString().slice(0, 7), // YYYY-MM
          status: 'available',
          swimmer_id: booking.swimmer?.id,
          parent_id: booking.parent?.id
        })
        .select('id')
        .single();

      if (floatingSession) {
        floatingSessionsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Session closed successfully. ${activeBookings.length} bookings cancelled.`,
      cancelled_bookings: activeBookings.length,
      floating_sessions_created: floatingSessionsCreated
    });
  } catch (error: any) {
    console.error('Error closing session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}