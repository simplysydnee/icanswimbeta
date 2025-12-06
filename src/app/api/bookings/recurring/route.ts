import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parentId = user.id;
    const { swimmerId, sessionIds } = await request.json();
    if (!swimmerId || !sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
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

    // Validate all sessions are available
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, start_time, end_time, status, is_full, max_capacity, booking_count, instructor_id, location')
      .in('id', sessionIds)
      .in('status', ['available', 'open'])
      .eq('is_full', false);

    const availableSessionIds = sessions?.map(s => s.id) || [];
    const unavailableSessionIds = sessionIds.filter(id => !availableSessionIds.includes(id));
    if (unavailableSessionIds.length > 0) {
      return NextResponse.json({
        error: 'Some sessions are not available',
        unavailableSessionIds,
        availableSessionIds,
      }, { status: 400 });
    }

    // VMRC POS validation
    let activePoId: string | null = null;
    if (isVmrcClient) {
      const { data: purchaseOrders } = await supabase
        .from('purchase_orders')
        .select('id, allowed_lessons, lessons_booked')
        .eq('swimmer_id', swimmerId)
        .eq('status', 'approved')
        .order('end_date', { ascending: true })
        .limit(1);

      if (!purchaseOrders || purchaseOrders.length === 0) {
        return NextResponse.json({ error: 'No valid VMRC authorization' }, { status: 400 });
      }

      const activePo = purchaseOrders[0];
      const remainingSessions = activePo.allowed_lessons - (activePo.lessons_booked || 0);
      if (remainingSessions < sessionIds.length) {
        return NextResponse.json({
          error: 'Not enough VMRC sessions available',
          remainingSessions,
          requestedSessions: sessionIds.length,
        }, { status: 400 });
      }
      activePoId = activePo.id;
    }

    // Create bookings
    const bookings = [];
    for (const sessionId of sessionIds) {
      const session = sessions!.find(s => s.id === sessionId);
      if (!session) continue;

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

      if (bookingError) {
        // Rollback all created bookings
        for (const createdBooking of bookings) {
          await supabase.from('bookings').delete().eq('id', createdBooking.id);
        }
        return NextResponse.json({ error: `Failed to create booking for session ${sessionId}` }, { status: 500 });
      }

      bookings.push(booking);

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
        for (const createdBooking of bookings) {
          await supabase.from('bookings').delete().eq('id', createdBooking.id);
        }
        return NextResponse.json({ error: `Failed to update session ${sessionId}` }, { status: 500 });
      }
    }

    // Update VMRC PO if applicable
    if (isVmrcClient && activePoId) {
      await supabase
        .from('purchase_orders')
        .update({ lessons_booked: supabase.raw(`lessons_booked + ${sessionIds.length}`) })
        .eq('id', activePoId);
    }

    return NextResponse.json({
      success: true,
      bookingsCreated: bookings.length,
      bookings: bookings.map(b => ({
        id: b.id,
        sessionId: b.session_id,
        status: b.status,
        createdAt: b.created_at,
      })),
      totalSessions: sessionIds.length,
      isVmrcClient,
    });

  } catch (error) {
    console.error('Recurring booking creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}