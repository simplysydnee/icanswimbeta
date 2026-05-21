import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { swimmerId, batchId, reason } = body

    if (!swimmerId || !batchId) {
      return NextResponse.json(
        { error: 'Swimmer ID and Batch ID are required' },
        { status: 400 }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    const isAdmin = !!userRole

    // Get swimmer to verify ownership
    const { data: swimmer } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, funding_source_id, parent_id')
      .eq('id', swimmerId)
      .single()

    if (!swimmer) {
      return NextResponse.json({ error: 'Swimmer not found' }, { status: 404 })
    }

    // Verify ownership (unless admin)
    if (!isAdmin && swimmer.parent_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel these bookings' },
        { status: 403 }
      )
    }

    // Get all confirmed bookings in this batch for this swimmer
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        session_id,
        session:sessions (
          id,
          start_time,
          end_time,
          location,
          booking_count,
          batch_id,
          instructor_id
        )
      `)
      .eq('swimmer_id', swimmerId)
      .eq('status', 'confirmed')

    if (bookingsError) {
      throw new Error('Failed to fetch bookings')
    }

    // Filter to only bookings in this batch
    const blockBookings = (bookings || []).filter(
      b => (b.session as any)?.batch_id === batchId
    )

    if (blockBookings.length === 0) {
      return NextResponse.json(
        { error: 'No active bookings found in this block' },
        { status: 404 }
      )
    }

    // Check if first session has already started
    const now = new Date()
    const sortedBookings = blockBookings.sort(
      (a, b) => new Date((a.session as any).start_time).getTime() - new Date((b.session as any).start_time).getTime()
    )
    const firstSession = sortedBookings[0]
    const firstSessionStart = new Date((firstSession.session as any).start_time)

    if (firstSessionStart <= now && !isAdmin) {
      return NextResponse.json({
        error: 'Cannot cancel block after first session has started',
        message: 'The first session in this block has already occurred. You can only cancel individual future sessions.',
        firstSessionDate: (firstSession.session as any).start_time,
      }, { status: 400 })
    }

    const results = {
      canceled: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Cancel each booking atomically via cancel_booking RPC
    // Block cancellations are planned and timely — DO NOT create floating
    // sessions (those are for late/single cancellations). The cancelled slot
    // is reopened for a new family to pick up as recurring.
    for (const booking of blockBookings) {
      const sessionStart = new Date(booking.session.start_time)

      // Skip past sessions
      if (sessionStart <= now) {
        results.skipped++
        continue
      }

      try {
        const { data: cancelResult, error: cancelError } = await supabase.rpc('cancel_booking', {
          p_booking_id: booking.id,
          p_cancelled_by: user.id,
          p_cancel_reason: reason || 'Block cancellation',
          p_cancel_source: 'parent',
          p_is_late_cancel: false,
          p_late_cancel_type: null,
          p_late_cancel_note: null,
        });

        if (cancelError || cancelResult?.error) {
          results.errors.push(`Booking ${booking.id}: ${cancelResult?.error || cancelError?.message}`);
        } else {
          results.canceled++;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        results.errors.push(`Failed to cancel booking ${booking.id}: ${errorMessage}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cancelled ${results.canceled} sessions`,
      results,
    })

  } catch (error: unknown) {
    console.error('Block cancel error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel block'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}