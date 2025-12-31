'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  CheckSquare,
  BarChart3,
  LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  roles?: string[]
}

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Swimmers', href: '/admin/swimmers', icon: <Users className="h-5 w-5" /> },
  { title: 'Schedule', href: '/admin/schedule', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Session Generator', href: '/admin/sessions/generate', icon: <CalendarPlus className="h-5 w-5" /> },
  { title: 'Complete Assessment', href: '/admin/assessments/complete', icon: <CheckCircle className="h-5 w-5" /> },
  { title: 'Bookings', href: '/admin/bookings', icon: <ClipboardList className="h-5 w-5" /> },
  { title: 'Tasks', href: '/admin/tasks', icon: <CheckSquare className="h-5 w-5" /> },
  { title: 'Reports', href: '/admin/reports', icon: <BarChart3 className="h-5 w-5" /> },
  { title: 'Staff Management', href: '/admin/staff', icon: <Users className="h-5 w-5" /> },
  { title: 'Team', href: '/admin/team', icon: <Users className="h-5 w-5" /> },
  { title: 'Referrals', href: '/admin/referrals', icon: <FileText className="h-5 w-5" /> },
  { title: 'Purchase Orders', href: '/admin/pos', icon: <CreditCard className="h-5 w-5" /> },
  { title: 'Users', href: '/admin/users', icon: <UserCog className="h-5 w-5" /> },
  { title: 'Funding Sources', href: '/admin/funding-sources', icon: <Building2 className="h-5 w-5" /> },
  { title: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
]

const parentNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Book', href: '/parent/book', icon: <Calendar className="h-5 w-5" /> },
  { title: 'My Swimmers', href: '/parent/swimmers', icon: <Users className="h-5 w-5" /> },
  { title: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
]

const instructorNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/instructor', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Schedule', href: '/instructor/schedule', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
]

const coordinatorNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/coordinator', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Schedule', href: '/coordinator/schedule', icon: <Calendar className="h-5 w-5" /> },
  { title: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const pathname = usePathname()
  const { role, signOut } = useAuth()

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
    <aside
      className={cn(
        "h-full bg-background border-r transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
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
            <ChevronLeft className="h-5 w-5 rotate-180" />
          </Button>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/images/logo.jpg" alt="I Can Swim" className="h-8 w-8 rounded" />
              <span className="font-semibold">I Can Swim</span>
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
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link key={item.href} href={item.href} className="group">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-foreground hover:bg-muted",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                <div className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {item.icon}
                </div>
                {!collapsed && (
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-primary-foreground" : "text-foreground group-hover:text-foreground"
                  )}>
                    {item.title}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer with logout */}
      <div className={cn(
        "p-3 border-t",
        collapsed && "px-2"
      )}>
        <button
          onClick={() => signOut()}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 text-foreground hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className={cn(
            "h-5 w-5 flex-shrink-0",
            "text-muted-foreground group-hover:text-destructive"
          )} />
          {!collapsed && (
            <span className="text-sm font-medium">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}