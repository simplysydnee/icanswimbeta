'use client';

import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="pl-56 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}