'use client'

import { usePendingReferrals } from '@/hooks/usePendingReferrals'
import { Badge } from '@/components/ui/badge'

export function PendingEnrollmentBadge() {
  const { pendingReferrals, loading } = usePendingReferrals()

  if (loading || pendingReferrals.length === 0) {
    return null
  }

  return (
    <Badge
      variant="destructive"
      className="ml-2 bg-red-500 text-white text-xs"
    >
      {pendingReferrals.length}
    </Badge>
  )
}