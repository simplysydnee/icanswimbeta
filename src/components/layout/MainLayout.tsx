'use client';

import { useEffect, ReactNode } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { NavigationConfig } from '@/types/navigation';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  config: NavigationConfig;
  pathname: string;
  className?: string;
}

export function MainLayout({ 
  children, 
  config, 
  pathname, 
  className 
}: MainLayoutProps) {
  const { registerPage, sidebarOpen, setSidebarOpen } = useNavigation();

  useEffect(() => {
    registerPage(pathname, config);
  }, [pathname, config, registerPage]);

  const showSidebar = config.sidebar?.enabled ?? false;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {showSidebar && (
        <>
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Sidebar />
        </>
      )}
      
      <div className={cn('flex-1 flex flex-col', className)} 
           style={{ marginLeft: showSidebar ? (sidebarOpen ? '24px' : '16px') : '24px' }}>
        <div className="sticky top-16 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3" 
             style={{ paddingLeft: '24px', paddingRight: '48px' }}>
          <div className="border-b pb-3">
            <Breadcrumbs />
          </div>
        </div>
        
        <main className="flex-1 py-6" 
              style={{ paddingLeft: '24px', paddingRight: '48px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}