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

export async function POST(
  request: NextRequest,
  context: any
) {
  const params = await context.params
  const bookingId = params.id
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = body

    // Get booking with related data (use service client to bypass RLS for read)
    const { data: booking, error: bookingError } = await serviceSupabase
      .from('bookings')
      .select(`
        id,
        status,
        booking_type,
        session_id,
        swimmer_id,
        parent_id,
        session:sessions (
          id,
          start_time,
          end_time,
          location,
          booking_count,
          is_recurring,
          batch_id,
          instructor_id,
          session_type_detail,
          is_semi_private_restricted
        ),
        swimmer:swimmers (
          id,
          first_name,
          last_name,
          funding_source_id,
          parent_id,
          flexible_swimmer
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify parent owns this swimmer
    if ((booking.swimmer as any).parent_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this booking' },
        { status: 403 }
      )
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }

    // Calculate hours before session
    const sessionStart = new Date((booking.session as any).start_time)
    const now = new Date()
    const hoursBeforeSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Determine session type
    const isSemiPrivate =
      (booking.session as any).session_type_detail === 'semi_private' ||
      !!(booking.session as any).is_semi_private_restricted

    // Late cancellation only applies to regular (non-semi-private) sessions < 24h
    const isLateCancellation = !isSemiPrivate && hoursBeforeSession < 24

    // Get instructor name for tracking
    let instructorName = null
    if ((booking.session as any).instructor_id) {
      const { data: instructor } = await serviceSupabase
        .from('profiles')
        .select('full_name')
        .eq('id', (booking.session as any).instructor_id)
        .single()
      instructorName = instructor?.full_name
    }

    // ═══════════════════════════════════════════════════════════════════
    // Atomically cancel via cancel_booking RPC (row-level lock)
    // ═══════════════════════════════════════════════════════════════════
    const { data: cancelResult, error: cancelError } = await serviceSupabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_cancelled_by: user.id,
      p_cancel_reason: reason || null,
      p_cancel_source: 'parent',
      p_is_late_cancel: isLateCancellation,
      p_late_cancel_type: isLateCancellation ? 'unexcused' : null,
      p_late_cancel_note: isLateCancellation ? 'late_cancellation' : null,
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

    const createdFloatingSession = cancelResult.created_floating_session === true;

    // If assessment, update assessment record and swimmer status
    if (booking.booking_type === 'assessment') {
      await serviceSupabase
        .from('assessments')
        .update({ status: 'cancelled' })
        .eq('booking_id', bookingId)

      await serviceSupabase
        .from('swimmers')
        .update({ assessment_status: 'not_scheduled' })
        .eq('id', (booking.swimmer as any).id)
    }

    // Send late cancel warning emails if applicable
    if (isLateCancellation) {
      try {
        const { data: updatedSwimmer } = await serviceSupabase
          .from('swimmers')
          .select('unexcused_late_cancel_count, first_name, last_name')
          .eq('id', (booking.swimmer as any).id)
          .single()

        if (updatedSwimmer) {
          const count = updatedSwimmer.unexcused_late_cancel_count
          if (count === 1) {
            await notifyParentLateCancelWarning(bookingId, 1)
          } else if (count === 2) {
            await notifyParentLateCancelWarning(bookingId, 2)
            const { data: parentProfile } = await serviceSupabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', (booking.swimmer as any).parent_id)
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
      message: 'Booking cancelled successfully',
      hoursBeforeSession: Math.round(hoursBeforeSession * 10) / 10,
      isLateCancellation,
      isSemiPrivate,
      createdFloatingSession,
    })

  } catch (error: unknown) {
    console.error('Cancel booking error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel booking'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
