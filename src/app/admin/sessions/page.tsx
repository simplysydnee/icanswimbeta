'use client';

import { SessionGeneratorForm } from '@/components/admin/session-generator';
import { RoleGuard } from '@/components/auth/RoleGuard';

/**
 * Admin Session Generator Page
 * Only accessible by users with admin role
 */
export default function AdminSessionsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Session Generator - Debug</h1>
        <SessionGeneratorForm />
      </div>
    </RoleGuard>
  );
}