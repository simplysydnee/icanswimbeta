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

    // Verify parent owns this booking before delegating to the shared service.
    // The service is intentionally trusted (admin/system can call it directly)
    // so the parent-ownership check stays in this route.
    const { data: booking, error: bookingError } = await serviceSupabase
      .from('bookings')
      .select('id, status, swimmer:swimmers(parent_id)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if ((booking.swimmer as any)?.parent_id !== user.id) {
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

    // Delegate to the shared cancellation service. The service handles:
    //   - booking status flip + analytics row
    //   - session.booking_count decrement
    //   - PO sessions_booked decrement (BUG-00d)
    //   - late-cancellation: flexible_swimmer + floating_session creation
    //   - assessment-specific cleanup
    const result = await cancelBooking(serviceSupabase, {
      bookingId,
      source: 'parent',
      canceledByUserId: user.id,
      reason: reason ?? null,
    })

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      hoursBeforeSession: result.hoursBeforeSession,
      isLateCancellation: result.isLateCancellation,
      isSemiPrivate: result.isSemiPrivate,
      createdFloatingSession: result.createdFloatingSession,
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
