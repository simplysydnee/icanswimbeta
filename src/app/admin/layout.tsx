'use client';

import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main
        className="min-h-screen transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 4rem)' }}
      >
        {children}
      </main>
    </div>
  );
}