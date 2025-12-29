'use client';

import { CoordinatorNavbar } from '@/components/layout/CoordinatorNavbar';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['coordinator', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <CoordinatorNavbar />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}