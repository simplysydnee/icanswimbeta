'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { DraftSessionsManager } from '@/components/admin/draft-sessions';

export default function DraftSessionsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Draft Sessions</h1>
          <p className="text-muted-foreground">
            Review and open sessions for booking
          </p>
        </div>
        <DraftSessionsManager />
      </div>
    </RoleGuard>
  );
}