'use client'

import { StaffModeProvider } from '@/components/staff-mode/StaffModeContext'
import { StaffScheduleView } from '@/components/staff-mode'

export default function StaffModeSchedulePage() {
  return (
    <StaffModeProvider>
      <StaffScheduleView />
    </StaffModeProvider>
  )
}