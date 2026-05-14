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

    // ── Cancel action: handled entirely via cancel_booking RPC ─────
    if (action === 'cancel') {
      if (!data?.reason) {
        return NextResponse.json(
          { error: 'Cancel reason is required' },
          { status: 400 }
        )
      }

      const cancelErrors: string[] = []
      let cancelledCount = 0

      for (const booking of bookings) {
        if (booking.status === 'cancelled' || booking.status === 'completed') continue

        const result = await supabase.rpc('cancel_booking', {
          p_booking_id: booking.id,
          p_cancelled_by: booking.id,            // Bulk ops use booking ID as system marker
          p_cancel_reason: data.reason,
          p_cancel_source: 'admin',
          p_is_late_cancel: false,
          p_late_cancel_type: null,
          p_late_cancel_note: null,
        })

        if (result.error || result.data?.error) {
          cancelErrors.push(`Booking ${booking.id}: ${result.data?.error || result.error?.message}`)
        } else {
          cancelledCount++
        }
      }

      if (cancelErrors.length > 0) {
        console.error('Bulk cancel errors:', cancelErrors)
      }

      return NextResponse.json({
        success: true,
        message: `${cancelledCount} bookings cancelled`,
        count: cancelledCount,
        errors: cancelErrors.length > 0 ? cancelErrors : undefined,
      })
    }

    let updateData: any = {}
    let message = ''

    switch (action) {
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