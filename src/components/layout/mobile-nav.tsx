'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Home, Users, Calendar, Settings, ClipboardList, LogOut, FileText, CheckCircle, CreditCard, Building2, UserCog, BarChart3, CheckSquare, CalendarPlus, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: string[]
}

// Navigation items for different roles
const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Swimmers', href: '/admin/swimmers', icon: <Users className="h-5 w-5" /> },
  { label: 'Schedule', href: '/admin/schedule', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Session Generator', href: '/admin/sessions/generate', icon: <CalendarPlus className="h-5 w-5" /> },
  { label: 'Complete Assessment', href: '/admin/assessments/complete', icon: <CheckCircle className="h-5 w-5" /> },
  { label: 'Bookings', href: '/admin/bookings', icon: <ClipboardList className="h-5 w-5" /> },
  { label: 'Tasks', href: '/admin/tasks', icon: <CheckSquare className="h-5 w-5" /> },
  { label: 'Reports', href: '/admin/reports', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Team', href: '/admin/team', icon: <Users className="h-5 w-5" /> },
  { label: 'Referrals', href: '/admin/referrals', icon: <FileText className="h-5 w-5" /> },
  { label: 'Purchase Orders', href: '/admin/pos', icon: <CreditCard className="h-5 w-5" /> },
  { label: 'Users', href: '/admin/users', icon: <UserCog className="h-5 w-5" /> },
  { label: 'Funding Sources', href: '/admin/funding-sources', icon: <Building2 className="h-5 w-5" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
]

const parentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Book', href: '/parent/book', icon: <Calendar className="h-5 w-5" /> },
  { label: 'My Swimmers', href: '/parent/swimmers', icon: <Users className="h-5 w-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
]

const instructorNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/instructor', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Schedule', href: '/instructor/schedule', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
]

const coordinatorNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/coordinator', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Schedule', href: '/coordinator/schedule', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, role, signOut } = useAuth()

  // Get navigation items based on role
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return adminNavItems
      case 'parent':
        return parentNavItems
      case 'instructor':
        return instructorNavItems
      case 'coordinator':
        return coordinatorNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <img src="/images/logo.jpg" alt="I Can Swim" className="h-8 w-8 rounded" />
            <span>I Can Swim</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-base transition-colors",
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          <hr className="my-4" />
          <button
            onClick={() => { signOut(); setOpen(false); }}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  )
}