import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (roleError) {
      console.error('Error fetching user roles:', roleError)
      return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 })
    }

    const isAdmin = userRoles?.some(role => role.role === 'admin') || false
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { newSessionId, notifyParent } = body

    if (!newSessionId) {
      return NextResponse.json({ error: 'New session ID is required' }, { status: 400 })
    }

    // Get the booking to check if it exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, session_id, swimmer_id, parent_id, status')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if booking can be rescheduled
    if (booking.status !== 'confirmed') {
      return NextResponse.json({
        error: 'Only confirmed bookings can be rescheduled',
        details: `Current status: ${booking.status}`
      }, { status: 400 })
    }

    // Check if new session exists and has capacity
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .select('id, max_capacity, booking_count, is_full, start_time, end_time')
      .eq('id', newSessionId)
      .single()

    if (sessionError || !newSession) {
      return NextResponse.json({ error: 'New session not found' }, { status: 404 })
    }

    if (newSession.is_full) {
      return NextResponse.json({ error: 'New session is full' }, { status: 400 })
    }

    // Check for existing booking for same swimmer in new session
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('session_id', newSessionId)
      .eq('swimmer_id', booking.swimmer_id)
      .eq('status', 'confirmed')
      .single()

    if (existingBooking) {
      return NextResponse.json({
        error: 'Swimmer already has a booking for this session'
      }, { status: 400 })
    }

    // Start a transaction
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        session_id: newSessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return NextResponse.json({ error: 'Failed to reschedule booking' }, { status: 500 })
    }

    // Update old session booking count
    const { data: oldSession } = await supabase
      .from('sessions')
      .select('booking_count, max_capacity')
      .eq('id', booking.session_id)
      .single()

    if (oldSession) {
      const newOldBookingCount = Math.max(0, (oldSession.booking_count || 0) - 1)
      const oldIsFull = newOldBookingCount >= oldSession.max_capacity

      await supabase
        .from('sessions')
        .update({
          booking_count: newOldBookingCount,
          is_full: oldIsFull
        })
        .eq('id', booking.session_id)
    }

    // Update new session booking count
    const newBookingCount = (newSession.booking_count || 0) + 1
    const newIsFull = newBookingCount >= newSession.max_capacity

    await supabase
      .from('sessions')
      .update({
        booking_count: newBookingCount,
        is_full: newIsFull
      })
      .eq('id', newSessionId)

    // Log the reschedule
    console.log(`Booking ${id} rescheduled:`, {
      booking_id: id,
      user_id: user.id,
      action: 'reschedule',
      old_session_id: booking.session_id,
      new_session_id: newSessionId,
      notify_parent: notifyParent || false,
      timestamp: new Date().toISOString()
    })

    // Send notification to parent if requested
    if (notifyParent) {
      try {
        // Get parent email
        const { data: parent } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', booking.parent_id)
          .single()

        if (parent?.email) {
          // In a real app, you would send an email here
          console.log(`Would send reschedule notification to ${parent.email}`)
          // Example: await sendRescheduleEmail(parent.email, booking.id, newSession)
        }
      } catch (emailError) {
        console.error('Error sending notification:', emailError)
        // Don't fail the reschedule if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully',
      booking: {
        id,
        new_session_id: newSessionId,
        session_time: newSession.start_time
      }
    })

  } catch (error) {
    console.error('Error in reschedule API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}