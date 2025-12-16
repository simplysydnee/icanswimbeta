import { RoleGuard } from '@/components/auth/RoleGuard'
import { ScheduleView } from '@/components/schedule/ScheduleView'

export default function AdminSchedulePage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <ScheduleView role="admin" />
    </RoleGuard>
  )
}