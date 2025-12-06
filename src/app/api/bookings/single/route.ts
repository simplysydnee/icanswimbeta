import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parentId = user.id;
    const { swimmerId, sessionId } = await request.json();
    if (!swimmerId || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate swimmer belongs to parent
    const { data: swimmer } = await supabase
      .from('swimmers')
      .select('id, is_vmrc_client')
      .eq('id', swimmerId)
      .eq('parent_id', parentId)
      .single();
    if (!swimmer) return NextResponse.json({ error: 'Swimmer not authorized' }, { status: 403 });

    const isVmrcClient = swimmer.is_vmrc_client;

    // Check session availability
    const { data: session } = await supabase
      .from('sessions')
      .select('id, start_time, end_time, status, is_full, max_capacity, booking_count, instructor_id, location')
      .eq('id', sessionId)
      .in('status', ['available', 'open'])
      .eq('is_full', false)
      .single();
    if (!session) return NextResponse.json({ error: 'Session not available' }, { status: 400 });

    // VMRC POS validation
    let activePoId: string | null = null;
    if (isVmrcClient) {
      const { data: purchaseOrders } = await supabase
        .from('purchase_orders')
        .select('id, allowed_lessons, lessons_booked')
        .eq('swimmer_id', swimmerId)
        .eq('status', 'approved')
        .lte('start_date', session.start_time)
        .gte('end_date', session.start_time)
        .order('end_date', { ascending: true })
        .limit(1);

      if (!purchaseOrders || purchaseOrders.length === 0) {
        return NextResponse.json({ error: 'No valid VMRC authorization' }, { status: 400 });
      }

      const activePo = purchaseOrders[0];
      if (activePo.lessons_booked >= activePo.allowed_lessons) {
        return NextResponse.json({ error: 'VMRC authorization exhausted' }, { status: 400 });
      }
      activePoId = activePo.id;
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        session_id: sessionId,
        swimmer_id: swimmerId,
        parent_id: parentId,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (bookingError) return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });

    // Update session
    const newBookingCount = (session.booking_count || 0) + 1;
    const isFull = newBookingCount >= session.max_capacity;
    const { error: sessionUpdateError } = await supabase
      .from('sessions')
      .update({
        booking_count: newBookingCount,
        is_full: isFull,
        status: isFull ? 'booked' : session.status,
      })
      .eq('id', sessionId);

    if (sessionUpdateError) {
      await supabase.from('bookings').delete().eq('id', booking.id);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    // Update VMRC PO if applicable
    if (isVmrcClient && activePoId) {
      await supabase
        .from('purchase_orders')
        .update({ lessons_booked: supabase.raw('lessons_booked + 1') })
        .eq('id', activePoId);
    }

    return NextResponse.json({
      success: true,
      booking,
      session: {
        id: session.id,
        startTime: session.start_time,
        endTime: session.end_time,
        instructorId: session.instructor_id,
        location: session.location,
        status: isFull ? 'booked' : session.status,
      },
      isVmrcClient,
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}