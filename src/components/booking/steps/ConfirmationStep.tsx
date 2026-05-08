'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Clock, User, MapPin, AlertTriangle, Loader2, Lock, AlertCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSessionHold } from '@/hooks/useSessionHold';
import { isSwimmerFunded, type BookingSwimmer } from '@/lib/booking-utils';
import { formatPrice } from '@/lib/utils';

interface Session {
  id: string;
  startTime: string;
  endTime: string;
  location?: string;
  instructorName?: string;
  instructorAvatarUrl?: string | null;
  heldBy?: string;
  heldUntil?: string;
  isHeld?: boolean;
}

interface Swimmer extends BookingSwimmer {
  id: string;
  firstName: string;
  lastName: string;
  fundingSourceName?: string;
  fundingSourceShortName?: string;
  fundingSourcePriceCents?: number;
  fundingSourceType?: string;
  fundingSourceRequiresAuth?: boolean;
  sessionsUsed?: number;
  sessionsAuthorized?: number;
}

interface ConfirmationStepProps {
  swimmer: Swimmer;
  sessions: Session[];
  sessionType: 'single' | 'recurring' | 'assessment';
  onConfirm: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  bookingResult?: {
    success: boolean;
    confirmationNumber?: string;
    error?: string;
  };
}

function PricingDisplay({ swimmer, sessions, sessionType }: { swimmer: Swimmer; sessions: Session[]; sessionType: string }) {
  const priceCents = swimmer.fundingSourcePriceCents;
  const requiresAuth = swimmer.fundingSourceRequiresAuth;
  const hasFundingSource = !!swimmer.fundingSourceId;

  // Detect Self Determination by name pattern (ACEFMS / Mains'l)
  const isSD = !!(swimmer.fundingSourceName?.includes('Self Determination'));
  // Also detect SD-style: no auth required + no price set (but not private pay)
  const isSDLike = hasFundingSource && !requiresAuth && (priceCents === null || priceCents === undefined);

  // ====== 1. VMRC / CVRC (requires_authorization = true) ======
  if (requiresAuth) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Billed to {swimmer.fundingSourceName || 'Funding Source'}</span>
          <span className="font-medium">{formatPrice(0)}</span>
        </div>
        {swimmer.sessionsAuthorized !== undefined && (
          <div className="text-xs text-muted-foreground">
            {swimmer.sessionsUsed || 0} of {swimmer.sessionsAuthorized} authorized sessions used
          </div>
        )}
      </div>
    );
  }

  // ====== 2. Scholarship (price_cents = 0, !requiresAuth) ======
  if (priceCents === 0 || swimmer.fundingSourceType === 'scholarship') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Covered by scholarship</span>
          <span className="font-medium">{formatPrice(0)}</span>
        </div>
      </div>
    );
  }

  // ====== 3. Self Determination (ACEFMS / Mains'l) ======
  if (isSD || isSDLike) {
    const actualPrice = priceCents && priceCents > 0 ? priceCents : 0;
    if (sessionType === 'recurring' && actualPrice > 0) {
      const total = actualPrice * sessions.length;
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">{sessions.length} &times; {formatPrice(actualPrice)}</span>
            <span className="font-medium">{formatPrice(total)}</span>
          </div>
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground">Billing is managed through your Self Determination portal.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">{sessionType === 'assessment' ? 'Assessment' : 'Single Lesson'}</span>
          <span className="font-medium">{formatPrice(actualPrice)}</span>
        </div>
        <div className="border-t pt-2">
          <p className="text-xs text-muted-foreground">Billing is managed through your Self Determination portal.</p>
        </div>
      </div>
    );
  }

  // ====== 4. Private Pay / Other (default — invoice applies) ======
  const effectivePrice = priceCents && priceCents > 0 ? priceCents : 9000;

  if (sessionType === 'assessment') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Initial Assessment</span>
          <span className="font-medium">{formatPrice(17500)}</span>
        </div>
        <div className="border-t pt-2">
          <p className="text-xs text-muted-foreground">An invoice will be sent to your email.</p>
        </div>
      </div>
    );
  }

  if (sessionType === 'recurring') {
    const total = effectivePrice * sessions.length;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">{sessions.length} &times; {formatPrice(effectivePrice)}</span>
          <span className="font-medium">{formatPrice(total)}</span>
        </div>
        <div className="border-t pt-2">
          <p className="text-xs text-muted-foreground">An invoice will be sent to your email.</p>
        </div>
      </div>
    );
  }

  // Single lesson
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm">Single Lesson</span>
        <span className="font-medium">{formatPrice(effectivePrice)}</span>
      </div>
      <div className="border-t pt-2">
        <p className="text-xs text-muted-foreground">An invoice will be sent to your email.</p>
      </div>
    </div>
  );
}

export function ConfirmationStep({
  swimmer,
  sessions,
  sessionType,
  onConfirm,
  onBack,
  isSubmitting,
  bookingResult,
}: ConfirmationStepProps) {
  const funded = isSwimmerFunded(swimmer);
  const sessionsRemaining = funded
    ? (swimmer.sessionsAuthorized || 0) - (swimmer.sessionsUsed || 0)
    : null;

  // Use session hold for the first session (for single bookings)s
  const firstSessionId = sessions.length > 0 ? sessions[0].id : null;
  const {
    isHolding,
    holdUntil,
    timeRemaining,
    error: holdError,
    holdSession,
    releaseHold,
    formatTimeRemaining,
  } = useSessionHold(firstSessionId);

  // Auto-release hold on unmount
  useEffect(() => {
    return () => {
      if (isHolding && firstSessionId) {
        releaseHold();
      }
    };
  }, [isHolding, firstSessionId, releaseHold]);

  // Handle confirmation with hold
  const handleConfirmWithHold = async () => {
    // For single bookings, create a hold first
    if (sessionType === 'single' && firstSessionId && !isHolding) {
      const held = await holdSession();
      if (!held) {
        // Hold failed, show error
        return;
      }
    }

    // Proceed with booking
    await onConfirm();

    // Release hold after successful booking
    if (isHolding && firstSessionId) {
      await releaseHold();
    }
  };

  // Success state
  if (bookingResult?.success) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-800">Booking Confirmed!</h2>
          <p className="text-muted-foreground mt-2">
            {swimmer.firstName}&apos;s {sessionType === 'assessment' ? 'assessment' : 'lesson'} has been booked.
          </p>
        </div>

        {bookingResult.confirmationNumber && (
          <div className="bg-gray-50 rounded-lg p-4 inline-block">
            <p className="text-sm text-muted-foreground">Confirmation Number</p>
            <p className="text-xl font-mono font-bold">{bookingResult.confirmationNumber}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <h3 className="font-medium text-blue-800">What&apos;s Next?</h3>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 text-left">
            <li>• You&apos;ll receive a confirmation email shortly</li>
            <li>• Arrive 10 minutes before your session</li>
            <li>• Bring swim gear and a towel</li>
            <li>• Cancel at least 24 hours in advance if needed</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/parent/book">
            <Button variant="outline">Book Another Session</Button>
          </Link>
          <Link href="/parent">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (bookingResult?.error) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-red-800">Booking Failed</h2>
          <p className="text-muted-foreground mt-2">{bookingResult.error}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onBack}>Go Back</Button>
          <Button onClick={onConfirm}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Confirmation review state
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Confirm Your Booking</h2>
        <p className="text-muted-foreground">Please review the details below before confirming.</p>
      </div>

      {/* Funding Source PO Status */}
      {funded && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-800">Funding Source: {swimmer.fundingSourceName || 'Funding Source'}</p>
              <p className="text-sm text-blue-700">
                Sessions: {swimmer.sessionsUsed || 0} used / {swimmer.sessionsAuthorized || 0} authorized
              </p>
            </div>
            {sessionsRemaining !== null && (
              <Badge className="bg-blue-200 text-blue-800">
                {sessionsRemaining} remaining
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Swimmer Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-medium">
              {swimmer.firstName?.[0]}{swimmer.lastName?.[0]}
            </div>
            <div>
              <p className="font-medium">{swimmer.firstName} {swimmer.lastName}</p>
              <p className="text-sm text-muted-foreground">
                {sessionType === 'assessment' ? 'Initial Assessment' :
                 sessionType === 'recurring' ? 'Recurring Lessons' : 'Single Lesson'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Details */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-medium">Session Details</h3>
          {sessions.map((session, index) => (
            <div key={session.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-cyan-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">
                  {session.startTime ? format(new Date(session.startTime), 'EEEE, MMMM d, yyyy') : 'Date TBD'}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {session.startTime ? format(new Date(session.startTime), 'h:mm a') : 'Time TBD'}
                    {session.endTime && ` - ${format(new Date(session.endTime), 'h:mm a')}`}
                  </span>
                  {session.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {session.location}
                    </span>
                  )}
                  {session.instructorName && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {session.instructorName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Pricing</h3>
          </div>
          <PricingDisplay swimmer={swimmer} sessions={sessions} sessionType={sessionType} />
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Cancellation Policy:</strong> Please cancel at least 24 hours before your session.
          Late cancellations may result in your swimmer being marked as a &quot;flexible swimmer&quot;
          and may affect future booking priority.
        </p>
      </div>

      {/* Hold Status */}
      {sessionType === 'single' && isHolding && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Session Held</p>
                <p className="text-sm text-blue-700">
                  This session is reserved for you for {formatTimeRemaining()}
                </p>
              </div>
            </div>
            <Badge className="bg-blue-200 text-blue-800 font-mono">
              {formatTimeRemaining()}
            </Badge>
          </div>
        </div>
      )}

      {holdError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Hold Error</p>
              <p className="text-sm text-red-700">{holdError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting || isHolding} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleConfirmWithHold}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Confirming...
            </>
          ) : isHolding ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Complete Booking
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  );
}
