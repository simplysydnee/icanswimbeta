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

    const body = await request.json()
    const { reason } = body

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
        session:sessions (
          id,
          start_time,
          end_time,
          location,
          booking_count,
          is_recurring,
          batch_id,
          instructor_id
        ),
        swimmer:swimmers (
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

    // Verify parent owns this swimmer
    if (booking.swimmer.parent_id !== user.id) {
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
    const sessionStart = new Date(booking.session.start_time)
    const now = new Date()
    const hoursBeforeSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60)

    // ENFORCE 24-HOUR RULE - Parents MUST text for late cancellations
    if (hoursBeforeSession < 24) {
      return NextResponse.json({
        error: 'late_cancellation',
        cannotCancelInApp: true,
        hoursBeforeSession: Math.round(hoursBeforeSession * 10) / 10,
        message: 'For cancellations less than 24 hours before your session, please text us.',
        contactPhone: '(209) 643-7969',
        contactType: 'text',
        contactMessage: 'We understand life happens! Text us and we\'ll do our best to help.',
      }, { status: 400 })
    }

    // Get instructor name for tracking
    let instructorName = null
    if (booking.session.instructor_id) {
      const { data: instructor } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', booking.session.instructor_id)
        .single()
      instructorName = instructor?.full_name
    }

    // Parent can cancel (> 24 hours)
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancel_reason: reason,
        canceled_at: now.toISOString(),
        canceled_by: user.id,
      })
      .eq('id', bookingId)

    if (updateError) {
      throw new Error('Failed to cancel booking')
    }

    // Update session booking count
    await supabase
      .from('sessions')
      .update({
        booking_count: Math.max(0, (booking.session.booking_count || 1) - 1),
        is_full: false,
      })
      .eq('id', booking.session.id)

    // Create floating session if recurring and future
    let createdFloatingSession = false
    let floatingSessionId = null
    if (booking.session.is_recurring && sessionStart > now) {
      const { data: floatingSession } = await supabase
        .from('floating_sessions')
        .insert({
          original_session_id: booking.session.id,
          original_booking_id: bookingId,
          available_until: booking.session.start_time,
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

    // Track cancellation for analytics
    await supabase
      .from('cancellations')
      .insert({
        booking_id: bookingId,
        session_id: booking.session.id,
        swimmer_id: booking.swimmer.id,
        parent_id: booking.swimmer.parent_id,
        canceled_by: user.id,
        cancellation_type: booking.booking_type === 'assessment' ? 'assessment' : 'single',
        session_date: booking.session.start_time,
        session_start_time: booking.session.start_time,
        session_end_time: booking.session.end_time,
        session_location: booking.session.location,
        instructor_id: booking.session.instructor_id,
        instructor_name: instructorName,
        swimmer_name: `${booking.swimmer.first_name} ${booking.swimmer.last_name}`,
        swimmer_has_funding_source: !!booking.swimmer.funding_source_id,
        hours_before_session: Math.round(hoursBeforeSession * 100) / 100,
        was_late_cancellation: false,
        cancel_reason: reason,
        cancel_source: 'parent',
        created_floating_session: createdFloatingSession,
        floating_session_id: floatingSessionId,
      })

    // If assessment, update assessment record and swimmer status
    if (booking.booking_type === 'assessment') {
      await supabase
        .from('assessments')
        .update({ status: 'cancelled' })
        .eq('booking_id', bookingId)

      await supabase
        .from('swimmers')
        .update({ assessment_status: 'not_scheduled' })
        .eq('id', booking.swimmer.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      hoursBeforeSession: Math.round(hoursBeforeSession * 10) / 10,
      createdFloatingSession,
    })

  } catch (error: any) {
    console.error('Cancel booking error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}