import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  context: any
) {
  const { params } = await context.params
  const bookingId = params.id
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!userRole) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      reason,
      markAsFlexibleSwimmer = false,
      adminNotes
    } = body

    // Get booking with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        booking_type,
        session_id,
        swimmer_id,
        parent_id,
        session:sessions!inner (
          id,
          start_time,
          end_time,
          location,
          booking_count,
          is_recurring,
          instructor_id
        ),
        swimmer:swimmers!inner (
          id,
          first_name,
          last_name,
          funding_source_id,
          parent_id
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
    }

    const sessionStart = new Date(booking.session[0].start_time)
    const now = new Date()
    const hoursBeforeSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60)
    const wasLateCancel = hoursBeforeSession < 24

    // Get instructor name
    let instructorName = null
    if (booking.session[0].instructor_id) {
      const { data: instructor } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', booking.session[0].instructor_id)
        .single()
      instructorName = instructor?.full_name
    }

    // Get funding source to determine if regional center
    let isRegionalCenter = false
    if (booking.swimmer[0].funding_source_id) {
      const { data: fundingSource } = await supabase
        .from('funding_sources')
        .select('type')
        .eq('id', booking.swimmer[0].funding_source_id)
        .single()
      isRegionalCenter = fundingSource?.type === 'regional_center'
    }

    // Admin cancels the booking — atomically via cancel_booking RPC
    let isLate = wasLateCancel
    let lateType: string | null = null

    // Admin chooses whether to treat this as a late cancellation
    if (markAsFlexibleSwimmer) {
      isLate = true
      lateType = 'admin_cancel'
    }

    const { data: cancelResult, error: cancelError } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_cancelled_by: user.id,
      p_cancel_reason: reason || null,
      p_cancel_source: 'admin',
      p_is_late_cancel: isLate,
      p_late_cancel_type: lateType,
      p_late_cancel_note: adminNotes || (markAsFlexibleSwimmer ? 'Late cancellation - admin marked' : null),
    });

    if (cancelError || cancelResult?.error) {
      const errorCode = cancelResult?.error || 'internal_error';
      const errorMap: Record<string, { status: number; message: string }> = {
        booking_not_found: { status: 404, message: 'Booking not found' },
        already_cancelled: { status: 400, message: 'Booking is already cancelled' },
        cannot_cancel_completed: { status: 400, message: 'Cannot cancel a completed booking' },
        pending_auth_admin_only: { status: 403, message: 'Pending authorization bookings require admin cancel' },
        internal_error: { status: 500, message: 'Failed to cancel booking' },
      };
      const err = errorMap[errorCode] ?? { status: 500, message: 'Failed to cancel booking' };
      console.error('cancel_booking RPC failed:', errorCode, cancelError || cancelResult);
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    // If assessment, update records
    if (booking.booking_type === 'assessment') {
      await supabase
        .from('assessments')
        .update({ status: 'cancelled' })
        .eq('booking_id', bookingId)

      await supabase
        .from('swimmers')
        .update({ assessment_status: 'not_scheduled' })
        .eq('id', booking.swimmer[0].id)
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled by admin',
      wasLateCancel,
      markedFlexibleSwimmer: markAsFlexibleSwimmer,
      createdFloatingSession: cancelResult?.created_floating_session === true,
    })

  } catch (error: unknown) {
    console.error('Admin cancel error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}