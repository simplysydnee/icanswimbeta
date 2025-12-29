'use client';

import { InstructorNavbar } from '@/components/layout/InstructorNavbar';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['instructor', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}