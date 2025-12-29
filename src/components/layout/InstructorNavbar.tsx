'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Calendar, Users, ClipboardList, Clock, CalendarOff, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/instructor', label: 'Dashboard', icon: Home },
  { href: '/instructor/schedule', label: 'My Schedule', icon: Calendar },
  { href: '/instructor/swimmers', label: 'Swimmers', icon: Users },
  { href: '/instructor/progress', label: 'Progress Notes', icon: ClipboardList },
  { href: '/instructor/timecard', label: 'Timecard', icon: Clock },
  { href: '/instructor/time-off', label: 'Time Off', icon: CalendarOff },
];

export function InstructorNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/instructor" className="flex items-center">
          <Image
            src="/images/logo.jpg"
            alt="I Can Swim"
            width={150}
            height={50}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/instructor' && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('gap-2', isActive && 'bg-blue-50 text-blue-700')}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-gray-500 hover:text-red-600">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </nav>

        {/* Mobile/Tablet Navigation */}
        <nav className="flex lg:hidden items-center gap-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/instructor' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button variant={isActive ? 'secondary' : 'ghost'} size="icon" className={cn(isActive && 'bg-blue-50 text-blue-700')}>
                  <Icon className="h-5 w-5" />
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}