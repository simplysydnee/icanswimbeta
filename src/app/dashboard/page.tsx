'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirect() {
  const { user, role, loading, isLoadingProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const isLoading = loading || isLoadingProfile;
    if (!isLoading && user) {
      // Redirect based on role
      switch (role) {
        case 'admin':
          router.replace('/admin');
          break;
        case 'instructor':
          router.replace('/instructor');
          break;
        case 'vmrc_coordinator':
          router.replace('/coordinator/pos');
          break;
        case 'parent':
        default:
          router.replace('/parent');
          break;
      }
    } else if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, role, loading, isLoadingProfile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}