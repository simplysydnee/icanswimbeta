import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const instructorId = searchParams.get('instructorId')
    const status = searchParams.get('status') // comma-separated list
    const paymentType = searchParams.get('paymentType')
    const search = searchParams.get('search')
    const bookingType = searchParams.get('bookingType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        status,
        booking_type,
        notes,
        created_at,
        canceled_at,
        cancel_reason,
        cancel_source,
        session:sessions (
          id,
          start_time,
          end_time,
          location,
          instructor_id,
          instructor:profiles!instructor_id (
            id,
            full_name,
            email
          )
        ),
        swimmer:swimmers (
          id,
          first_name,
          last_name,
          funding_source_id,
          flexible_swimmer,
          funding_source:funding_sources (
            id,
            name,
            short_name,
            type
          )
        ),
        parent:profiles!parent_id (
          id,
          full_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (startDate && endDate) {
      query = query
        .gte('sessions.start_time', startDate)
        .lte('sessions.start_time', endDate)
    }

    if (instructorId) {
      query = query.eq('sessions.instructor_id', instructorId)
    }

    if (status) {
      const statuses = status.split(',')
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0])
      } else {
        query = query.in('status', statuses)
      }
    }

    if (paymentType) {
      if (paymentType === 'private_pay') {
        query = query.is('swimmers.funding_source_id', null)
      } else if (paymentType === 'regional_center') {
        query = query.not('swimmers.funding_source_id', 'is', null)
      }
    }

    if (bookingType) {
      query = query.eq('booking_type', bookingType)
    }

    // Search by swimmer name, parent name, or email
    if (search && search.trim() !== '') {
      console.log('=== SEARCH DEBUG ===');
      console.log('Original search:', search);

      // Escape special characters for SQL
      let escapedSearch = search;
      // Escape % and _ (SQL wildcards) - search for literal % and _
      escapedSearch = escapedSearch.replace(/[%_]/g, '\\$&');
      // Escape single quotes by doubling them for SQL
      escapedSearch = escapedSearch.replace(/'/g, "''");

      const searchPattern = `%${escapedSearch}%`;
      console.log('Escaped search:', escapedSearch);
      console.log('Search pattern:', searchPattern);

      // Apply search filter to main query
      // According to Supabase docs, or() should NOT have quotes around the pattern
      const orString = `swimmers.first_name.ilike.${searchPattern},swimmers.last_name.ilike.${searchPattern}`;
      console.log('Generated or() string:', orString);
      query = query.or(orString);
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    // Get summary stats
    const statsQuery = supabase
      .from('bookings')
      .select('status', { count: 'exact', head: true })

    if (startDate && endDate) {
      statsQuery
        .gte('sessions.start_time', startDate)
        .lte('sessions.start_time', endDate)
    }

    const { count: totalCount } = await statsQuery

    // Get status counts
    const statusCounts: Record<string, number> = {}
    const statuses = ['confirmed', 'completed', 'cancelled', 'no_show']

    for (const status of statuses) {
      const statusQuery = supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', status)

      if (startDate && endDate) {
        statusQuery
          .gte('sessions.start_time', startDate)
          .lte('sessions.start_time', endDate)
      }

      const { count } = await statusQuery
      statusCounts[status] = count || 0
    }

    return NextResponse.json({
      bookings: data || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
      stats: statusCounts
    })

  } catch (error) {
    console.error('Error in bookings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    const { sessionId, swimmerId, parentId, bookingType = 'lesson', notes } = body

    if (!sessionId || !swimmerId || !parentId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, swimmerId, parentId' },
        { status: 400 }
      )
    }

    // Check if session exists and has capacity
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, max_capacity, booking_count, is_full')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.is_full) {
      return NextResponse.json(
        { error: 'Session is full' },
        { status: 400 }
      )
    }

    // Check for existing booking for same swimmer and session
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('session_id', sessionId)
      .eq('swimmer_id', swimmerId)
      .eq('status', 'confirmed')
      .single()

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Swimmer already has a booking for this session' },
        { status: 400 }
      )
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        session_id: sessionId,
        swimmer_id: swimmerId,
        parent_id: parentId,
        booking_type: bookingType,
        notes,
        status: 'confirmed'
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Update session booking count
    const newBookingCount = (session.booking_count || 0) + 1
    const isFull = newBookingCount >= session.max_capacity

    await supabase
      .from('sessions')
      .update({
        booking_count: newBookingCount,
        is_full: isFull
      })
      .eq('id', sessionId)

    return NextResponse.json({
      booking,
      message: 'Booking created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}