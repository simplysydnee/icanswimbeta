'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ParentBookingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [swimmerId, setSwimmerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        // Get swimmer ID from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        setSwimmerId(urlParams.get('swimmer'));
        setIsLoading(false);
      }
    }
  }, [user, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/parent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <h1 className="text-3xl font-bold text-gray-900">Book a Lesson</h1>
        <p className="text-gray-600 mt-2">
          {swimmerId
            ? 'Book a lesson for your swimmer'
            : 'Select a swimmer to book a lesson'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking System</CardTitle>
          <CardDescription>
            The booking system is currently under development. Please use the dashboard to book lessons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-700">
              For now, please use the following options:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href="/parent">
                  Go to Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/parent/sessions">
                  View Available Sessions
                </Link>
              </Button>
            </div>
            {swimmerId && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Note: You were trying to book for swimmer ID: {swimmerId}.
                  Please select this swimmer from your dashboard to book a lesson.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}