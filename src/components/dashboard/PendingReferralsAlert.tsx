'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { usePendingReferralsAdmin } from '@/hooks/usePendingReferralsAdmin'
import { FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function PendingReferralsAlert() {
  const { stats, loading } = usePendingReferralsAdmin()

  if (loading) {
    return null
  }

  // Only show if there are referrals ready for review (pending approval)
  if (stats.readyForReview === 0) {
    return null
  }

  return (
    <div className="space-y-3 mb-6">
      <Alert className="border-[#2a5e84] bg-[#2a5e84]/5">
        <FileText className="h-5 w-5 text-[#2a5e84]" />
        <AlertTitle className="text-[#2a5e84] font-semibold">
          {stats.readyForReview} Referral{stats.readyForReview !== 1 ? 's' : ''} Ready for Review
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-gray-600 mb-3">
            {stats.readyForReview === 1
              ? 'A referral is ready for your approval.'
              : `${stats.readyForReview} referrals are waiting for your approval.`}
          </p>
          <Link href="/admin/referrals?filter=ready_for_review">
            <Button
              size="sm"
              className="bg-[#2a5e84] hover:bg-[#1e4a6d] text-white"
            >
              Review Referrals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  )
}