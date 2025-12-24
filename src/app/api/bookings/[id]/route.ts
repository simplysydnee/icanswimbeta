import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        booking_type,
        notes,
        created_at,
        updated_at,
        canceled_at,
        cancel_reason,
        cancel_source,
        canceled_by,
        session:sessions (
          id,
          start_time,
          end_time,
          location,
          instructor_id,
          session_type,
          session_type_detail,
          notes:session_notes,
          instructor:profiles!instructor_id (
            id,
            full_name,
            email,
            phone
          )
        ),
        swimmer:swimmers (
          id,
          first_name,
          last_name,
          date_of_birth,
          gender,
          funding_source_id,
          flexible_swimmer,
          current_level_id,
          funding_source:funding_sources (
            id,
            name,
            short_name,
            type,
            contact_name,
            contact_email,
            contact_phone
          ),
          level:swim_levels (
            id,
            name,
            display_name,
            color
          )
        ),
        parent:profiles!parent_id (
          id,
          full_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          zip_code
        ),
        progress_notes:progress_notes (
          id,
          lesson_summary,
          instructor_notes,
          parent_notes,
          created_at,
          instructor:profiles!instructor_id (
            full_name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching booking:', error)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ booking })

  } catch (error) {
    console.error('Error in booking API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    // Get current booking to check session
    const { data: currentBooking } = await supabase
      .from('bookings')
      .select('session_id, status')
      .eq('id', id)
      .single()

    if (!currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Update booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking:', error)
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    // If status changed to cancelled, update session booking count
    if (body.status === 'cancelled' && currentBooking.status !== 'cancelled') {
      const { data: session } = await supabase
        .from('sessions')
        .select('booking_count, max_capacity')
        .eq('id', currentBooking.session_id)
        .single()

      if (session) {
        const newBookingCount = Math.max(0, (session.booking_count || 0) - 1)
        const isFull = newBookingCount >= session.max_capacity

        await supabase
          .from('sessions')
          .update({
            booking_count: newBookingCount,
            is_full: isFull
          })
          .eq('id', currentBooking.session_id)
      }
    }

    return NextResponse.json({
      booking,
      message: 'Booking updated successfully'
    })

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Get booking details before deletion
    const { data: booking } = await supabase
      .from('bookings')
      .select('session_id, status')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Delete booking
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting booking:', error)
      return NextResponse.json(
        { error: 'Failed to delete booking' },
        { status: 500 }
      )
    }

    // Update session booking count if booking was confirmed
    if (booking.status === 'confirmed') {
      const { data: session } = await supabase
        .from('sessions')
        .select('booking_count, max_capacity')
        .eq('id', booking.session_id)
        .single()

      if (session) {
        const newBookingCount = Math.max(0, (session.booking_count || 0) - 1)
        const isFull = newBookingCount >= session.max_capacity

        await supabase
          .from('sessions')
          .update({
            booking_count: newBookingCount,
            is_full: isFull
          })
          .eq('id', booking.session_id)
      }
    }

    return NextResponse.json({
      message: 'Booking deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}