'use client';

import { AttendancePriorityCard } from '@/components/admin/AttendancePriorityCard'

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage system settings and automated features</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendancePriorityCard />

        {/* Additional settings cards can be added here */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          <p className="text-muted-foreground">More settings coming soon...</p>
        </div>
      </div>
    </div>
  );
}