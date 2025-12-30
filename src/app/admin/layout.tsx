'use client';

import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Sidebar } from '@/components/layout/sidebar';
import { ErrorBoundary } from '@/components/error-boundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r bg-background">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="md:pl-64">
        {/* Responsive header - always visible */}
        <ResponsiveHeader />

        {/* Page content with responsive padding */}
        <main className="p-4 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}