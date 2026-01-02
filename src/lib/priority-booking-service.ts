import { createClient } from '@/lib/supabase/client'
import type {
  SwimmerInstructorAssignment,
  SetPriorityBookingParams,
  AssignInstructorParams
} from '@/types/priority-booking'

const supabase = createClient()

export const priorityBookingService = {
  /**
   * Get assigned instructors for a swimmer
   */
  async getAssignedInstructors(swimmerId: string): Promise<SwimmerInstructorAssignment[]> {
    const { data, error } = await supabase
      .from('swimmer_instructor_assignments')
      .select(`
        *,
        instructor:profiles!instructor_id(id, full_name, email, avatar_url)
      `)
      .eq('swimmer_id', swimmerId)
      .order('is_primary', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get all swimmers assigned to an instructor
   */
  async getInstructorSwimmers(instructorId: string): Promise<SwimmerInstructorAssignment[]> {
    const { data, error } = await supabase
      .from('swimmer_instructor_assignments')
      .select(`
        *,
        swimmer:swimmers!swimmer_id(id, first_name, last_name)
      `)
      .eq('instructor_id', instructorId)

    if (error) throw error
    return data || []
  },

  /**
   * Set priority booking status for a swimmer
   */
  async setPriorityBooking(params: SetPriorityBookingParams): Promise<void> {
    const { swimmerId, isPriority, reason, notes, expiresAt, instructorIds } = params

    // Update swimmer priority status
    const { error: swimmerError } = await supabase
      .from('swimmers')
      .update({
        is_priority_booking: isPriority,
        priority_booking_reason: isPriority ? reason : null,
        priority_booking_notes: isPriority ? notes : null,
        priority_booking_set_at: isPriority ? new Date().toISOString() : null,
        priority_booking_set_by: isPriority ? (await supabase.auth.getUser()).data.user?.id : null,
        priority_booking_expires_at: expiresAt || null
      })
      .eq('id', swimmerId)

    if (swimmerError) throw swimmerError

    // If turning off priority, optionally remove all instructor assignments
    if (!isPriority) {
      // Keep assignments but priority is off - they can still book with anyone
      return
    }

    // If instructorIds provided, sync assignments
    if (instructorIds && instructorIds.length > 0) {
      // Remove existing assignments
      await supabase
        .from('swimmer_instructor_assignments')
        .delete()
        .eq('swimmer_id', swimmerId)

      // Add new assignments
      const userId = (await supabase.auth.getUser()).data.user?.id
      const assignments = instructorIds.map((instructorId, index) => ({
        swimmer_id: swimmerId,
        instructor_id: instructorId,
        assigned_by: userId,
        is_primary: index === 0, // First one is primary
        assigned_at: new Date().toISOString()
      }))

      const { error: assignError } = await supabase
        .from('swimmer_instructor_assignments')
        .insert(assignments)

      if (assignError) throw assignError
    }
  },

  /**
   * Assign a single instructor to a swimmer
   */
  async assignInstructor(params: AssignInstructorParams): Promise<SwimmerInstructorAssignment> {
    const { swimmerId, instructorId, isPrimary, notes } = params
    const userId = (await supabase.auth.getUser()).data.user?.id

    const { data, error } = await supabase
      .from('swimmer_instructor_assignments')
      .upsert({
        swimmer_id: swimmerId,
        instructor_id: instructorId,
        assigned_by: userId,
        is_primary: isPrimary || false,
        notes: notes || null,
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'swimmer_id,instructor_id'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Remove an instructor assignment
   */
  async removeAssignment(swimmerId: string, instructorId: string): Promise<void> {
    const { error } = await supabase
      .from('swimmer_instructor_assignments')
      .delete()
      .eq('swimmer_id', swimmerId)
      .eq('instructor_id', instructorId)

    if (error) throw error
  },

  /**
   * Get available instructors for booking (respects priority assignments)
   * Returns all instructors if swimmer has no priority, or only assigned instructors if priority
   */
  async getAvailableInstructorsForSwimmer(swimmerId: string): Promise<{
    instructors: Array<{ id: string; full_name: string; email: string; avatar_url: string | null }>;
    isPriority: boolean;
    reason: string | null;
  }> {
    // First check if swimmer has priority booking
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .select('is_priority_booking, priority_booking_reason, priority_booking_expires_at')
      .eq('id', swimmerId)
      .single()

    if (swimmerError) throw swimmerError

    // Check if priority has expired
    const isPriorityActive = swimmer.is_priority_booking &&
      (!swimmer.priority_booking_expires_at || new Date(swimmer.priority_booking_expires_at) > new Date())

    if (isPriorityActive) {
      // Return only assigned instructors
      const assignments = await this.getAssignedInstructors(swimmerId)
      return {
        instructors: assignments.map(a => a.instructor!).filter(Boolean),
        isPriority: true,
        reason: swimmer.priority_booking_reason
      }
    }

    // Not priority - return all active instructors with instructor role
    // First get user IDs with instructor role
    const { data: instructorRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'instructor')

    if (rolesError) throw rolesError

    const instructorIds = instructorRoles?.map(role => role.user_id) || []

    // Then get profiles for those IDs
    const { data: instructors, error: instructorError } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('display_on_team', true)
      .eq('is_active', true)
      .in('id', instructorIds)

    if (instructorError) throw instructorError

    return {
      instructors: instructors || [],
      isPriority: false,
      reason: null
    }
  },

  /**
   * Get all priority swimmers (for admin view)
   */
  async getPrioritySwimmers(): Promise<any[]> {
    const { data, error } = await supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        is_priority_booking,
        priority_booking_reason,
        priority_booking_notes,
        priority_booking_set_at,
        priority_booking_expires_at,
        parent:profiles!parent_id(full_name, email)
      `)
      .eq('is_priority_booking', true)
      .order('priority_booking_set_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}