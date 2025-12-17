'use client';

import { SessionGeneratorForm } from '@/components/admin/session-generator';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function SessionGeneratorPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6">
        <SessionGeneratorForm />
      </div>
    </RoleGuard>
  );
}