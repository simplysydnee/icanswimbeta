'use client'

import { StaffModeProvider } from '@/components/staff-mode/StaffModeContext'
import StaffInstructorSelectFiltered from '@/components/staff-mode/StaffInstructorSelectFiltered'

export default function StaffModePage() {
  return (
    <StaffModeProvider>
      <StaffInstructorSelectFiltered />
    </StaffModeProvider>
  )
}