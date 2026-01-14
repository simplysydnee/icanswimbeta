'use client'

import { useParams } from 'next/navigation'
import { StaffModeProvider } from '@/components/staff-mode/StaffModeContext'
import { StaffSwimmerDetail } from '@/components/staff-mode'

export default function StaffModeSwimmerPage() {
  const params = useParams()
  const swimmerId = params.swimmerId as string

  if (!swimmerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Swimmer not found</h1>
          <p className="text-gray-600 mt-2">Please check the URL and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <StaffModeProvider>
      <StaffSwimmerDetail swimmerId={swimmerId} />
    </StaffModeProvider>
  )
}