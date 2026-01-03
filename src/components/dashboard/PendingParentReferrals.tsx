'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useParentReferralRequests } from '@/hooks/useParentReferralRequests'
import { Clock, User, Mail } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export function PendingParentReferrals() {
  const { data: referrals, isLoading } = useParentReferralRequests()

  if (isLoading) {
    return null // Don't show loading state
  }

  if (!referrals || referrals.length === 0) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Awaiting Coordinator</Badge>
      case 'submitted':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Submitted</Badge>
      case 'in_review':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Under Review</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <Clock className="h-5 w-5" />
          Pending Referral Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {referrals.map((referral) => (
            <div key={referral.id} className="pb-4 border-b border-amber-200 last:border-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-amber-800">
                      {referral.child_name}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-amber-700">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{referral.coordinator_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{referral.coordinator_email}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600">
                    Submitted {formatDistanceToNow(new Date(referral.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  {getStatusBadge(referral.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-700 border-amber-300 hover:bg-amber-100"
                    asChild
                  >
                    <Link href={`/parent/referrals/${referral.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-amber-600 mt-4">
          Your coordinator will complete the referral. We'll notify you when it's ready.
        </p>
      </CardContent>
    </Card>
  )
}