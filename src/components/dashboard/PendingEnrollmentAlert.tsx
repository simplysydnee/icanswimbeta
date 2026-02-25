'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { usePendingReferrals } from '@/hooks/usePendingReferrals'
import { AlertTriangle, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function PendingEnrollmentAlert() {
  const { pendingReferrals, loading, hasPending } = usePendingReferrals()
  const [dismissed, setDismissed] = useState<string[]>([])

  if (loading) {
    return null // Don't show loading state for this
  }

  if (!hasPending) {
    return null
  }

  // Filter out dismissed alerts
  const visibleReferrals = pendingReferrals.filter(r => !dismissed.includes(r.id))

  if (visibleReferrals.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleReferrals.map((referral) => (
        <Alert
          key={referral.id}
          className="border-[#d97706] bg-[#fffbeb] relative"
        >
          {/* Dismiss button */}
          <button
            onClick={() => setDismissed([...dismissed, referral.id])}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <AlertTriangle className="h-5 w-5 text-[#d97706]" />

          <AlertTitle className="text-[#d97706] font-semibold">
            Action Required: Complete Enrollment for {referral.child_name}
          </AlertTitle>

          <AlertDescription className="mt-2">
            <p className="text-gray-700 mb-3">
              {referral.coordinator_name} has submitted a funding source referral for {referral.child_name}.
              Please complete the enrollment form to proceed with swim lessons.
            </p>

            <Link href={`/enroll/referral/${referral.parent_token}`}>
              <Button
                size="sm"
                className="bg-[#2a5e84] hover:bg-[#1e4a6d] text-white"
              >
                Complete Enrollment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      ))}

      {/* Summary if multiple */}
      {visibleReferrals.length > 1 && (
        <p className="text-sm text-gray-500 text-center">
          You have {visibleReferrals.length} pending enrollments to complete
        </p>
      )}
    </div>
  )
}