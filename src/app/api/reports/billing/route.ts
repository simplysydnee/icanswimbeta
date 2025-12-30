import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { startOfMonth, startOfYear, subWeeks, format } from 'date-fns'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') || format(new Date(), 'yyyy-MM')

  const now = new Date()
  const monthStart = startOfMonth(new Date(month + '-01'))
  const yearStart = startOfYear(now)

  try {
    // 1. Get all purchase orders with related data
    const { data: purchaseOrders, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        authorization_number,
        po_type,
        status,
        billing_status,
        billed_amount_cents,
        paid_amount_cents,
        due_date,
        start_date,
        end_date,
        created_at,
        swimmer:swimmers(
          id,
          first_name,
          last_name,
          payment_type,
          vmrc_coordinator_name,
          vmrc_coordinator_email
        ),
        funding_source:funding_sources(
          id,
          name,
          type
        )
      `)
      .order('created_at', { ascending: false })

    if (poError) throw poError

    // 2. Get bookings for private pay calculations
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        created_at,
        swimmer:swimmers(payment_type),
        session:sessions(
          price_cents,
          instructor_id,
          start_time
        )
      `)
      .eq('status', 'completed')
      .gte('created_at', yearStart.toISOString())

    if (bookingsError) throw bookingsError

    // 3. Calculate metrics
    const metrics = calculateBillingMetrics(purchaseOrders || [], bookings || [], monthStart, yearStart, now)

    return NextResponse.json(metrics)

  } catch (error: any) {
    console.error('Billing report error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing data' },
      { status: 500 }
    )
  }
}

function calculateBillingMetrics(
  purchaseOrders: any[],
  bookings: any[],
  monthStart: Date,
  yearStart: Date,
  now: Date
) {
  // By Funding Source
  const byFundingSource: Record<string, {
    name: string
    monthlyBilled: number
    ytdBilled: number
    monthlyPaid: number
    ytdPaid: number
    outstanding: number
    overdueAmount: number
    overdueCount: number
    pendingAuthCount: number
  }> = {}

  // Coordinator tracking
  const byCoordinator: Record<string, {
    name: string
    email: string
    pendingAuth: number
    overduePOs: number
    totalPOs: number
  }> = {}

  // Process purchase orders
  purchaseOrders.forEach(po => {
    const fsName = po.funding_source?.name || 'Unknown'
    const fsId = po.funding_source?.id || 'unknown'
    const poDate = new Date(po.created_at)
    const isThisMonth = poDate >= monthStart
    const isThisYear = poDate >= yearStart
    const isOverdue = po.due_date && new Date(po.due_date) < now && po.billing_status !== 'paid'
    const isPendingAuth = !po.authorization_number && po.status === 'pending'

    // Convert cents to dollars
    const billed = (po.billed_amount_cents || 0) / 100
    const paid = (po.paid_amount_cents || 0) / 100

    // Initialize funding source
    if (!byFundingSource[fsId]) {
      byFundingSource[fsId] = {
        name: fsName,
        monthlyBilled: 0,
        ytdBilled: 0,
        monthlyPaid: 0,
        ytdPaid: 0,
        outstanding: 0,
        overdueAmount: 0,
        overdueCount: 0,
        pendingAuthCount: 0
      }
    }

    // Add to metrics
    if (isThisMonth) {
      byFundingSource[fsId].monthlyBilled += billed
      byFundingSource[fsId].monthlyPaid += paid
    }
    if (isThisYear) {
      byFundingSource[fsId].ytdBilled += billed
      byFundingSource[fsId].ytdPaid += paid
    }

    byFundingSource[fsId].outstanding += (billed - paid)

    if (isOverdue) {
      byFundingSource[fsId].overdueAmount += (billed - paid)
      byFundingSource[fsId].overdueCount++
    }

    if (isPendingAuth) {
      byFundingSource[fsId].pendingAuthCount++
    }

    // Coordinator tracking
    const coordName = po.swimmer?.vmrc_coordinator_name
    const coordEmail = po.swimmer?.vmrc_coordinator_email
    if (coordName) {
      const coordKey = coordEmail || coordName
      if (!byCoordinator[coordKey]) {
        byCoordinator[coordKey] = {
          name: coordName,
          email: coordEmail || '',
          pendingAuth: 0,
          overduePOs: 0,
          totalPOs: 0
        }
      }
      byCoordinator[coordKey].totalPOs++
      if (isPendingAuth) byCoordinator[coordKey].pendingAuth++
      if (isOverdue) byCoordinator[coordKey].overduePOs++
    }
  })

  // Private Pay from bookings
  const privatePay = {
    monthlyRevenue: 0,
    ytdRevenue: 0,
    outstanding: 0
  }

  bookings.forEach(booking => {
    if (booking.swimmer?.payment_type === 'private_pay') {
      const amount = (booking.session?.price_cents || 0) / 100
      const bookingDate = new Date(booking.created_at)

      if (bookingDate >= monthStart) {
        privatePay.monthlyRevenue += amount
      }
      privatePay.ytdRevenue += amount
    }
  })

  // Weekly billing (last 4 weeks)
  const weeklyBilling = []
  for (let i = 0; i < 4; i++) {
    const weekStart = subWeeks(now, i + 1)
    const weekEnd = subWeeks(now, i)
    const weekTotal = purchaseOrders
      .filter(po => {
        const d = new Date(po.created_at)
        return d >= weekStart && d < weekEnd
      })
      .reduce((sum, po) => sum + ((po.billed_amount_cents || 0) / 100), 0)

    weeklyBilling.push({
      week: format(weekStart, 'MMM d'),
      amount: weekTotal
    })
  }

  // By Instructor
  const byInstructor: Record<string, { name: string; revenue: number; sessions: number }> = {}
  bookings.forEach(booking => {
    const instructorId = booking.session?.instructor_id
    if (instructorId) {
      if (!byInstructor[instructorId]) {
        byInstructor[instructorId] = { name: 'Instructor', revenue: 0, sessions: 0 }
      }
      byInstructor[instructorId].revenue += (booking.session?.price_cents || 0) / 100
      byInstructor[instructorId].sessions++
    }
  })

  // Aging report
  const aging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0
  }

  purchaseOrders.forEach(po => {
    if (po.billing_status === 'paid') return
    const outstanding = ((po.billed_amount_cents || 0) - (po.paid_amount_cents || 0)) / 100
    if (outstanding <= 0) return

    const dueDate = po.due_date ? new Date(po.due_date) : null
    if (!dueDate) {
      aging.current += outstanding
      return
    }

    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysOverdue <= 0) aging.current += outstanding
    else if (daysOverdue <= 30) aging.days30 += outstanding
    else if (daysOverdue <= 60) aging.days60 += outstanding
    else aging.days90 += outstanding
  })

  // Totals
  const totals = {
    monthlyBilled: Object.values(byFundingSource).reduce((s, fs) => s + fs.monthlyBilled, 0),
    ytdBilled: Object.values(byFundingSource).reduce((s, fs) => s + fs.ytdBilled, 0),
    monthlyPaid: Object.values(byFundingSource).reduce((s, fs) => s + fs.monthlyPaid, 0),
    ytdPaid: Object.values(byFundingSource).reduce((s, fs) => s + fs.ytdPaid, 0),
    totalOutstanding: Object.values(byFundingSource).reduce((s, fs) => s + fs.outstanding, 0),
    totalOverdue: Object.values(byFundingSource).reduce((s, fs) => s + fs.overdueAmount, 0)
  }

  return {
    byFundingSource: Object.values(byFundingSource),
    byCoordinator: Object.values(byCoordinator).filter(c => c.pendingAuth > 0 || c.overduePOs > 0),
    privatePay,
    weeklyBilling: weeklyBilling.reverse(),
    byInstructor: Object.values(byInstructor),
    aging,
    totals
  }
}