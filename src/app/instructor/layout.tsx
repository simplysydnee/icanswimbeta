'use client';

import { InstructorSidebar } from '@/components/layout/InstructorSidebar';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['instructor', 'admin']}>
      <div className="flex h-screen bg-gray-50">
        <InstructorSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}