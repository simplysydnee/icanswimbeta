'use client'

import Link from 'next/link'
import { MobileNav } from './mobile-nav'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}