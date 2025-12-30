import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import type { PriorityBookingReason } from '@/types/priority-booking'

interface AttendanceStats {
  swimmerId: string
  swimmerName: string
  totalBooked: number
  attended: number
  cancelled: number
  noShow: number
  isPerfect: boolean
}

export const attendancePriorityService = {
  /**
   * Calculate attendance stats for a swimmer for a given month
   */
  async getSwimmerAttendanceStats(
    swimmerId: string,
    month: Date = subMonths(new Date(), 1)
  ): Promise<AttendanceStats | null> {
    const supabase = createClient()
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)

    // Get swimmer info
    const { data: swimmer } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name')
      .eq('id', swimmerId)
      .single()

    if (!swimmer) return null

    // Get all bookings for the month
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        session:sessions(start_time)
      `)
      .eq('swimmer_id', swimmerId)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString())

    if (error) throw error

    const stats: AttendanceStats = {
      swimmerId: swimmer.id,
      swimmerName: `${swimmer.first_name} ${swimmer.last_name}`,
      totalBooked: bookings?.length || 0,
      attended: bookings?.filter(b => b.status === 'completed').length || 0,
      cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
      noShow: bookings?.filter(b => b.status === 'no_show').length || 0,
      isPerfect: false
    }

    // Perfect = has bookings AND all were attended (completed)
    stats.isPerfect = stats.totalBooked > 0 &&
                      stats.attended === stats.totalBooked &&
                      stats.cancelled === 0 &&
                      stats.noShow === 0

    return stats
  },

  /**
   * Get all swimmers with perfect attendance for a month
   */
  async getSwimmersWithPerfectAttendance(
    month: Date = subMonths(new Date(), 1)
  ): Promise<AttendanceStats[]> {
    const supabase = createClient()
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)

    // Get all enrolled swimmers
    const { data: swimmers, error: swimmerError } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name')
      .eq('enrollment_status', 'enrolled')

    if (swimmerError) throw swimmerError

    // Get attendance stats for each
    const statsPromises = swimmers?.map(s => this.getSwimmerAttendanceStats(s.id, month)) || []
    const allStats = await Promise.all(statsPromises)

    // Filter to only perfect attendance
    return allStats.filter((s): s is AttendanceStats => s !== null && s.isPerfect)
  },

  /**
   * Grant auto-priority to swimmers with perfect attendance
   * Called monthly (manually or via cron)
   */
  async grantAttendancePriority(month: Date = subMonths(new Date(), 1)): Promise<{
    granted: string[]
    skipped: string[]
    errors: string[]
  }> {
    const supabase = createClient()
    const result = {
      granted: [] as string[],
      skipped: [] as string[],
      errors: [] as string[]
    }

    try {
      // Get swimmers with perfect attendance
      const perfectSwimmers = await this.getSwimmersWithPerfectAttendance(month)

      for (const swimmer of perfectSwimmers) {
        try {
          // Check if swimmer already has manual priority
          const { data: existing } = await supabase
            .from('swimmers')
            .select('is_priority_booking, priority_booking_reason')
            .eq('id', swimmer.swimmerId)
            .single()

          // Skip if already has manual priority (don't override)
          if (existing?.is_priority_booking && existing.priority_booking_reason !== 'attendance') {
            result.skipped.push(swimmer.swimmerName)
            continue
          }

          // Grant attendance priority (expires in 1 month)
          const expiresAt = endOfMonth(new Date())

          await supabase
            .from('swimmers')
            .update({
              is_priority_booking: true,
              priority_booking_reason: 'attendance' as PriorityBookingReason,
              priority_booking_notes: `Perfect attendance for ${month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
              priority_booking_set_at: new Date().toISOString(),
              priority_booking_expires_at: expiresAt.toISOString()
            })
            .eq('id', swimmer.swimmerId)

          result.granted.push(swimmer.swimmerName)

        } catch (err) {
          console.error(`Error granting priority to ${swimmer.swimmerName}:`, err)
          result.errors.push(swimmer.swimmerName)
        }
      }

      return result

    } catch (error) {
      console.error('Error in grantAttendancePriority:', error)
      throw error
    }
  },

  /**
   * Clear expired attendance priorities
   */
  async clearExpiredPriorities(): Promise<number> {
    const supabase = createClient()

    const { data, error } = await supabase
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
      .select('id')

    if (error) throw error
    return data?.length || 0
  }
}