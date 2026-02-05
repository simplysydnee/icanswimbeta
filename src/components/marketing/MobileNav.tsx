'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, Edit, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { Button } from '@/components/ui/button';

interface NavLink {
  name: string;
  href: string;
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
}

export function MobileNav({ isOpen, onClose, navLinks }: MobileNavProps) {
  const { user, loading, signOut, role } = useAuth();
  const { editMode, toggleEditMode } = useEditMode();

  // Close menu when clicking Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && target.closest('[data-mobile-nav]') === null) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out menu */}
      <div
        data-mobile-nav
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl lg:hidden transform transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              type="button"
              className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
              onClick={onClose}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-cyan-600 transition-colors"
                  onClick={onClose}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* Login/Logout Button */}
          <div className="border-t border-gray-200 p-4">
            {loading ? (
              <div className="flex items-center justify-center py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-cyan-600" />
              </div>
            ) : user ? (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Logged in as</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
                {(role === 'admin' || (Array.isArray(role) && role.includes('admin'))) && (
                  <Button
                    onClick={() => {
                      toggleEditMode();
                      onClose();
                    }}
                    variant={editMode ? 'default' : 'outline'}
                    className={`w-full ${editMode ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
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
                  className="w-full"
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                >
                  Sign Out
                </Button>
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center rounded-lg bg-cyan-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-colors"
                  onClick={onClose}
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-lg bg-cyan-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-colors"
                  onClick={onClose}
                >
                  Login
                </Link>
                <p className="mt-4 text-center text-sm text-gray-600">
                  Need help? Call us at{' '}
                  <a href="tel:2097787877" className="font-medium text-cyan-600 hover:text-cyan-500">
                    (209) 778-7877
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}