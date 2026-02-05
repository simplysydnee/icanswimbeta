'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Edit, Check } from 'lucide-react';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { Button } from '@/components/ui/button';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Our Team', href: '/team' },
  { name: 'Programs', href: '/programs' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Regional Centers', href: '/regional-centers' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' },
];

export function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading, signOut, role } = useAuth();
  const { editMode, toggleEditMode } = useEditMode();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo - Desktop */}
            <div className="hidden lg:flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="relative h-10 w-40">
                  <Image
                    src="/images/logo.svg"
                    alt="I Can Swim Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Logo - Mobile */}
            <div className="lg:hidden flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="relative h-8 w-8">
                  <Image
                    src="/images/logo-icon.svg"
                    alt="I Can Swim Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <span className="text-lg font-semibold text-gray-900">I Can Swim</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-cyan-600 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Login/Logout Button & Mobile Menu */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="hidden lg:flex w-20 h-10 items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-cyan-600" />
                </div>
              ) : user ? (
                <>
                  {(role === 'admin' || (Array.isArray(role) && role.includes('admin'))) && (
                    <Button
                      onClick={toggleEditMode}
                      variant={editMode ? 'default' : 'outline'}
                      size="sm"
                      className={editMode ? 'bg-yellow-500 hover:bg-yellow-600 hidden lg:inline-flex flex-shrink-0 ml-2' : 'hidden lg:inline-flex flex-shrink-0 ml-2'}
                    >
                      {editMode ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Done Editing
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Pages
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => signOut()}
                    className="hidden lg:inline-flex"
                  >
                    Sign Out
                  </Button>
                  <Link
                    href="/dashboard"
                    className="hidden lg:inline-flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="hidden lg:inline-flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-colors"
                >
                  Login
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navLinks={navLinks}
      />
    </>
  );
}