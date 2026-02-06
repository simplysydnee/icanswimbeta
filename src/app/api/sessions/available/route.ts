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
    const location = searchParams.get('location')
    const sessionType = searchParams.get('sessionType')
    const excludeSessionId = searchParams.get('excludeSessionId')

    // Build query for available sessions (not full, status available/open)
    let query = supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        end_time,
        location,
        instructor_id,
        max_capacity,
        booking_count,
        is_full,
        session_type,
        session_type_detail,
        price_cents,
        instructor:profiles!instructor_id (
          id,
          full_name,
          email
        ),
        bookings:bookings (
          id,
          status,
          swimmer:swimmers (
            id,
            first_name,
            last_name
          )
        )
      `)
      .or('status.eq.available,status.eq.open')
      .neq('status', 'closed')
      .eq('is_full', false)
      .order('start_time', { ascending: true })

    // Apply filters
    if (startDate && endDate) {
      query = query
        .gte('start_time', startDate)
        .lte('start_time', endDate)
    }

    if (instructorId) {
      query = query.eq('instructor_id', instructorId)
    }

    if (location) {
      query = query.eq('location', location)
    }

    if (sessionType) {
      query = query.eq('session_type', sessionType)
    }

    if (excludeSessionId) {
      query = query.neq('id', excludeSessionId)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching available sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch available sessions' },
        { status: 500 }
      )
    }

    // Group sessions by date for easier frontend display
    const sessionsByDate: Record<string, any[]> = {}

    sessions?.forEach(session => {
      const date = new Date(session.start_time).toISOString().split('T')[0]
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = []
      }
      sessionsByDate[date].push(session)
    })

    return NextResponse.json({
      sessions: sessions || [],
      sessionsByDate,
      total: sessions?.length || 0
    })

  } catch (error) {
    console.error('Error in available sessions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}