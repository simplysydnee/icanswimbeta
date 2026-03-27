import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { emailService } from '@/lib/email-service';
import { format } from 'date-fns';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing Supabase env (service role)');
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const serviceSupabase = getServiceSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parentId = user.id;
    const { swimmerId, sessionId } = await request.json();
    if (!swimmerId || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate swimmer belongs to parent
    const { data: swimmer } = await serviceSupabase
      .from('swimmers')
      .select('id, funding_source_id, flexible_swimmer, is_semi_private, enrollment_status, first_name, last_name')
      .eq('id', swimmerId)
      .eq('parent_id', parentId)
      .single();
    if (!swimmer) return NextResponse.json({ error: 'Swimmer not authorized' }, { status: 403 });

    // Check for booking conflicts
    // const conflictResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/check-conflict`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ swimmerId, sessionId }),
    // });

    // const conflictData = await conflictResponse.json();
    // if (conflictData.hasConflict) {
    //   return NextResponse.json({ error: conflictData.message || 'Booking conflict detected' }, { status: 409 });
    // }
    console.log('Conflict check passed for swimmerId:', swimmerId, 'sessionId:', sessionId);
    const fundingSourceId = swimmer.funding_source_id;

    // Check session availability and validate session type rules
    const { data: session } = await serviceSupabase
      .from('sessions')
      .select('id, start_time, end_time, status, is_full, max_capacity, booking_count, instructor_id, location, is_recurring, session_type_detail, is_semi_private_restricted')
      .eq('id', sessionId)
      .in('status', ['available', 'open'])
      .eq('is_full', false)
      .single();
    if (!session) return NextResponse.json({ error: 'Session not available' }, { status: 400 });
    console.log('Session availability check passed for sessionId:', sessionId);

    // Semi-private sessions: only is_semi_private swimmers can book; flexible swimmers cannot
    const isSemiPrivate =
      session.session_type_detail === 'semi_private' || !!session.is_semi_private_restricted;

    if (isSemiPrivate) {
      if (swimmer.flexible_swimmer) {
        return NextResponse.json(
          { error: 'Flexible swimmers cannot book semi-private sessions' },
          { status: 403 }
        );
      }
      if (!swimmer.is_semi_private) {
        return NextResponse.json(
          { error: 'This session is only available to semi-private swimmers' },
          { status: 403 }
        );
      }
    } else {
      // Non-semi-private: if a floating session exists for this slot, only flexible swimmers can claim it
      const { data: floatingSession } = await serviceSupabase
        .from('floating_sessions')
        .select('id')
        .eq('original_session_id', sessionId)
        .eq('status', 'available')
        .maybeSingle();

      if (floatingSession && !swimmer.flexible_swimmer) {
        return NextResponse.json(
          { error: 'This session slot is only available to flexible swimmers' },
          { status: 403 }
        );
      }
    }

    // Validate swimmer enrollment status
    // All enrolled swimmers (regular AND flexible) can book single lessons
    if (swimmer.enrollment_status !== 'enrolled' && swimmer.enrollment_status !== 'approved') {
      return NextResponse.json({
        error: 'SWIMMER_NOT_ENROLLED',
        message: 'Swimmer must be enrolled to book lessons'
      }, { status: 400 });
    }

    // Business rule: Single lessons are floating sessions (non-recurring)
    // These are canceled weekly slots now available for one-time booking
    // if (session.is_recurring) {
    //   return NextResponse.json({
    //     error: 'RECURRING_SESSION_SINGLE_BOOKING_NOT_ALLOWED',
    //     message: 'Weekly recurring sessions must be booked as recurring. Single lessons are for floating sessions only.'
    //   }, { status: 400 });
    // }

    // Funding source authorization validation
    let activePoId: string | null = null;
    let currentBookingCount: number = 0;
    if (fundingSourceId) {
      // First check if funding source requires authorization
      const { data: fundingSource } = await serviceSupabase
        .from('funding_sources')
        .select('requires_authorization')
        .eq('id', fundingSourceId)
        .single();
      console.log('Funding source requires authorization:', fundingSource?.requires_authorization);
      if (fundingSource?.requires_authorization) {
        const { data: purchaseOrders } = await serviceSupabase
          .from('purchase_orders')
          .select('id, sessions_authorized, sessions_booked')
          .eq('swimmer_id', swimmerId)
          .eq('status', 'approved')
          .lte('start_date', session.start_time)
          .gte('end_date', session.start_time)
          .order('end_date', { ascending: true })
          .limit(1);
        console.log('Purchase orders:', purchaseOrders);
          // In above query add sessions booked and sessions authorized to check if there are remaining sessions in the PO
        if (!purchaseOrders || purchaseOrders.length === 0) {
          return NextResponse.json({ error: 'No valid funding source authorization' }, { status: 400 });
        }

        const activePo = purchaseOrders[0];
        if (activePo.sessions_booked >= activePo.sessions_authorized) {
          return NextResponse.json({ error: 'Funding source authorization exhausted' }, { status: 400 });
        }
        activePoId = activePo.id;
        currentBookingCount = activePo.sessions_booked ?? 0;
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await serviceSupabase
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
    const { error: sessionUpdateError } = await serviceSupabase
      .from('sessions')
      .update({
        booking_count: newBookingCount,
        is_full: isFull,
        status: isFull ? 'booked' : session.status,
      })
      .eq('id', sessionId);

    if (sessionUpdateError) {
      await serviceSupabase.from('bookings').delete().eq('id', booking.id);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    // Update funding source PO if applicable
    if (fundingSourceId && activePoId) {
      const nextSessionsBooked = (Number(currentBookingCount) || 0) + 1;

      const { error: poUpdateError, data: poUpdated } = await serviceSupabase
        .from('purchase_orders')
        .update({ sessions_booked: nextSessionsBooked })
        .eq('id', activePoId)
        .select('sessions_booked')
        .maybeSingle();

      if (poUpdateError) {
        console.error('Purchase order update failed:', poUpdateError);
        return NextResponse.json(
          { error: 'Failed to update purchase order usage' },
          { status: 500 }
        );
      }

      if (!poUpdated) {
        return NextResponse.json(
          { error: 'Purchase order not found' },
          { status: 404 }
        );
      }

      console.log('Purchase order updated:', poUpdated);
    }
    // Send confirmation email
    try {
      const { data: parentProfile } = await serviceSupabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', parentId)
        .single();

      const { data: instructorProfile } = await serviceSupabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.instructor_id)
        .single();

      if (parentProfile?.email) {
        // Generate confirmation number
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const confirmationNumber = `ICS-${dateStr}-${randomNum}`;

        await emailService.sendSingleLessonBooking({
          parentEmail: parentProfile.email,
          parentName: parentProfile.full_name || 'Parent',
          childName: `${swimmer.first_name} ${swimmer.last_name}`,
          date: format(new Date(session.start_time), 'EEEE, MMMM d, yyyy'),
          time: format(new Date(session.start_time), 'h:mm a'),
          location: session.location || 'TBD',
          instructor: instructorProfile?.full_name || 'Instructor',
        });
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the booking if email fails
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
      fundingSourceId,
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}