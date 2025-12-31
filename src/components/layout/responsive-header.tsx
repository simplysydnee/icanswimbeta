'use client'

import Link from 'next/link'
import { MobileNav } from './mobile-nav'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from './UserMenu'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function ResponsiveHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile menu */}
        <MobileNav />

        {/* Logo - visible on mobile when menu closed */}
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <img src="/images/logo.jpg" alt="I Can Swim" className="h-8 w-8 rounded" />
          <span className="font-semibold">I Can Swim</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side - notifications & profile */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Notifications feature coming soon
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Email notifications are currently sent for:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Booking changes</li>
                    <li>Assessment completions</li>
                    <li>POS approvals</li>
                  </ul>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}