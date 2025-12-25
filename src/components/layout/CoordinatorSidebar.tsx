'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  FileText,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ClipboardList,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/coordinator', icon: LayoutDashboard },
  { label: 'My Clients', href: '/coordinator/clients', icon: Users },
  { label: 'Submit Referral', href: '/coordinator/referrals/new', icon: PlusCircle },
  { label: 'Purchase Orders', href: '/coordinator/pos', icon: FileText },
  { label: 'Progress Reports', href: '/coordinator/progress', icon: ClipboardList },
];

export function CoordinatorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div
      className={cn(
        'h-screen bg-white border-r flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        {!collapsed && (
          <Link href="/coordinator" className="flex items-center gap-2">
            <span className="text-xl font-bold text-cyan-600">I Can Swim</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/coordinator' && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href} className="group">
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-cyan-600 text-white font-medium shadow-sm'
                    : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-800 hover:shadow-sm'
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-gray-500 group-hover:text-cyan-600"
                )} />
                {!collapsed && (
                  <span className={cn(
                    "transition-colors",
                    isActive ? "text-white" : "text-gray-700 group-hover:text-cyan-800"
                  )}>
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50',
            collapsed && 'justify-center'
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}