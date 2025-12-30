'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirect() {
  const { user, role, loading, isLoadingProfile } = useAuth();
  const router = useRouter();

  // Early redirect for non-authenticated users
  if (!loading && !isLoadingProfile && !user) {
    router.replace('/login');
    return null;
  }

  useEffect(() => {
    const isLoading = loading || isLoadingProfile;
    if (!isLoading && user) {
      // Only redirect if we have a definite role
      if (role === 'admin') {
        router.replace('/admin');
      } else if (role === 'instructor') {
        router.replace('/instructor');
      } else if (role === 'coordinator') {
        router.replace('/coordinator/pos');
      } else if (role === 'parent') {
        router.replace('/parent');
      }
      // If role is null/undefined, don't redirect - wait for role to be determined
      // or show appropriate UI
    }
  }, [user, role, loading, isLoadingProfile, router]);

  // Show loading while checking auth
  const isLoading = loading || isLoadingProfile;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if we have a user but no role could be determined
  if (user && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Determine Role</h2>
          <p className="text-gray-600 mb-4">
            We couldn't determine your user role. Please contact support or try logging out and back in.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition"
          >
            Go to Login
          </button>
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