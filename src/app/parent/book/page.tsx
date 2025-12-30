'use client';

import { BookingWizard } from '@/components/booking/BookingWizard';
import { RequireAuthRedirect } from '@/components/auth/RequireAuthRedirect';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BookPageContent() {
  const searchParams = useSearchParams();
  const preselectedSwimmerId = searchParams.get('swimmerId');

  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Book a Session</h1>
        <p className="text-muted-foreground mt-2">
          {preselectedSwimmerId ? 'Schedule a lesson for your swimmer' : 'Select a swimmer and schedule your lesson'}
        </p>
      </div>
      <BookingWizard preselectedSwimmerId={preselectedSwimmerId} />
    </div>
  );
}

export default function BookPage() {
  return (
    <RequireAuthRedirect>
      <Suspense fallback={
        <div className="container max-w-6xl py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Book a Session</h1>
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
        </div>
      }>
        <BookPageContent />
      </Suspense>
    </RequireAuthRedirect>
  );
}