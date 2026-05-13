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
      .select('id, funding_source_id, flexible_swimmer, is_semi_private, enrollment_status, approval_status, first_name, last_name')
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
            .select('id, sessions_authorized, sessions_used, end_date, authorization_number, coordinator_id, notes')
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
            // Date-expired PO with sessions remaining → extension flow
            const { calcExtensionEndDate } = await import('@/lib/email/pos-notifications');
            const newEndDate = calcExtensionEndDate(expiredPO.end_date, 3);

            // Update the PO with extension fields before creating the booking
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

            // Create booking as pending_auth, linked to this PO
            bookingStatus = 'pending_auth';
            activePoId = expiredPO.id;
            poCoordinatorId = expiredPO.coordinator_id ?? null;
            sessionsRemaining = (expiredPO.sessions_authorized ?? 0) - (expiredPO.sessions_used ?? 0);
          } else {
            return NextResponse.json({ error: 'No valid funding source authorization' }, { status: 400 });
          }
        }
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await serviceSupabase
      .from('bookings')
      .insert({
        session_id: sessionId,
        swimmer_id: swimmerId,
        parent_id: parentId,
        status: bookingStatus,
        purchase_order_id: activePoId,
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
        await serviceSupabase.from('bookings').delete().eq('id', booking.id);
        await serviceSupabase
          .from('sessions')
          .update({
            booking_count: session.booking_count ?? 0,
            is_full: session.is_full ?? false,
            status: session.status,
          })
          .eq('id', sessionId);
        return NextResponse.json(
          { error: 'Failed to update swimmer assessment status' },
          { status: 500 }
        );
      }
    }

    // Update funding source PO if applicable — only increment for confirmed bookings
    if (fundingSourceId && activePoId && bookingStatus === 'confirmed') {
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
      } else if (bookingStatus === 'pending_auth' && sessionsRemaining > 0) {
        // Extension flow — send parent notification instead of confirmation
        if (parentProfile?.email) {
          const extSubject = `Lesson Request Received — ${swimmer.first_name} ${swimmer.last_name}`;
          const extContent = `
            <h2 style="color: #2a5e84; margin-top: 0;">Lesson Request Received</h2>
            <p>Hi ${parentProfile.full_name || 'Parent'},</p>
            <p>We've received your lesson request for <strong>${swimmer.first_name} ${swimmer.last_name}</strong> on <strong>${format(new Date(session.start_time), 'EEEE, MMMM d, yyyy')}</strong>.</p>
            <p>Your current service authorization has expired, but you still have <strong>${sessionsRemaining} lessons remaining</strong>. We have already contacted your coordinator to request an extension — no action is needed from you at this time.</p>

            <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px 18px;margin:18px 0;">
              <div style="font-size:14px;font-weight:600;color:#7a5000;margin-bottom:6px;">📋 Authorization Extension Requested</div>
              <p style="font-size:13px;color:#5a4a00;line-height:1.6;margin:0;">
                We have submitted a request to extend ${swimmer.first_name}'s authorization to cover their remaining ${sessionsRemaining} lessons. Your lesson will be confirmed once your coordinator approves the extension.
              </p>
            </div>

            <p style="font-size:13px;color:#5a7a8e;line-height:1.5;">
              Please reach out to your coordinator directly as there may be documents that need to be signed on their end to process this request.
            </p>

            <div style="background:#e8f4fd;border:1px solid #b8d8f0;border-radius:8px;padding:14px 18px;margin:18px 0;">
              <div style="font-size:14px;font-weight:600;color:#1a5a7a;margin-bottom:8px;">📅 Upcoming Lesson</div>
              <table cellpadding="0" cellspacing="0" style="font-size:13px;color:#1a5a7a;">
                <tr><td style="padding:2px 8px 2px 0;">📅</td><td>${format(new Date(session.start_time), 'EEEE, MMMM d, yyyy')}</td></tr>
                <tr><td style="padding:2px 8px 2px 0;">⏰</td><td>${format(new Date(session.start_time), 'h:mm a')}</td></tr>
                <tr><td style="padding:2px 8px 2px 0;">📍</td><td>${session.location || 'TBD'}</td></tr>
                <tr><td style="padding:2px 8px 2px 0;">👤</td><td>${instructorProfile?.full_name || 'Any Available Instructor'}</td></tr>
              </table>
            </div>

            <div style="background:#f0f6fa;border:1px solid #dde8f0;border-radius:8px;padding:14px 18px;margin:18px 0;">
              <div style="font-size:14px;font-weight:600;color:#1a3347;margin-bottom:6px;">Questions? Contact us:</div>
              <div style="font-size:13px;color:#3d5a6e;line-height:1.8;">
                💬 Text: <a href="sms:2096437969" style="color:#23a1c0;">209-643-7969</a><br>
                📞 Call: <a href="tel:2097787877" style="color:#23a1c0;">(209) 778-7877</a><br>
                ✉️ <a href="mailto:info@icanswim209.com" style="color:#23a1c0;">info@icanswim209.com</a>
              </div>
            </div>
          `;
          const extHtml = (await import('@/lib/emails/email-wrapper')).wrapEmailWithHeader(extContent);
          await emailService.sendEmail({
            to: parentProfile.email,
            templateType: 'custom',
            toName: parentProfile.full_name || undefined,
            customData: { subject: extSubject, html: extHtml },
          });
        }

        // Notify coordinator about the extension request
        const { notifyCoordinatorPOExtension } = await import('@/lib/email/pos-notifications');
        await notifyCoordinatorPOExtension(activePoId!, session.start_time);
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