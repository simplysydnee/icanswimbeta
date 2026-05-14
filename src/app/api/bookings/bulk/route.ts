import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cancelBooking } from '@/lib/booking/cancel'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('Missing Supabase env (service role)')
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

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

    // Identify the actor for the analytics rows the cancel branch writes.
    const { data: { user } } = await supabase.auth.getUser()

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

    // The cancel branch goes through the shared cancellation service so that
    // bulk cancellations have the same side effects as the parent-initiated
    // cancel endpoint: decrements session.booking_count and PO sessions_booked,
    // flips flexible_swimmer + creates floating_sessions for late cancellations,
    // and writes an analytics row per booking (BUG-00e + BUG-00d).
    if (action === 'cancel') {
      if (!data?.reason) {
        return NextResponse.json(
          { error: 'Cancel reason is required' },
          { status: 400 }
        )
      }
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const serviceSupabase = getServiceSupabase()
      const results: Array<{ bookingId: string; ok: boolean; error?: string }> = []
      let cancelledCount = 0

      for (const b of bookings) {
        if (b.status === 'cancelled') {
          results.push({ bookingId: b.id, ok: true })
          continue
        }
        try {
          await cancelBooking(serviceSupabase, {
            bookingId: b.id,
            source: 'bulk',
            canceledByUserId: user.id,
            reason: data.reason,
          })
          results.push({ bookingId: b.id, ok: true })
          cancelledCount += 1
        } catch (e: any) {
          console.error(`Bulk cancel failed for ${b.id}:`, e)
          results.push({ bookingId: b.id, ok: false, error: e?.message ?? 'cancel failed' })
        }
      }

      return NextResponse.json({
        success: true,
        message: `${cancelledCount} bookings cancelled`,
        count: cancelledCount,
        results,
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
