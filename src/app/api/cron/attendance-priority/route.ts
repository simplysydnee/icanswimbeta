import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

// Vercel Cron calls this endpoint
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')

  // In production, verify CRON_SECRET
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow Vercel's internal cron calls
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'
    if (!isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  console.log('🕐 Attendance Priority Cron Started:', new Date().toISOString())

  try {
    const supabase = await createClient()
    const lastMonth = subMonths(new Date(), 1)
    const monthStart = startOfMonth(lastMonth)
    const monthEnd = endOfMonth(lastMonth)

    // 1. Clear expired attendance priorities first
    const { data: cleared, error: clearError } = await supabase
      .from('swimmers')
      .update({
        is_priority_booking: false,
        priority_booking_reason: null,
        priority_booking_notes: null,
        priority_booking_set_at: null,
        priority_booking_expires_at: null
      })
      .eq('is_priority_booking', true)
      .eq('priority_booking_reason', 'attendance')
      .lt('priority_booking_expires_at', new Date().toISOString())
      .select('id, first_name, last_name')

    if (clearError) {
      console.error('Error clearing expired priorities:', clearError)
    }

    console.log(`✅ Cleared ${cleared?.length || 0} expired priorities`)

    // 2. Get all enrolled swimmers
    const { data: swimmers, error: swimmerError } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, is_priority_booking, priority_booking_reason')
      .eq('enrollment_status', 'enrolled')

    if (swimmerError) throw swimmerError

    // 3. Get bookings for last month
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('swimmer_id, status')
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString())

    if (bookingError) throw bookingError

    // 4. Calculate perfect attendance
    const bookingsBySwimmer: Record<string, { total: number; completed: number }> = {}

    bookings?.forEach(b => {
      if (!bookingsBySwimmer[b.swimmer_id]) {
        bookingsBySwimmer[b.swimmer_id] = { total: 0, completed: 0 }
      }
      bookingsBySwimmer[b.swimmer_id].total++
      if (b.status === 'completed') {
        bookingsBySwimmer[b.swimmer_id].completed++
      }
    })

    // 5. Find swimmers with perfect attendance
    const perfectSwimmers = swimmers?.filter(s => {
      const stats = bookingsBySwimmer[s.id]
      // Must have bookings AND all must be completed
      return stats && stats.total > 0 && stats.total === stats.completed
    }) || []

    console.log(`📊 Found ${perfectSwimmers.length} swimmers with perfect attendance`)

    // 6. Grant priority (skip those with manual priority)
    const granted: string[] = []
    const skipped: string[] = []
    const expiresAt = endOfMonth(new Date())

    for (const swimmer of perfectSwimmers) {
      // Skip if already has manual priority
      if (swimmer.is_priority_booking && swimmer.priority_booking_reason !== 'attendance') {
        skipped.push(`${swimmer.first_name} ${swimmer.last_name}`)
        continue
      }

      const { error: updateError } = await supabase
        .from('swimmers')
        .update({
          is_priority_booking: true,
          priority_booking_reason: 'attendance',
          priority_booking_notes: `Perfect attendance for ${lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          priority_booking_set_at: new Date().toISOString(),
          priority_booking_expires_at: expiresAt.toISOString()
        })
        .eq('id', swimmer.id)

      if (!updateError) {
        granted.push(`${swimmer.first_name} ${swimmer.last_name}`)
      }
    }

    console.log(`⭐ Granted priority to: ${granted.join(', ') || 'none'}`)
    console.log(`⏭️ Skipped (manual priority): ${skipped.join(', ') || 'none'}`)
    console.log('🕐 Attendance Priority Cron Completed:', new Date().toISOString())

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        cleared: cleared?.length || 0,
        checked: swimmers?.length || 0,
        perfectAttendance: perfectSwimmers.length,
        granted: granted.length,
        skipped: skipped.length,
        grantedNames: granted,
        skippedNames: skipped
      }
    })

  } catch (error: any) {
    console.error('❌ Attendance Priority Cron Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Cron job failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST also supported for manual triggers
export async function POST(request: Request) {
  return GET(request)
}