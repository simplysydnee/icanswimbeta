'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface PendingReferral {
  id: string
  parent_token: string
  child_name: string
  coordinator_name: string
  created_at: string
}

export function usePendingReferrals() {
  const { user } = useAuth()
  const [pendingReferrals, setPendingReferrals] = useState<PendingReferral[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchPendingReferrals = async () => {
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('referral_requests')
          .select('id, parent_token, child_name, coordinator_name, created_at')
          .eq('parent_email', user.email)
          .eq('status', 'pending_parent')
          .is('parent_completed_at', null)
          .order('created_at', { ascending: false })

        // If table doesn't exist yet, return empty array
        if (error && error.message?.includes('relation "public.referral_requests" does not exist')) {
          console.log('referral_requests table does not exist yet, returning empty referrals')
          setPendingReferrals([])
          setLoading(false)
          return
        }

        if (error) throw error

        setPendingReferrals(data || [])
      } catch (err) {
        console.error('Error fetching pending referrals:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingReferrals()
  }, [user?.email, supabase])

  return { pendingReferrals, loading, hasPending: pendingReferrals.length > 0 }
}