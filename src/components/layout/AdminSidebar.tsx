'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  FileText,
  ClipboardList,
  Settings,
  ChevronLeft,
  LayoutDashboard,
  CalendarPlus,
  UserCog,
  Building2,
  CreditCard,
  CheckCircle,
  Menu,
  CheckSquare,
  BarChart3
} from 'lucide-react';

const navItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Swimmers', href: '/admin/swimmers', icon: Users },
  { title: 'Schedule', href: '/admin/schedule', icon: Calendar },
  { title: 'Session Generator', href: '/admin/sessions/generate', icon: CalendarPlus },
  { title: 'Complete Assessment', href: '/admin/assessments/complete', icon: CheckCircle },
  { title: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
  { title: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
  { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { title: 'Team', href: '/admin/team', icon: Users },
  { title: 'Referrals', href: '/admin/referrals', icon: FileText },
  { title: 'Purchase Orders', href: '/admin/pos', icon: CreditCard },
  { title: 'Users', href: '/admin/users', icon: UserCog },
  { title: 'Funding Sources', href: '/admin/funding-sources', icon: Building2 },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  // Collapsed by default
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  // Update CSS variable for main content margin
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '4rem' : '14rem'
    );
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 px-3 border-b",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="h-10 w-10"
            aria-label="Expand sidebar"
          >
            <Menu className="h-5 w-5 text-cyan-600" />
          </Button>
        ) : (
          <>
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">ICS</span>
              </div>
              <span className="font-semibold text-cyan-700">I Can Swim</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="h-8 w-8"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href} className="group">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-cyan-600 text-white font-medium shadow-sm"
                    : "text-gray-700 hover:bg-cyan-50 hover:text-cyan-800 hover:shadow-sm",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-gray-500 group-hover:text-cyan-600"
                )} />
                {!collapsed && (
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-white" : "text-gray-700 group-hover:text-cyan-800"
                  )}>
                    {item.title}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}