'use client'

import { usePendingReferralsAdmin } from '@/hooks/usePendingReferralsAdmin'
import { Badge } from '@/components/ui/badge'

export function PendingReferralsBadge() {
  const { stats, loading } = usePendingReferralsAdmin()

  if (loading || stats.readyForReview === 0) {
    return null
  }

  return (
    <Badge
      variant="destructive"
      className="ml-2 bg-red-500 text-white text-xs animate-pulse"
    >
      {stats.readyForReview}
    </Badge>
  )
}