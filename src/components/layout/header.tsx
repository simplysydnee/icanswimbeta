'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Navigation } from './navigation';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { Menu } from 'lucide-react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex flex-col items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-1">
              I Can Swim
            </h1>
            <div className="w-32">
              <svg
                viewBox="0 0 120 8"
                fill="none"
                className="w-full h-2"
                preserveAspectRatio="none"
              >
                <mask id="headerTaperMask">
                  <linearGradient id="headerTaperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="white" stopOpacity="0" />
                    <stop offset="15%" stopColor="white" stopOpacity="1" />
                    <stop offset="85%" stopColor="white" stopOpacity="1" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                  <rect x="0" y="0" width="120" height="8" fill="url(#headerTaperGradient)" />
                </mask>
                <path
                  d="M0,4 C20,1 40,1 60,4 C80,7 100,7 120,4"
                  stroke="url(#headerWaveGradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  mask="url(#headerTaperMask)"
                />
                <defs>
                  <linearGradient id="headerWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2a5e84" />
                    <stop offset="100%" stopColor="#23a1c0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {!loading && (
            user ? (
              <UserMenu />
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col space-y-4 mt-4">
              <Navigation />
              <div className="border-t pt-4 space-y-2">
                {!loading && (
                  user ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{user.fullName || user.email}</div>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/settings">Settings</Link>
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => signOut()}>
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/login">Sign In</Link>
                      </Button>
                      <Button className="w-full" asChild>
                        <Link href="/signup">Get Started</Link>
                      </Button>
                    </>
                  )
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}