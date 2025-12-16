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

    // Admin cancels the booking
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancel_reason: reason,
        canceled_at: now.toISOString(),
        canceled_by: user.id,
      })
      .eq('id', bookingId)

    // Update session booking count
    await supabase
      .from('sessions')
      .update({
        booking_count: Math.max(0, (booking.session[0].booking_count || 1) - 1),
        is_full: false,
      })
      .eq('id', booking.session[0].id)

    // If admin chose to mark as flexible swimmer
    if (markAsFlexibleSwimmer) {
      await supabase
        .from('swimmers')
        .update({
          flexible_swimmer: true,
          flexible_swimmer_reason: reason || 'Late cancellation - admin marked',
          flexible_swimmer_set_at: now.toISOString(),
          flexible_swimmer_set_by: user.id,
        })
        .eq('id', booking.swimmer[0].id)
    }

    // Create floating session if recurring and future
    let createdFloatingSession = false
    let floatingSessionId = null
    if (booking.session[0].is_recurring && sessionStart > now) {
      const { data: floatingSession } = await supabase
        .from('floating_sessions')
        .insert({
          original_session_id: booking.session[0].id,
          original_booking_id: bookingId,
          available_until: booking.session[0].start_time,
          month_year: sessionStart.toISOString().slice(0, 7),
          status: 'available',
        })
        .select('id')
        .single()

      if (floatingSession) {
        createdFloatingSession = true
        floatingSessionId = floatingSession.id
      }
    }

    // Track cancellation with admin details
    await supabase
      .from('cancellations')
      .insert({
        booking_id: bookingId,
        session_id: booking.session[0].id,
        swimmer_id: booking.swimmer[0].id,
        parent_id: booking.swimmer[0].parent_id,
        canceled_by: user.id,
        cancellation_type: booking.booking_type === 'assessment' ? 'assessment' : 'single',
        session_date: booking.session[0].start_time,
        session_start_time: booking.session[0].start_time,
        session_end_time: booking.session[0].end_time,
        session_location: booking.session[0].location,
        instructor_id: booking.session[0].instructor_id,
        instructor_name: instructorName,
        swimmer_name: `${booking.swimmer[0].first_name} ${booking.swimmer[0].last_name}`,
        swimmer_is_regional_center: isRegionalCenter,
        hours_before_session: Math.round(hoursBeforeSession * 100) / 100,
        was_late_cancellation: wasLateCancel,
        cancel_reason: reason,
        cancel_source: 'admin',
        admin_notes: adminNotes,
        marked_flexible_swimmer: markAsFlexibleSwimmer,
        created_floating_session: createdFloatingSession,
        floating_session_id: floatingSessionId,
      })

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
      createdFloatingSession,
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