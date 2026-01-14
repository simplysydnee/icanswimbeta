'use client'

import { StaffModeProvider } from '@/components/staff-mode/StaffModeContext'
import { StaffInstructorSelect } from '@/components/staff-mode'

export default function StaffModePage() {
  return (
    <StaffModeProvider>
      <StaffInstructorSelect />
    </StaffModeProvider>
  )
}