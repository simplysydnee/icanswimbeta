'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'

export default function StaffModeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['instructor', 'admin']}>
      <div className="min-h-screen bg-background">
        {/* Staff mode doesn't use the sidebar, it has its own navigation */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </RoleGuard>
  )
}