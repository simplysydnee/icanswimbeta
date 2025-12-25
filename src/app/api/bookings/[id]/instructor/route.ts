import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
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
    const { instructorId, reason, applyToFuture } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Get the booking to check if it exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, session_id, swimmer_id')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if instructor exists
    const { data: instructor, error: instructorError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Update the session's instructor
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ instructor_id: instructorId })
      .eq('id', booking.session_id)

    if (updateError) {
      console.error('Error updating session instructor:', updateError)
      return NextResponse.json({ error: 'Failed to update instructor' }, { status: 500 })
    }

    // If applyToFuture is true, update all future sessions for this swimmer with the same instructor
    if (applyToFuture) {
      // Get all future bookings for this swimmer
      const { data: futureBookings, error: futureError } = await supabase
        .from('bookings')
        .select('session_id')
        .eq('swimmer_id', booking.swimmer_id)
        .eq('status', 'confirmed')
        .gt('sessions.start_time', new Date().toISOString())

      if (!futureError && futureBookings && futureBookings.length > 0) {
        const sessionIds = futureBookings.map(b => b.session_id).filter(Boolean)

        if (sessionIds.length > 0) {
          const { error: bulkUpdateError } = await supabase
            .from('sessions')
            .update({ instructor_id: instructorId })
            .in('id', sessionIds)

          if (bulkUpdateError) {
            console.error('Error updating future sessions:', bulkUpdateError)
            // Don't fail the whole request if bulk update fails
          }
        }
      }
    }

    // Log the change
    console.log(`Instructor changed for booking ${id}:`, {
      booking_id: id,
      user_id: user.id,
      action: 'change_instructor',
      new_instructor_id: instructorId,
      reason,
      apply_to_future: applyToFuture || false,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Instructor changed successfully',
      instructor: {
        id: instructor.id,
        name: instructor.full_name
      }
    })

  } catch (error) {
    console.error('Error in change instructor API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}