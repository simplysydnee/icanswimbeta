'use client';

import { CoordinatorSidebar } from '@/components/layout/CoordinatorSidebar';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['coordinator', 'admin']}>
      <div className="flex h-screen bg-gray-50">
        <CoordinatorSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}