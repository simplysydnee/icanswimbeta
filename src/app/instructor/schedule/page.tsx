'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { ScheduleView } from '@/components/schedule/ScheduleView'
import { useAuth } from '@/contexts/AuthContext'

export default function InstructorSchedulePage() {
  const { user } = useAuth()

  return (
    <RoleGuard allowedRoles={['instructor']}>
      <ScheduleView role="instructor" userId={user?.id} />
    </RoleGuard>
  )
}