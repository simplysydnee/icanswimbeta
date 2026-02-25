'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface SwimmerWithWaiverStatus {
  id: string
  first_name: string
  last_name: string
  enrollment_status: string
  signed_waiver: boolean
  liability_waiver_signature: string | null
  photo_video_permission: boolean
  photo_video_signature: string | null
  cancellation_policy_signature: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
}

export function useIncompleteWaiverSwimmers() {
  const { user } = useAuth()
  const [swimmers, setSwimmers] = useState<SwimmerWithWaiverStatus[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchSwimmers = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('swimmers')
          .select(`
            id,
            first_name,
            last_name,
            enrollment_status,
            signed_waiver,
            liability_waiver_signature,
            photo_video_permission,
            photo_video_signature,
            cancellation_policy_signature,
            emergency_contact_name,
            emergency_contact_phone,
            emergency_contact_relationship
          `)
          .eq('parent_id', user.id)
          .in('enrollment_status', ['enrolled', 'pending_enrollment'])
          .order('first_name', { ascending: true })

        if (error) {
          console.error('Error fetching swimmers for waiver check:', error)
          setSwimmers([])
        } else {
          setSwimmers(data || [])
        }
      } catch (err) {
        console.error('Error in useIncompleteWaiverSwimmers:', err)
        setSwimmers([])
      } finally {
        setLoading(false)
      }
    }

    fetchSwimmers()
  }, [user?.id, supabase])

  // Determine which swimmers have incomplete waivers
  const incompleteSwimmers = swimmers.filter(swimmer => {
    // Check if all required waiver fields are complete
    const hasLiability = !!(swimmer.signed_waiver && swimmer.liability_waiver_signature)
    const hasPhotoRelease = !!(swimmer.photo_video_permission && swimmer.photo_video_signature)
    const hasCancellationPolicy = !!swimmer.cancellation_policy_signature
    const hasEmergencyContact = !!(swimmer.emergency_contact_name && swimmer.emergency_contact_phone)

    return !hasLiability || !hasPhotoRelease || !hasCancellationPolicy || !hasEmergencyContact
  })

  return { swimmers, incompleteSwimmers, loading, hasIncomplete: incompleteSwimmers.length > 0 }
}