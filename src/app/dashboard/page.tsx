'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardRedirect() {
  const { user, role, loading, isLoadingProfile } = useAuth();
  const router = useRouter();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Timeout after 8 seconds to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      const isLoading = loading || isLoadingProfile;
      if (isLoading) {
        setHasTimedOut(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [loading, isLoadingProfile]);

  useEffect(() => {
    const isLoading = loading || isLoadingProfile;

    // Still loading — wait
    if (isLoading) return;

    // Not authenticated — send to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Special redirect for staff email regardless of role
    const userEmail = user.email?.toLowerCase();
    if (userEmail === 'staff@icanswim209.com') {
      router.replace('/staff-mode');
      return;
    }

    // Role is not yet resolved — do not redirect prematurely
    if (role === null || role === undefined) return;

    if (role === 'admin') {
      router.replace('/admin');
    } else if (role === 'instructor') {
      router.replace('/instructor');
    } else if (role === 'coordinator') {
      router.replace('/coordinator/pos');
    } else if (role === 'parent') {
      router.replace('/parent');
    } else {
      // Unknown role — default to parent
      router.replace('/parent');
    }
  }, [user, role, loading, isLoadingProfile, router]);

  // Show loading while checking auth (unless timed out)
  const isLoading = loading || isLoadingProfile;
  if (isLoading && !hasTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show timeout or error state
  if (hasTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Loading Timeout
          </h2>
          <p className="text-gray-600 mb-4">
            The dashboard is taking longer than expected to load. This might be a temporary issue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-cyan-600 hover:bg-cyan-700">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/login')}>
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // This should only show briefly before redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
