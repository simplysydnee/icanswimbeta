'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function SettingsRedirect() {
  const { user, role, loading, isLoadingProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const isLoading = loading || isLoadingProfile;
    if (!isLoading && user) {
      // Special redirect for staff@icanswim209.com
      const userEmail = user.email?.toLowerCase();
      if (userEmail === 'staff@icanswim209.com') {
        console.log('Settings: Redirecting staff@icanswim209.com to /staff-mode');
        router.replace('/staff-mode');
        return;
      }

      // Redirect based on role
      switch (role) {
        case 'admin':
          router.replace('/admin/settings');
          break;
        case 'instructor':
          // Instructor settings page doesn't exist yet, redirect to instructor dashboard
          router.replace('/instructor');
          break;
        case 'coordinator':
          // Coordinator settings page doesn't exist yet, redirect to coordinator dashboard
          router.replace('/coordinator/pos');
          break;
        case 'parent':
        default:
          // Parent settings page doesn't exist yet, redirect to parent dashboard
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
        <p className="text-muted-foreground">Redirecting to settings...</p>
      </div>
    </div>
  );
}