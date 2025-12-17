'use client';

import { useState } from 'react';
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
  ChevronRight,
  LayoutDashboard,
  CalendarPlus,
  UserCog,
  Building2,
  CreditCard,
  CheckCircle
} from 'lucide-react';

const navItems = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Swimmers', href: '/admin/swimmers', icon: Users },
  { title: 'Schedule', href: '/admin/schedule', icon: Calendar },
  { title: 'Session Generator', href: '/admin/sessions/generate', icon: CalendarPlus },
  { title: 'Complete Assessment', href: '/admin/assessments/complete', icon: CheckCircle },
  { title: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
  { title: 'Referrals', href: '/admin/referrals', icon: FileText },
  { title: 'Purchase Orders', href: '/admin/pos', icon: CreditCard },
  { title: 'Users', href: '/admin/users', icon: UserCog },
  { title: 'Funding Sources', href: '/admin/funding-sources', icon: Building2 },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b",
        collapsed ? "justify-center" : ""
      )}>
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">ICS</span>
          </div>
          {!collapsed && <span className="font-semibold text-cyan-700">I Can Swim</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-cyan-50 text-cyan-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-cyan-600")} />
                {!collapsed && <span className="text-sm">{item.title}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="absolute bottom-4 left-0 right-0 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("w-full flex items-center gap-2", collapsed && "justify-center")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}