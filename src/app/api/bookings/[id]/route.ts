import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { notifyParentLateCancelWarning, notifyAdminLateCancelWarning } from '@/lib/email/cancellation-notifications'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('Missing Supabase env (service role)')
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        booking_type,
        notes,
        created_at,
        updated_at,
        canceled_at,
        cancel_reason,
        cancel_source,
        canceled_by,
        session:sessions (
          id,
          start_time,
          end_time,
          location,
          instructor_id,
          session_type,
          session_type_detail,
          notes:session_notes,
          instructor:profiles!instructor_id (
            id,
            full_name,
            email,
            phone
          )
        ),
        swimmer:swimmers (
          id,
          first_name,
          last_name,
          date_of_birth,
          gender,
          funding_source_id,
          flexible_swimmer,
          current_level_id,
          funding_source:funding_sources (
            id,
            name,
            short_name,
            type,
            contact_name,
            contact_email,
            contact_phone
          ),
          level:swim_levels (
            id,
            name,
            display_name,
            color
          )
        ),
        parent:profiles!parent_id (
          id,
          full_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          zip_code
        ),
        progress_notes:progress_notes (
          id,
          lesson_summary,
          instructor_notes,
          parent_notes,
          created_at,
          instructor:profiles!instructor_id (
            full_name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching booking:', error)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ booking })

  } catch (error) {
    console.error('Error in booking API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    // Validate status if provided — only allow recognized values
    const VALID_BOOKING_STATUSES = ['confirmed', 'completed', 'cancelled', 'no_show', 'pending_auth'] as const;
    if (body.status !== undefined && !VALID_BOOKING_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status '${body.status}'. Valid values: ${VALID_BOOKING_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Get current booking to check session
    const { data: currentBooking } = await supabase
      .from('bookings')
      .select('session_id, status, swimmer_id, parent_id, session_date')
      .eq('id', id)
      .single()

    if (!currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // ── Role check for sensitive status changes ────────────────────
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const userRole = userRoles?.[0]?.role ?? 'parent'
    const isAdminOrInstructor = userRole === 'admin' || userRole === 'instructor'

    if (
      (body.status === 'completed' || body.status === 'no_show') &&
      !isAdminOrInstructor
    ) {
      return NextResponse.json(
        { error: 'Only admins or instructors can mark bookings as completed or no-show' },
        { status: 403 }
      )
    }

    // ── Cancellation via cancel_booking RPC ───────────────────────
    if (body.status === 'cancelled' && currentBooking.status !== 'cancelled') {
      // Determine if this is a late cancellation
      let isLateCancel = false
      let lateCancelType: string | null = null

      if (currentBooking.session_id) {
        const { data: sessionInfo } = await supabase
          .from('sessions')
          .select('start_time')
          .eq('id', currentBooking.session_id)
          .single()

        if (sessionInfo?.start_time) {
          const hoursBefore = (new Date(sessionInfo.start_time).getTime() - Date.now()) / (1000 * 60 * 60)
          if (hoursBefore < 24) {
            isLateCancel = true
            lateCancelType = 'unexcused'
          }
        }
      }

      const { data: cancelResult, error: cancelError } = await supabase.rpc('cancel_booking', {
        p_booking_id: id,
        p_cancelled_by: user.id,
        p_cancel_reason: body.cancel_reason || 'Cancelled by admin/instructor',
        p_cancel_source: 'admin',
        p_is_late_cancel: isLateCancel,
        p_late_cancel_type: lateCancelType,
        p_late_cancel_note: null,
      });

      if (cancelError || cancelResult?.error) {
        const errorCode = cancelResult?.error || 'internal_error';
        const errorMap: Record<string, { status: number; message: string }> = {
          booking_not_found: { status: 404, message: 'Booking not found' },
          already_cancelled: { status: 400, message: 'Booking is already cancelled' },
          cannot_cancel_completed: { status: 400, message: 'Cannot cancel a completed booking' },
          pending_auth_admin_only: { status: 403, message: 'Only admins can cancel pending authorization bookings' },
          internal_error: { status: 500, message: 'Failed to cancel booking' },
        };
        const err = errorMap[errorCode] ?? { status: 500, message: 'Failed to cancel booking' };
        console.error('cancel_booking RPC failed:', errorCode, cancelError || cancelResult);
        return NextResponse.json({ error: err.message }, { status: err.status });
      }

      // Send late cancel warning emails if applicable
      if (lateCancelType === 'unexcused' && currentBooking.swimmer_id) {
        try {
          const serviceSupabase = getServiceSupabase()
          const { data: updatedSwimmer } = await serviceSupabase
            .from('swimmers')
            .select('unexcused_late_cancel_count, first_name, last_name')
            .eq('id', currentBooking.swimmer_id)
            .single()

          if (updatedSwimmer) {
            const count = updatedSwimmer.unexcused_late_cancel_count
            if (count === 1) {
              await notifyParentLateCancelWarning(id, 1)
            } else if (count === 2) {
              await notifyParentLateCancelWarning(id, 2)
              const { data: parentProfile } = await serviceSupabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', currentBooking.parent_id)
                .single()

              await notifyAdminLateCancelWarning(
                updatedSwimmer.id,
                `${updatedSwimmer.first_name} ${updatedSwimmer.last_name}`,
                parentProfile?.full_name || 'Parent',
                parentProfile?.email || ''
              )
            }
          }
        } catch (notifError) {
          console.error('Failed to send late cancel notification:', notifError)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Booking cancelled',
        created_floating_session: cancelResult?.created_floating_session === true,
      });
    }

    // ── For all other status changes, update the booking directly ──
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking:', error)
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    // If status changed to completed, check PO session exhaustion
    if (body.status === 'completed' && currentBooking.status !== 'completed' && currentBooking.swimmer_id) {
      try {
        // Find active lessons PO for this swimmer
        const { data: activePO } = await supabase
          .from('purchase_orders')
          .select('id, sessions_used, sessions_authorized, status, lesson_dates, end_date')
          .eq('swimmer_id', currentBooking.swimmer_id)
          .eq('po_type', 'lessons')
          .in('status', ['active', 'approved_pending_auth'])
          .lte('start_date', currentBooking.session_date || new Date().toISOString().split('T')[0])
          .gte('end_date', currentBooking.session_date || new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true })
          .limit(1)
          .single()

        if (activePO) {
          const newSessionsUsed = (activePO.sessions_used || 0) + 1
          const newLessonDates = [...(activePO.lesson_dates || []), currentBooking.session_date || new Date().toISOString().split('T')[0]]
          const newStatus = newSessionsUsed >= (activePO.sessions_authorized || 0) ? 'completed' : activePO.status

          // Update sessions_used on the PO
          await supabase
            .from('purchase_orders')
            .update({
              sessions_used: newSessionsUsed,
              lesson_dates: newLessonDates,
              status: newStatus,
            })
            .eq('id', activePO.id)

          // If PO is now exhausted (all sessions used), create renewal and notify
          if (newSessionsUsed >= (activePO.sessions_authorized || 0)) {
            // Check if a renewal PO already exists for this PO
            const { data: existingRenewal } = await supabase
              .from('purchase_orders')
              .select('id')
              .eq('parent_po_id', activePO.id)
              .maybeSingle()

            if (!existingRenewal) {
              // Create a new renewal PO
              const { data: fs } = await supabase
                .from('purchase_orders')
                .select('funding_source_id, coordinator_id, funding_sources(name, po_duration_months, lessons_per_po)')
                .eq('id', activePO.id)
                .single()

              const fundingSource = fs ? (Array.isArray(fs.funding_sources) ? fs.funding_sources[0] : fs.funding_sources) : null
              const months = (fundingSource as any)?.po_duration_months ?? 3
              const defaultSessions = (fundingSource as any)?.lessons_per_po ?? 12

              const oldEnd = activePO.end_date ? new Date(activePO.end_date) : new Date()
              const startBase = Number.isNaN(oldEnd.getTime()) ? new Date() : oldEnd
              const dayAfter = new Date(startBase)
              dayAfter.setDate(dayAfter.getDate() + 1)
              const newStartDate = dayAfter.toISOString().split('T')[0]
              const newEnd = new Date(dayAfter)
              newEnd.setMonth(newEnd.getMonth() + months)
              const newEndDate = newEnd.toISOString().split('T')[0]

              const { data: renewalPO } = await supabase
                .from('purchase_orders')
                .insert({
                  swimmer_id: currentBooking.swimmer_id,
                  funding_source_id: fs?.funding_source_id ?? null,
                  coordinator_id: fs?.coordinator_id ?? null,
                  po_type: 'lessons',
                  parent_po_id: activePO.id,
                  sessions_authorized: defaultSessions,
                  sessions_booked: 0,
                  sessions_used: 0,
                  start_date: newStartDate,
                  end_date: newEndDate,
                  status: 'pending',
                  notes: `Auto-created — previous PO ${activePO.id} exhausted (${newSessionsUsed}/${activePO.sessions_authorized} sessions used)`,
                })
                .select('id')
                .single()

              if (renewalPO) {
                // Email is now sent manually from the admin PO page
              }
            }
          }
        }
      } catch (poError) {
        // Don't let PO processing failure break the booking completion
        console.error('Error processing PO exhaustion for booking', id, poError)
      }
    }

    return NextResponse.json({
      booking,
      message: 'Booking updated successfully'
    })

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Get booking details before deletion
    const { data: booking } = await supabase
      .from('bookings')
      .select('session_id, status')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Delete booking
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting booking:', error)
      return NextResponse.json(
        { error: 'Failed to delete booking' },
        { status: 500 }
      )
    }

    // Update session booking count if booking was confirmed
    if (booking.status === 'confirmed') {
      const { data: session } = await supabase
        .from('sessions')
        .select('booking_count, max_capacity')
        .eq('id', booking.session_id)
        .single()

      if (session) {
        const newBookingCount = Math.max(0, (session.booking_count || 0) - 1)
        const isFull = newBookingCount >= session.max_capacity

        await supabase
          .from('sessions')
          .update({
            booking_count: newBookingCount,
            is_full: isFull
          })
          .eq('id', booking.session_id)
      }
    }

    return NextResponse.json({
      message: 'Booking deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}