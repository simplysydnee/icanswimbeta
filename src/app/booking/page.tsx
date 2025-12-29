'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function BookingRedirect() {
  const { user, loading, isLoadingProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const isLoading = loading || isLoadingProfile;
    if (!isLoading) {
      // Get swimmer ID from URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const swimmerId = urlParams.get('swimmer');

      if (user) {
        // User is logged in, redirect to parent book with swimmer parameter if provided
        if (swimmerId) {
          router.replace(`/parent/book?swimmerId=${swimmerId}`);
        } else {
          router.replace('/parent/book');
        }
      } else {
        // User is not logged in, redirect to login with return URL
        const returnUrl = swimmerId ? `/booking?swimmer=${swimmerId}` : '/booking';
        router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      }
    }
  }, [user, loading, isLoadingProfile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to booking...</p>
      </div>
    </div>
  );
}