'use client';

import { AlertCircle, User } from 'lucide-react';
import Link from 'next/link';
import { useSwimmers } from '@/hooks/useSwimmers';
import { SwimmerCard } from '../SwimmerCard';
import type { Swimmer } from '@/types/booking';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SwimmerSelectStepProps {
  selectedSwimmerId: string | null;
  onSelectSwimmer: (swimmer: Swimmer) => void;
}

export function SwimmerSelectStep({ selectedSwimmerId, onSelectSwimmer }: SwimmerSelectStepProps) {
  const { data: swimmers, isLoading, error } = useSwimmers();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Loading swimmers...</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load swimmers. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!swimmers || swimmers.length === 0) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No Swimmers Found</h3>
          <p className="text-muted-foreground">
            Add a swimmer to start booking lessons
          </p>
        </div>
        <Button asChild>
          <Link href="/parent/swimmers/new">Add New Swimmer</Link>
        </Button>
      </div>
    );
  }

  // Split swimmers into groups
  const canBookSwimmers = swimmers.filter(swimmer =>
    swimmer.enrollmentStatus === 'enrolled' || swimmer.enrollmentStatus === 'waitlist'
  );

  const cannotBookSwimmers = swimmers.filter(swimmer =>
    !(swimmer.enrollmentStatus === 'enrolled' || swimmer.enrollmentStatus === 'waitlist')
  );

  return (
    <div className="space-y-8">
      {/* Available for booking section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Available for Booking</h3>
          <p className="text-sm text-muted-foreground">
            Select a swimmer to book lessons
          </p>
        </div>

        {canBookSwimmers.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-muted-foreground">
              No swimmers available for booking. Check enrollment status.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {canBookSwimmers.map(swimmer => (
              <SwimmerCard
                key={swimmer.id}
                swimmer={swimmer}
                isSelected={selectedSwimmerId === swimmer.id}
                onClick={() => onSelectSwimmer(swimmer)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cannot book yet section */}
      {cannotBookSwimmers.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Cannot Book Yet</h3>
            <p className="text-sm text-muted-foreground">
              These swimmers need approval before booking
            </p>
          </div>

          <div className="grid gap-3">
            {cannotBookSwimmers.map(swimmer => (
              <SwimmerCard
                key={swimmer.id}
                swimmer={swimmer}
                isSelected={false}
                disabled={true}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}