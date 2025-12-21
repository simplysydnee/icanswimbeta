import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emailService } from '@/lib/email-service';
import { format } from 'date-fns';

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
      .select('id, funding_source_id, flexible_swimmer, enrollment_status, first_name, last_name')
      .eq('id', swimmerId)
      .eq('parent_id', parentId)
      .single();
    if (!swimmer) return NextResponse.json({ error: 'Swimmer not authorized' }, { status: 403 });

    // Check for booking conflicts
    const conflictResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/check-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swimmerId, sessionId }),
    });

    const conflictData = await conflictResponse.json();
    if (conflictData.hasConflict) {
      return NextResponse.json({ error: conflictData.message || 'Booking conflict detected' }, { status: 409 });
    }

    const fundingSourceId = swimmer.funding_source_id;

    // Check session availability and validate session type rules
    const { data: session } = await supabase
      .from('sessions')
      .select('id, start_time, end_time, status, is_full, max_capacity, booking_count, instructor_id, location, is_recurring')
      .eq('id', sessionId)
      .in('status', ['available', 'open'])
      .eq('is_full', false)
      .single();
    if (!session) return NextResponse.json({ error: 'Session not available' }, { status: 400 });

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
    if (session.is_recurring) {
      return NextResponse.json({
        error: 'RECURRING_SESSION_SINGLE_BOOKING_NOT_ALLOWED',
        message: 'Weekly recurring sessions must be booked as recurring. Single lessons are for floating sessions only.'
      }, { status: 400 });
    }

    // Funding source authorization validation
    let activePoId: string | null = null;
    if (fundingSourceId) {
      // First check if funding source requires authorization
      const { data: fundingSource } = await supabase
        .from('funding_sources')
        .select('requires_authorization')
        .eq('id', fundingSourceId)
        .single();

      if (fundingSource?.requires_authorization) {
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
          return NextResponse.json({ error: 'No valid funding source authorization' }, { status: 400 });
        }

        const activePo = purchaseOrders[0];
        if (activePo.lessons_booked >= activePo.allowed_lessons) {
          return NextResponse.json({ error: 'Funding source authorization exhausted' }, { status: 400 });
        }
        activePoId = activePo.id;
      }
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

    // Update funding source PO if applicable
    if (fundingSourceId && activePoId) {
      await supabase
        .from('purchase_orders')
        .update({ lessons_booked: supabase.raw('lessons_booked + 1') })
        .eq('id', activePoId);
    }

    // Send confirmation email
    try {
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', parentId)
        .single();

      const { data: instructorProfile } = await supabase
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