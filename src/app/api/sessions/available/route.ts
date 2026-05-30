import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { studioDateString, studioDayOfWeek } from '@/lib/timezone'

/**
 * Returns the UTC ISO timestamp for 00:00 in studio TZ on the given wall-clock
 * date (yyyy-MM-dd). Handles PT's PDT/PST switch by candidate-checking which
 * offset interprets back to the same wall-clock date.
 */
function studioMidnightUtcIso(ymd: string): string {
  const candidatePdt = new Date(`${ymd}T00:00:00-07:00`)
  if (studioDateString(candidatePdt) === ymd) return candidatePdt.toISOString()
  return new Date(`${ymd}T00:00:00-08:00`).toISOString()
}

export async function GET(request: NextRequest) {
  try {
    console.log('Available sessions API called')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SECRET_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const instructorId = searchParams.get('instructorId')
    const location = searchParams.get('location')
    const sessionType =
      searchParams.get('sessionType') ?? searchParams.get('session_type')
    const excludeSessionId = searchParams.get('excludeSessionId')
    const isRecurring = searchParams.get('isRecurring')

    // Early return: datesOnly mode — return distinct date strings
    if (searchParams.get('datesOnly') === 'true') {
      let dd = supabase
        .from('sessions')
        .select('start_time')
        .or('status.eq.available,status.eq.open')
        .neq('status', 'closed')
        .eq('is_full', false)
      if (startDate && endDate) {
        dd = dd.gte('start_time', startDate).lte('start_time', endDate)
      }
      if (sessionType) dd = dd.eq('session_type', sessionType)
      if (isRecurring === 'true') dd = dd.eq('is_recurring', true)
      else if (isRecurring === 'false') dd = dd.eq('is_recurring', false)
      if (instructorId) dd = dd.eq('instructor_id', instructorId)
      const { data: rows, error: ddError } = await dd
      if (ddError) {
        return NextResponse.json({ error: 'Failed to fetch available dates' }, { status: 500 })
      }
      // Bucket by studio-TZ date so the calendar's enabled/disabled state matches
      // what users see on the time-slot picker (which renders in studio TZ).
      const dates = [...new Set((rows || []).map(r => studioDateString(r.start_time)))].sort()
      return NextResponse.json({ dates })
    }

    // Early return: instructorsOnly mode — return distinct instructor IDs
    if (searchParams.get('instructorsOnly') === 'true') {
      // Compute the end of the studio's current calendar week (next Sunday 00:00 PT)
      // for the "session available this week" badge in the parent booking flow.
      const now = new Date()
      const todayYmd = studioDateString(now)
      const dow = studioDayOfWeek(now) // 0=Sun ... 6=Sat
      const daysUntilNextSunday = ((7 - dow) % 7) || 7 // Sunday today → next Sunday
      const [y, m, d] = todayYmd.split('-').map(Number)
      const nextSundayDateUtc = new Date(Date.UTC(y, m - 1, d + daysUntilNextSunday))
      const nextSundayYmd = `${nextSundayDateUtc.getUTCFullYear()}-${String(nextSundayDateUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(nextSundayDateUtc.getUTCDate()).padStart(2, '0')}`
      const weekEndIso = studioMidnightUtcIso(nextSundayYmd)
      const nowIso = now.toISOString()

      const baseAll = supabase
        .from('sessions')
        .select('instructor_id')
        .or('status.eq.available,status.eq.open')
        .neq('status', 'closed')
        .eq('is_full', false)
        .gte('start_time', nowIso)
      let iq = baseAll
      if (sessionType) iq = iq.eq('session_type', sessionType)
      if (isRecurring === 'true') iq = iq.eq('is_recurring', true)
      else if (isRecurring === 'false') iq = iq.eq('is_recurring', false)

      let iqWeek = supabase
        .from('sessions')
        .select('instructor_id')
        .or('status.eq.available,status.eq.open')
        .neq('status', 'closed')
        .eq('is_full', false)
        .gte('start_time', nowIso)
        .lt('start_time', weekEndIso)
      if (sessionType) iqWeek = iqWeek.eq('session_type', sessionType)
      if (isRecurring === 'true') iqWeek = iqWeek.eq('is_recurring', true)
      else if (isRecurring === 'false') iqWeek = iqWeek.eq('is_recurring', false)

      const [{ data: rows, error: iqError }, { data: weekRows, error: iqWeekError }] = await Promise.all([
        iq,
        iqWeek,
      ])
      if (iqError || iqWeekError) {
        return NextResponse.json({ error: 'Failed to fetch instructors' }, { status: 500 })
      }
      const instructorIds = [...new Set((rows || []).map(r => r.instructor_id))]
      const currentWeekInstructorIds = [...new Set((weekRows || []).map(r => r.instructor_id).filter(Boolean))]
      return NextResponse.json({ instructorIds, currentWeekInstructorIds })
    }

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
        is_recurring,
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
      .gte('start_time', new Date().toISOString())
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

    if (isRecurring === 'true') {
      query = query.eq('is_recurring', true)
    } else if (isRecurring === 'false') {
      query = query.eq('is_recurring', false)
    }

    if (sessionType) {
      query = query.eq('session_type', sessionType)
    }

    /*
    if (location) {
      query = query.eq('location', location)
    }

    if (excludeSessionId) {
      query = query.neq('id', excludeSessionId)
    }
      */

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
      const date = studioDateString(session.start_time)
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = []
      }
      sessionsByDate[date].push(session)
    })

    console.log("Sessions:", sessions)
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