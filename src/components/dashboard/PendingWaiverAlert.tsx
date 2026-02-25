'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useIncompleteWaiverSwimmers } from '@/hooks/useIncompleteWaiverSwimmers'
import { AlertTriangle, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function PendingWaiverAlert() {
  const { incompleteSwimmers, loading, hasIncomplete } = useIncompleteWaiverSwimmers()
  const [dismissed, setDismissed] = useState<string[]>([])

  if (loading) {
    return null // Don't show loading state
  }

  if (!hasIncomplete) {
    return null
  }

  // Filter out dismissed alerts
  const visibleSwimmers = incompleteSwimmers.filter(s => !dismissed.includes(s.id))

  if (visibleSwimmers.length === 0) {
    return null
  }

  // Get waiver token for parent via API endpoint
  const handleCompleteWaivers = () => {
    window.location.href = '/api/waivers/get-or-create-token'
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleSwimmers.map((swimmer) => (
        <Alert
          key={swimmer.id}
          className="border-[#d97706] bg-[#fffbeb] relative"
        >
          {/* Dismiss button */}
          <button
            onClick={() => setDismissed([...dismissed, swimmer.id])}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <AlertTriangle className="h-5 w-5 text-[#d97706]" />

          <AlertTitle className="text-[#d97706] font-semibold">
            Action Required: Complete Waivers for {swimmer.first_name} {swimmer.last_name}
          </AlertTitle>

          <AlertDescription className="mt-2">
            <p className="text-gray-700 mb-3">
              {swimmer.first_name} needs waiver forms completed before they can participate in swim lessons.
              This includes liability waiver, cancellation policy, photo release, and emergency contact information.
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
              <Link href="/parent/account" className="text-sm text-[#2a5e84] hover:underline self-center">
                Learn more about waiver requirements
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      ))}

      {/* Summary if multiple */}
      {visibleSwimmers.length > 1 && (
        <p className="text-sm text-gray-500 text-center">
          You have {visibleSwimmers.length} swimmers with incomplete waivers
        </p>
      )}
    </div>
  )
}