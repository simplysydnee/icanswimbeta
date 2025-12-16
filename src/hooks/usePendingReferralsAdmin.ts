'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PendingReferralStats {
  readyForReview: number      // Parent completed, awaiting admin approval
  awaitingParent: number      // Coordinator submitted, waiting for parent
  total: number
}


export function usePendingReferralsAdmin() {
  const [stats, setStats] = useState<PendingReferralStats>({
    readyForReview: 0,
    awaitingParent: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('[PendingReferralsAdmin] Attempting to fetch from referral_requests table...')

        const { data, error } = await supabase
          .from('referral_requests')
          .select('id, status, parent_completed_at')
          .in('status', ['pending_parent', 'pending'])

        console.log('[PendingReferralsAdmin] referral_requests query result:', {
          error: error,
          dataCount: data?.length || 0
        })

        // If we get a "relation does not exist" error, the table might not exist yet
        // or might have a different name. In that case, return empty stats.
        if (error) {
          if (error.message?.includes('relation "public.referral_requests" does not exist')) {
            console.log('referral_requests table does not exist yet, returning empty stats')
            setStats({
              readyForReview: 0,
              awaitingParent: 0,
              total: 0,
            })
            setLoading(false)
            return
          }
          throw error
        }

        const referrals = data || []

        // Count referrals ready for admin review
        // Should include both:
        // 1. status === 'pending' (coordinator submitted, waiting for admin) - shows as "Pending Review" blue badge
        // 2. status === 'pending_parent' AND parent_completed_at (parent completed, waiting for admin) - shows as "Ready for Review" blue badge
        const readyForReview = referrals.filter((r: any) => {
          // Status is 'pending' (coordinator submitted, waiting for admin)
          if (r.status === 'pending') {
            return true
          }
          // Status is 'pending_parent' AND parent has completed enrollment
          if (r.status === 'pending_parent' && r.parent_completed_at) {
            // Additional check: make sure it's a valid timestamp string
            if (typeof r.parent_completed_at === 'string' && r.parent_completed_at.trim() !== '') {
              return true
            }
            // If it's not a string or is empty string, don't count it
            return false
          }
          return false
        }).length

        // Count referrals waiting for parent to complete enrollment
        const awaitingParent = referrals.filter((r: any) => {
          if (r.status !== 'pending_parent') return false
          // Check if parent_completed_at is null, undefined, or empty string
          if (!r.parent_completed_at) return true
          if (typeof r.parent_completed_at === 'string' && r.parent_completed_at.trim() === '') {
            return true
          }
          return false
        }).length

        // Debug: log summary to console
        console.log('[PendingReferralsAdmin] Summary:', {
          totalReferrals: referrals.length,
          readyForReview,
          awaitingParent,
          breakdown: {
            pending: referrals.filter((r: any) => r.status === 'pending').length,
            pending_parent_with_completion: referrals.filter((r: any) => r.status === 'pending_parent' && r.parent_completed_at).length,
            pending_parent_without_completion: referrals.filter((r: any) => r.status === 'pending_parent' && !r.parent_completed_at).length
          }
        })

        setStats({
          readyForReview,
          awaitingParent,
          total: referrals.length,
        })
      } catch (err) {
        console.error('Error fetching referral stats:', err)
        // Log more details about the error
        if (err instanceof Error) {
          console.error('Error details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          })
        } else {
          console.error('Non-Error object caught:', typeof err, err)
        }
        // Set empty stats on error
        setStats({
          readyForReview: 0,
          awaitingParent: 0,
          total: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  return { stats, loading }
}