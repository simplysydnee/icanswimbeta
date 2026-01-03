'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface ParentReferralRequest {
  id: string
  child_name: string
  coordinator_name: string
  coordinator_email: string
  status: 'pending' | 'submitted' | 'in_review' | 'completed' | 'rejected'
  created_at: string
  updated_at: string
}

export function useParentReferralRequests() {
  const { user } = useAuth()
  const supabase = createClient()

  return useQuery({
    queryKey: ['parent-referral-requests', user?.email],
    queryFn: async () => {
      if (!user?.email) return []

      try {
        const { data, error } = await supabase
          .from('parent_referral_requests')
          .select('*')
          .eq('parent_email', user.email)
          .in('status', ['pending', 'submitted', 'in_review'])
          .order('created_at', { ascending: false })

        // If table doesn't exist yet, return empty array
        if (error && error.message?.includes('relation "public.parent_referral_requests" does not exist')) {
          console.log('parent_referral_requests table does not exist yet, returning empty array')
          return []
        }

        if (error) throw error

        return (data || []) as ParentReferralRequest[]
      } catch (error) {
        console.error('Error fetching parent referral requests:', error)
        return []
      }
    },
    enabled: !!user?.email,
  })
}