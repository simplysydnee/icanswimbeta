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
      b => b.session?.batch_id === batchId
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
      (a, b) => new Date(a.session.start_time).getTime() - new Date(b.session.start_time).getTime()
    )
    const firstSession = sortedBookings[0]
    const firstSessionStart = new Date(firstSession.session.start_time)

    if (firstSessionStart <= now && !isAdmin) {
      return NextResponse.json({
        error: 'Cannot cancel block after first session has started',
        message: 'The first session in this block has already occurred. You can only cancel individual future sessions.',
        firstSessionDate: firstSession.session.start_time,
      }, { status: 400 })
    }

    // Generate block cancellation ID for tracking
    const blockCancelId = crypto.randomUUID()
    const results = {
      canceled: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Cancel each booking
    for (const booking of blockBookings) {
      const sessionStart = new Date(booking.session.start_time)

      // Skip past sessions
      if (sessionStart <= now) {
        results.skipped++
        continue
      }

      const hoursBeforeSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60)

      try {
        // Update booking
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancel_reason: reason || 'Block cancellation',
            canceled_at: now.toISOString(),
            canceled_by: user.id,
          })
          .eq('id', booking.id)

        // Update session
        await supabase
          .from('sessions')
          .update({
            booking_count: Math.max(0, (booking.session.booking_count || 1) - 1),
            is_full: false,
          })
          .eq('id', booking.session.id)

        // Create floating session
        const { data: floatingSession } = await supabase
          .from('floating_sessions')
          .insert({
            original_session_id: booking.session.id,
            original_booking_id: booking.id,
            available_until: booking.session.start_time,
            month_year: sessionStart.toISOString().slice(0, 7),
            status: 'available',
          })
          .select('id')
          .single()

        // Track cancellation
        await supabase
          .from('cancellations')
          .insert({
            booking_id: booking.id,
            session_id: booking.session.id,
            swimmer_id: swimmerId,
            parent_id: swimmer.parent_id,
            canceled_by: user.id,
            cancellation_type: 'block',
            block_id: blockCancelId,
            session_date: booking.session.start_time,
            session_start_time: booking.session.start_time,
            session_end_time: booking.session.end_time,
            session_location: booking.session.location,
            instructor_id: booking.session.instructor_id,
            swimmer_name: `${swimmer.first_name} ${swimmer.last_name}`,
            swimmer_has_funding_source: !!swimmer.funding_source_id,
            hours_before_session: Math.round(hoursBeforeSession * 100) / 100,
            was_late_cancellation: false,
            cancel_reason: reason || 'Block cancellation',
            cancel_source: isAdmin ? 'admin' : 'parent',
            created_floating_session: true,
            floating_session_id: floatingSession?.id,
          })

        results.canceled++
      } catch (err: any) {
        results.errors.push(`Failed to cancel booking ${booking.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cancelled ${results.canceled} sessions`,
      blockId: blockCancelId,
      results,
    })

  } catch (error: any) {
    console.error('Block cancel error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel block' },
      { status: 500 }
    )
  }
}