'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Users, FileText, ClipboardCheck, UserPlus, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/coordinator', label: 'Dashboard', icon: Home },
  { href: '/coordinator/clients', label: 'My Clients', icon: Users },
  { href: '/coordinator/purchase-orders', label: 'Purchase Orders', icon: FileText },
  { href: '/coordinator/approvals', label: 'Approvals', icon: ClipboardCheck },
  { href: '/coordinator/referrals', label: 'Referrals', icon: UserPlus },
];

export function CoordinatorNavbar() {
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
        <Link href="/coordinator" className="flex items-center">
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
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/coordinator' && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('gap-2', isActive && 'bg-purple-50 text-purple-700')}
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

        {/* Mobile Navigation */}
        <nav className="flex md:hidden items-center gap-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/coordinator' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button variant={isActive ? 'secondary' : 'ghost'} size="icon" className={cn(isActive && 'bg-purple-50 text-purple-700')}>
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