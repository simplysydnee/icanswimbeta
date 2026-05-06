'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useIncompleteWaiverSwimmers } from '@/hooks/useIncompleteWaiverSwimmers'
import { AlertTriangle, ArrowRight, X } from 'lucide-react'
import { useState } from 'react'

export function PendingWaiverAlert() {
  const { incompleteSwimmers, loading, hasIncomplete } = useIncompleteWaiverSwimmers()
  const [dismissed, setDismissed] = useState(false)

  if (loading || !hasIncomplete || dismissed) {
    return null
  }

  const count = incompleteSwimmers.length
  const firstSwimmer = incompleteSwimmers[0]

  // Get waiver token for parent via API endpoint
  const handleCompleteWaivers = () => {
    window.location.href = '/api/waivers/get-or-create-token'
  }

  return (
    <Alert className="border-[#d97706] bg-[#fffbeb] relative mb-6">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <AlertTriangle className="h-5 w-5 text-[#d97706]" />

      <AlertTitle className="text-[#d97706] font-semibold pr-6">
        Action Required: {count === 1
          ? `${firstSwimmer.first_name} ${firstSwimmer.last_name} Needs Waivers Completed`
          : `${count} Swimmers Need Waivers Completed`}
      </AlertTitle>

      <AlertDescription className="mt-2">
        <p className="text-gray-700 mb-3">
          {count === 1
            ? `${firstSwimmer.first_name} needs waiver forms completed before they can participate in swim lessons.`
            : `${count} swimmers need waiver forms completed before they can participate in swim lessons.`}
          {' '}This includes liability waiver, cancellation policy, photo release, and emergency contact information.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="bg-[#2a5e84] hover:bg-[#1e4a6d] text-white"
            onClick={handleCompleteWaivers}
          >
            Complete Waivers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
