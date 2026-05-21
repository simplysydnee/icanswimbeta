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

/** Return June 30 of the fiscal year containing the given date (fiscal year = July 1 – June 30). */
function getFiscalYearEnd(date: Date): Date {
  // Jan–Jun (months 0–5) → fiscal year ends June 30 of same year
  // Jul–Dec (months 6–11) → fiscal year ends June 30 of next year
  if (date.getMonth() <= 5) {
    return new Date(date.getFullYear(), 5, 30);
  }
  return new Date(date.getFullYear() + 1, 5, 30);
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
      .select('id, funding_source_id, flexible_swimmer, is_semi_private, enrollment_status, approval_status, first_name, last_name')
      .eq('id', swimmerId)
      .eq('parent_id', parentId)
      .single();
    if (!swimmer) return NextResponse.json({ error: 'Swimmer not authorized' }, { status: 403 });

    // Conflict check is handled atomically inside book_session RPC
    console.log('Conflict check passed for swimmerId:', swimmerId, 'sessionId:', sessionId);
    const fundingSourceId = swimmer.funding_source_id;

    let fundingSourceRow: {
      requires_authorization: boolean | null;
      name: string | null;
    } | null = null;
    if (fundingSourceId) {
      const { data: fs } = await serviceSupabase
        .from('funding_sources')
        .select('requires_authorization, name')
        .eq('id', fundingSourceId)
        .single();
      fundingSourceRow = fs;
    }

    // Check session availability and validate session type rules
    const { data: session } = await serviceSupabase
      .from('sessions')
      .select('id, start_time, end_time, status, is_full, max_capacity, booking_count, instructor_id, location, is_recurring, session_type, session_type_detail, is_semi_private_restricted')
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
    // Only proceed if admin/coordinator approval (i.e. swimmer.approval_status === "approved")
    if (swimmer.approval_status !== 'approved') {
      return NextResponse.json({
        error: 'APPROVAL_REQUIRED',
        message: 'You need admin/coordinator approval before booking.'
      }, { status: 403 });
    }

    // Check enrollment status based on session type
    if (session.session_type === 'lesson') {
      if (swimmer.enrollment_status !== 'enrolled') {
        return NextResponse.json({
          error: 'SWIMMER_NOT_ENROLLED',
          message: 'Swimmer must be enrolled to book lessons'
        }, { status: 400 });
      }
    } else if (session.session_type === 'assessment') {
      if (swimmer.enrollment_status !== 'waitlist') {
        return NextResponse.json({
          error: 'SWIMMER_NOT_WAITLIST',
          message: 'Swimmer must be on the waitlist to book an assessment'
        }, { status: 400 });
      }
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
    /** Coordinator user id from the purchase order row (profiles.id), not swimmers.coordinator_id */
    let poCoordinatorId: string | null = null;
    let bookingStatus: string = 'confirmed';
    let sessionsRemaining: number = 0;
    if (fundingSourceId && session.session_type === 'lesson') {
      console.log('Funding source requires authorization:', fundingSourceRow?.requires_authorization);
      if (fundingSourceRow?.requires_authorization) {
        // 1. Try to find a valid (non-expired) PO covering this session
        const { data: purchaseOrders } = await serviceSupabase
          .from('purchase_orders')
          .select('id, sessions_authorized, sessions_booked, coordinator_id')
          .eq('swimmer_id', swimmerId)
          .in('status', ['approved', 'active', 'approved_pending_auth'])
          .lte('start_date', session.start_time)
          .gte('end_date', session.start_time)
          .order('end_date', { ascending: true })
          .limit(1);
        console.log('Purchase orders:', purchaseOrders);

        if (purchaseOrders && purchaseOrders.length > 0) {
          const activePo = purchaseOrders[0];
          if (activePo.sessions_booked >= activePo.sessions_authorized) {
            return NextResponse.json({ error: 'Funding source authorization exhausted' }, { status: 400 });
          }
          activePoId = activePo.id;
          currentBookingCount = activePo.sessions_booked ?? 0;
          poCoordinatorId = activePo.coordinator_id ?? null;
        } else {
          // 2. No valid PO in date range — check for a date-expired PO with sessions remaining
          const { data: expiredCandidates } = await serviceSupabase
            .from('purchase_orders')
            .select('id, swimmer_id, funding_source_id, sessions_authorized, sessions_used, end_date, authorization_number, coordinator_id, notes')
            .eq('swimmer_id', swimmerId)
            .eq('po_type', 'lessons')
            .in('status', ['active', 'approved_pending_auth'])
            .lt('end_date', session.start_time)
            .order('end_date', { ascending: false })
            .limit(5);

          const expiredPO = (expiredCandidates ?? []).find(
            (po: { sessions_used: number; sessions_authorized: number }) =>
              (po.sessions_used ?? 0) < (po.sessions_authorized ?? 0)
          );

          if (expiredPO) {
            // Determine if this booking crosses into a new fiscal year
            const sessionDate = new Date(session.start_time);
            const expiredPOFiscalYearEnd = getFiscalYearEnd(new Date(expiredPO.end_date));
            const isNewFiscalYear = sessionDate > expiredPOFiscalYearEnd;

            if (isNewFiscalYear) {
              // === Scenario B: New fiscal year — create a brand new PO ===
              sessionsRemaining = (expiredPO.sessions_authorized ?? 0) - (expiredPO.sessions_used ?? 0);

              // July 1 start date = fiscal year end + 1 day
              const july1 = new Date(expiredPOFiscalYearEnd);
              july1.setDate(july1.getDate() + 1);
              const startDateStr = july1.toISOString().split('T')[0];

              // End date = start + 3 months, capped at June 30
              const endDate = new Date(july1);
              endDate.setMonth(endDate.getMonth() + 3);
              const fye = getFiscalYearEnd(endDate);
              const endDateStr = endDate <= fye ? endDate.toISOString().split('T')[0] : fye.toISOString().split('T')[0];

              const { data: newPO, error: newPOErr } = await serviceSupabase
                .from('purchase_orders')
                .insert({
                  swimmer_id: expiredPO.swimmer_id,
                  funding_source_id: expiredPO.funding_source_id,
                  coordinator_id: expiredPO.coordinator_id,
                  po_type: 'lessons',
                  sessions_authorized: sessionsRemaining,
                  sessions_used: 0,
                  start_date: startDateStr,
                  end_date: endDateStr,
                  status: 'pending',
                  is_extension: false,
                  notes: `New fiscal year PO. Carrying ${sessionsRemaining} remaining sessions from PO ${expiredPO.id}. New authorization number required.`,
                })
                .select('id')
                .single();

              if (newPOErr || !newPO) {
                console.error('Failed to create new fiscal year PO:', newPOErr);
                return NextResponse.json({ error: 'Failed to create new PO' }, { status: 500 });
              }

              bookingStatus = 'pending_auth';
              activePoId = newPO.id;
              poCoordinatorId = expiredPO.coordinator_id ?? null;
            } else {
              // === Scenario A: Same fiscal year — extend existing PO ===
              const { calcExtensionEndDate } = await import('@/lib/email/pos-notifications');
              const newEndDate = calcExtensionEndDate(expiredPO.end_date, 3);

              const oldEndDate = expiredPO.end_date;
              await serviceSupabase
                .from('purchase_orders')
                .update({
                  end_date: newEndDate,
                  original_end_date: oldEndDate,
                  status: 'pending',
                  is_extension: true,
                  extension_requested_at: new Date().toISOString(),
                  notes: (
                    (expiredPO.notes as string) ?? ''
                  ) + `\nExtension requested ${format(new Date(), 'MMM dd, yyyy')}. Original end date: ${oldEndDate}. New end date requested: ${newEndDate}`,
                })
                .eq('id', expiredPO.id);

              bookingStatus = 'pending_auth';
              activePoId = expiredPO.id;
              poCoordinatorId = expiredPO.coordinator_id ?? null;
              sessionsRemaining = (expiredPO.sessions_authorized ?? 0) - (expiredPO.sessions_used ?? 0);
            }
          } else {
            return NextResponse.json({ error: 'No valid funding source authorization' }, { status: 400 });
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Atomically create booking via book_session RPC (row-level lock)
    // ═══════════════════════════════════════════════════════════════════
    const { data: bookResult, error: rpcError } = await serviceSupabase.rpc('book_session', {
      p_session_id: sessionId,
      p_swimmer_id: swimmerId,
      p_parent_id: parentId,
      p_booking_type: 'lesson',
      p_purchase_order_id: activePoId ?? null,
      p_status: bookingStatus,
    });

    if (rpcError || bookResult?.error) {
      const errorCode = bookResult?.error || 'internal_error';
      const errorMap: Record<string, { status: number; message: string }> = {
        session_full: { status: 409, message: 'Session is full' },
        session_not_available: { status: 409, message: 'Session is not available' },
        session_held: { status: 409, message: 'Session is temporarily held by another user' },
        duplicate_booking: { status: 409, message: 'Already booked for this session' },
        swimmer_conflict: { status: 409, message: 'Swimmer already has a booking at this time' },
        session_not_found: { status: 404, message: 'Session not found' },
        internal_error: { status: 500, message: 'Booking failed' },
      };
      const err = errorMap[errorCode] ?? { status: 500, message: 'Booking failed' };
      console.error('book_session RPC failed:', errorCode, rpcError || bookResult);
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    const bookingId = bookResult.booking_id;

    // Fetch the created booking for the response
    const { data: booking, error: bookingFetchError } = await serviceSupabase
      .from('bookings')
      .select()
      .eq('id', bookingId)
      .single();

    if (bookingFetchError || !booking) {
      console.error('Failed to fetch created booking:', bookingFetchError);
      // The booking was created — return what we can
    }

    if (session.session_type === 'assessment') {
      const { error: swimmerAssessmentError } = await serviceSupabase
        .from('swimmers')
        .update({
          assessment_status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', swimmerId)
        .eq('assessment_status', 'not_scheduled');

      if (swimmerAssessmentError) {
        // Rollback the booking atomically
        await serviceSupabase.rpc('cancel_booking', {
          p_booking_id: bookingId,
          p_cancelled_by: parentId,
          p_cancel_reason: 'Assessment status update failed — booking rolled back',
          p_cancel_source: 'system',
          p_is_late_cancel: false,
        });
        return NextResponse.json(
          { error: 'Failed to update swimmer assessment status' },
          { status: 500 }
        );
      }
    }

    // PO increment now handled atomically inside book_session RPC
    // Send emails — branch on booking status
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

      if (bookingStatus === 'confirmed') {
        if (parentProfile?.email) {
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

        // Funded swimmers: notify coordinator
        if (fundingSourceId && poCoordinatorId) {
          const { data: coordinatorProfile } = await serviceSupabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', poCoordinatorId)
            .maybeSingle();

          if (coordinatorProfile?.email) {
            await emailService.sendFundedSingleLessonCoordinatorNotification({
              coordinatorEmail: coordinatorProfile.email,
              coordinatorName: coordinatorProfile.full_name || 'Coordinator',
              parentName: parentProfile?.full_name || 'Parent',
              childName: `${swimmer.first_name} ${swimmer.last_name}`,
              date: format(new Date(session.start_time), 'EEEE, MMMM d, yyyy'),
              time: format(new Date(session.start_time), 'h:mm a'),
              location: session.location || 'TBD',
              instructor: instructorProfile?.full_name || 'Instructor',
              fundingSourceName: fundingSourceRow?.name ?? undefined,
            });
          }
        }
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    // Generate confirmation number for the response
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const confirmationNumber = `ICS-${dateStr}-${randomNum}`;

    return NextResponse.json({
      success: true,
      confirmationNumber,
      bookingId,
      booking,
      session: {
        id: session.id,
        startTime: session.start_time,
        endTime: session.end_time,
        instructorId: session.instructor_id,
        location: session.location,
      },
      fundingSourceId,
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}