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
  }[]
}

export async function GET() {
  const supabase = await createClient()
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)
  const sixtyDaysAgo = subDays(now, 60)
  const ninetyDaysAgo = subDays(now, 90)

  try {
    // Get total count
    const { count: total, error: totalError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    // Get counts for each enrollment status using database queries
    // We need to check for all possible status values mentioned by the user
    const { count: enrolled, error: enrolledError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'enrolled')

    if (enrolledError) throw enrolledError

    const { count: waitlisted, error: waitlistedError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'waitlist')

    if (waitlistedError) throw waitlistedError

    const { count: dropped, error: droppedError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'dropped')

    if (droppedError) throw droppedError

    // Check for 'declined' in enrollment_status (not approval_status)
    const { count: declined, error: declinedError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'declined')

    if (declinedError) throw declinedError

    // Also check for other status values the user mentioned
    const { count: pending, error: pendingError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'pending')

    if (pendingError) throw pendingError

    const { count: expired, error: expiredError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'expired')

    if (expiredError) throw expiredError

    const { count: pendingApproval, error: pendingApprovalError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'pending_approval')

    if (pendingApprovalError) throw pendingApprovalError

    const { count: pendingEnrollment, error: pendingEnrollmentError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'pending_enrollment')

    if (pendingEnrollmentError) throw pendingEnrollmentError

    // Log all counts for debugging
    console.log('Swimmer counts:', {
      total,
      enrolled,
      waitlisted,
      dropped,
      declined,
      pending,
      expired,
      pendingApproval,
      pendingEnrollment
    })

    // Get all enrolled swimmers with their latest booking for further calculations
    const { data: enrolledSwimmers, error: enrolledSwimmersError } = await supabase
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
      .eq('enrollment_status', 'enrolled')

    if (enrolledSwimmersError) throw enrolledSwimmersError

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

    // Calculate metrics using enrolled swimmers data
    const enrolledSwimmersData = enrolledSwimmers as Swimmer[] | null

    // Enrolled with bookings this month
    const enrolledWithBookings = enrolledSwimmersData?.filter(s => {
      const swimmerBookings = bookingsBySwimmer[s.id] || []
      return swimmerBookings.some(b => new Date(b.created_at) >= thirtyDaysAgo)
    }) || []

    // Get waitlisted swimmers for average days calculation
    const { data: waitlistedSwimmers, error: waitlistedSwimmersError } = await supabase
      .from('swimmers')
      .select('created_at')
      .eq('enrollment_status', 'waitlist')

    if (waitlistedSwimmersError) throw waitlistedSwimmersError

    // Average days on waitlist
    const waitlistDays = waitlistedSwimmers?.map(s =>
      differenceInDays(now, new Date(s.created_at))
    ) || []
    const avgWaitlistDays = waitlistDays.length > 0
      ? Math.round(waitlistDays.reduce((a, b) => a + b, 0) / waitlistDays.length)
      : 0

    // Find inactive swimmers (enrolled but no recent bookings)
    const findInactive = (days: number) => {
      const cutoff = subDays(now, days)
      return enrolledSwimmersData?.filter(s => {
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
      })) || []
    }

    const inactive30 = findInactive(30)
    const inactive60 = findInactive(60)
    const inactive90 = findInactive(90)

    // Average lessons per swimmer
    const enrolledBookingCounts = enrolledSwimmersData?.map(s =>
      (bookingsBySwimmer[s.id] || []).length
    ) || []
    const avgLessons = enrolledBookingCounts.length > 0
      ? (enrolledBookingCounts.reduce((a, b) => a + b, 0) / enrolledBookingCounts.length).toFixed(1)
      : '0.0'

    // Top 5 most active
    const mostActive = enrolledSwimmersData
      ?.map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        bookings: (bookingsBySwimmer[s.id] || []).length
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5) || []

    return NextResponse.json({
      total: total || 0,
      enrollment: {
        enrolled: enrolled || 0,
        enrolledPercent: total && total > 0 ? Math.round(((enrolled || 0) / total) * 100) : 0,
        withBookingsThisMonth: enrolledWithBookings.length,
        withBookingsPercent: (enrolled || 0) > 0
          ? Math.round((enrolledWithBookings.length / (enrolled || 0)) * 100)
          : 0,
        waitlisted: waitlisted || 0,
        avgWaitlistDays,
        dropped: dropped || 0,
        declined: declined || 0
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