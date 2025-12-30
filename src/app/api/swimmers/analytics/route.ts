import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { differenceInDays, subDays } from 'date-fns'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  enrollment_status: string
  approval_status: string
  created_at: string
  updated_at: string
  parent?: {
    email?: string
  }
}

interface Booking {
  id: string
  swimmer_id: string
  status: string
  created_at: string
  session?: {
    start_time: string
  }
}

export async function GET() {
  const supabase = await createClient()
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)
  const sixtyDaysAgo = subDays(now, 60)
  const ninetyDaysAgo = subDays(now, 90)

  try {
    // Get all swimmers with their latest booking
    const { data: swimmers, error: swimmerError } = await supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        enrollment_status,
        approval_status,
        created_at,
        updated_at,
        parent:profiles!parent_id(email)
      `)

    if (swimmerError) throw swimmerError

    // Get all bookings grouped by swimmer
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        swimmer_id,
        status,
        created_at,
        session:sessions(start_time)
      `)
      .in('status', ['confirmed', 'completed'])

    if (bookingError) throw bookingError

    // Create booking map by swimmer
    const bookingsBySwimmer: Record<string, Booking[]> = {}
    bookings?.forEach(b => {
      if (!bookingsBySwimmer[b.swimmer_id]) {
        bookingsBySwimmer[b.swimmer_id] = []
      }
      bookingsBySwimmer[b.swimmer_id].push(b)
    })

    // Calculate metrics
    const swimmersData = swimmers as Swimmer[] | null
    const total = swimmersData?.length || 0
    const enrolled = swimmersData?.filter(s => s.enrollment_status === 'enrolled') || []
    const waitlisted = swimmersData?.filter(s => s.enrollment_status === 'waitlist') || []
    const dropped = swimmersData?.filter(s => s.enrollment_status === 'dropped') || []
    const declined = swimmersData?.filter(s => s.approval_status === 'declined') || []

    // Enrolled with bookings this month
    const enrolledWithBookings = enrolled.filter(s => {
      const swimmerBookings = bookingsBySwimmer[s.id] || []
      return swimmerBookings.some(b => new Date(b.created_at) >= thirtyDaysAgo)
    })

    // Average days on waitlist
    const waitlistDays = waitlisted.map(s =>
      differenceInDays(now, new Date(s.created_at))
    )
    const avgWaitlistDays = waitlistDays.length > 0
      ? Math.round(waitlistDays.reduce((a, b) => a + b, 0) / waitlistDays.length)
      : 0

    // Find inactive swimmers (enrolled but no recent bookings)
    const findInactive = (days: number) => {
      const cutoff = subDays(now, days)
      return enrolled.filter(s => {
        const swimmerBookings = bookingsBySwimmer[s.id] || []
        if (swimmerBookings.length === 0) return true
        const lastBooking = swimmerBookings
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        return new Date(lastBooking.created_at) < cutoff
      }).map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        parentEmail: s.parent?.email,
        lastBooking: bookingsBySwimmer[s.id]?.[0]?.created_at
      }))
    }

    const inactive30 = findInactive(30)
    const inactive60 = findInactive(60)
    const inactive90 = findInactive(90)

    // Average lessons per swimmer
    const enrolledBookingCounts = enrolled.map(s =>
      (bookingsBySwimmer[s.id] || []).length
    )
    const avgLessons = enrolledBookingCounts.length > 0
      ? (enrolledBookingCounts.reduce((a, b) => a + b, 0) / enrolledBookingCounts.length).toFixed(1)
      : '0.0'

    // Top 5 most active
    const mostActive = enrolled
      .map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        bookings: (bookingsBySwimmer[s.id] || []).length
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    return NextResponse.json({
      total,
      enrollment: {
        enrolled: enrolled.length,
        enrolledPercent: total > 0 ? Math.round((enrolled.length / total) * 100) : 0,
        withBookingsThisMonth: enrolledWithBookings.length,
        withBookingsPercent: enrolled.length > 0
          ? Math.round((enrolledWithBookings.length / enrolled.length) * 100)
          : 0,
        waitlisted: waitlisted.length,
        avgWaitlistDays,
        dropped: dropped.length,
        declined: declined.length
      },
      engagement: {
        inactive30: inactive30.length,
        inactive60: inactive60.length,
        inactive90: inactive90.length,
        inactive30List: inactive30.slice(0, 10),
        inactive60List: inactive60.slice(0, 10),
        inactive90List: inactive90.slice(0, 10)
      },
      activity: {
        avgLessonsPerSwimmer: avgLessons,
        mostActive
      }
    })

  } catch (error: any) {
    console.error('Swimmer analytics error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}