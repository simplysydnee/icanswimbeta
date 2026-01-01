'use client';

import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Sidebar } from '@/components/layout/sidebar';
import { ErrorBoundary } from '@/components/error-boundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      {/* Use grid layout for proper sidebar + content coordination */}
      <div className="hidden md:grid md:grid-cols-[auto_1fr] min-h-screen">
        {/* Sidebar - width controlled by its internal state */}
        <aside className="h-full border-r bg-background">
          <Sidebar />
        </aside>

        {/* Main content area */}
        <div className="flex flex-col">
          {/* Responsive header - always visible */}
          <ResponsiveHeader />

          {/* Page content with responsive padding */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-full overflow-x-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden">
        {/* Responsive header - always visible */}
        <ResponsiveHeader />

        {/* Page content with responsive padding */}
        <main className="p-4 md:p-6 lg:p-8 max-w-full overflow-x-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}