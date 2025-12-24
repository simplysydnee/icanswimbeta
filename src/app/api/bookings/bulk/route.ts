import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { action, bookingIds, data } = body

    if (!action || !bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: action, bookingIds' },
        { status: 400 }
      )
    }

    // Get current bookings to track session updates
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, session_id, status')
      .in('id', bookingIds)

    if (!bookings || bookings.length === 0) {
      return NextResponse.json(
        { error: 'No bookings found' },
        { status: 404 }
      )
    }

    let updateData: any = {}
    let message = ''

    switch (action) {
      case 'cancel':
        if (!data?.reason) {
          return NextResponse.json(
            { error: 'Cancel reason is required' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'cancelled',
          cancel_reason: data.reason,
          cancel_source: 'admin',
          canceled_at: new Date().toISOString(),
          notes: data.notes ? `${data.notes}\n\n[Bulk cancel: ${data.reason}]` : `[Bulk cancel: ${data.reason}]`
        }
        message = `${bookings.length} bookings cancelled`
        break

      case 'change_instructor':
        if (!data?.instructorId) {
          return NextResponse.json(
            { error: 'Instructor ID is required' },
            { status: 400 }
          )
        }
        // This requires updating the session, not the booking
        const sessionIds = [...new Set(bookings.map(b => b.session_id).filter(Boolean))]

        const { error: sessionError } = await supabase
          .from('sessions')
          .update({ instructor_id: data.instructorId })
          .in('id', sessionIds)

        if (sessionError) {
          console.error('Error updating sessions:', sessionError)
          return NextResponse.json(
            { error: 'Failed to update instructor' },
            { status: 500 }
          )
        }

        // Add note to bookings about instructor change
        updateData = {
          notes: `[Bulk instructor change: ${data.instructorId}${data.reason ? ` - ${data.reason}` : ''}]`
        }
        message = `Instructor changed for ${bookings.length} bookings`
        break

      case 'mark_completed':
        updateData = {
          status: 'completed',
          notes: data?.notes ? `${data.notes}\n\n[Bulk marked completed]` : '[Bulk marked completed]'
        }
        message = `${bookings.length} bookings marked as completed`
        break

      case 'mark_no_show':
        updateData = {
          status: 'no_show',
          notes: data?.notes ? `${data.notes}\n\n[Bulk marked no-show]` : '[Bulk marked no-show]'
        }
        message = `${bookings.length} bookings marked as no-show`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update bookings if we have update data
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .in('id', bookingIds)

      if (updateError) {
        console.error('Error updating bookings:', updateError)
        return NextResponse.json(
          { error: 'Failed to update bookings' },
          { status: 500 }
        )
      }
    }

    // Update session booking counts for cancellations
    if (action === 'cancel') {
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
      const sessionCounts: Record<string, number> = {}

      // Count cancellations per session
      confirmedBookings.forEach(booking => {
        if (booking.session_id) {
          sessionCounts[booking.session_id] = (sessionCounts[booking.session_id] || 0) + 1
        }
      })

      // Update each session
      for (const [sessionId, cancelCount] of Object.entries(sessionCounts)) {
        const { data: session } = await supabase
          .from('sessions')
          .select('booking_count, max_capacity')
          .eq('id', sessionId)
          .single()

        if (session) {
          const newBookingCount = Math.max(0, (session.booking_count || 0) - cancelCount)
          const isFull = newBookingCount >= session.max_capacity

          await supabase
            .from('sessions')
            .update({
              booking_count: newBookingCount,
              is_full: isFull
            })
            .eq('id', sessionId)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message,
      count: bookings.length
    })

  } catch (error) {
    console.error('Error in bulk bookings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}