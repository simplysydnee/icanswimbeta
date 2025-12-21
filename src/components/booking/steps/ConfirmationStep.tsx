'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Clock, User, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Session {
  id: string;
  startTime: string;
  endTime: string;
  location?: string;
  instructorName?: string;
  instructorAvatarUrl?: string;
}

interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  paymentType?: string;
  is_vmrc_client?: boolean;
  vmrc_sessions_used?: number;
  vmrc_sessions_authorized?: number;
  fundingSourceId?: string;
  fundingSourceName?: string;
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

export function ConfirmationStep({
  swimmer,
  sessions,
  sessionType,
  onConfirm,
  onBack,
  isSubmitting,
  bookingResult,
}: ConfirmationStepProps) {
  const isVmrc = swimmer.is_vmrc_client || swimmer.paymentType === 'vmrc' || swimmer.fundingSourceId;
  const sessionsRemaining = isVmrc
    ? (swimmer.vmrc_sessions_authorized || 0) - (swimmer.vmrc_sessions_used || 0)
    : null;
  const hasEnoughSessions = sessionsRemaining === null || sessionsRemaining >= sessions.length;

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
            {swimmer.firstName}'s {sessionType === 'assessment' ? 'assessment' : 'lesson'} has been booked.
          </p>
        </div>

        {bookingResult.confirmationNumber && (
          <div className="bg-gray-50 rounded-lg p-4 inline-block">
            <p className="text-sm text-muted-foreground">Confirmation Number</p>
            <p className="text-xl font-mono font-bold">{bookingResult.confirmationNumber}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <h3 className="font-medium text-blue-800">What's Next?</h3>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 text-left">
            <li>• You'll receive a confirmation email shortly</li>
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

      {/* VMRC PO Warning */}
      {isVmrc && !hasEnoughSessions && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Insufficient Authorized Sessions</p>
              <p className="text-sm text-red-700">
                You have {sessionsRemaining} session(s) remaining but are trying to book {sessions.length}.
                Please contact your coordinator for additional authorization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VMRC PO Status */}
      {isVmrc && hasEnoughSessions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-800">Funding Source: {swimmer.fundingSourceName || 'VMRC'}</p>
              <p className="text-sm text-blue-700">
                Sessions: {swimmer.vmrc_sessions_used || 0} used / {swimmer.vmrc_sessions_authorized || 0} authorized
              </p>
            </div>
            <Badge className="bg-blue-200 text-blue-800">
              {sessionsRemaining} remaining
            </Badge>
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

      {/* Cancellation Policy */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Cancellation Policy:</strong> Please cancel at least 24 hours before your session.
          Late cancellations may result in your swimmer being marked as a "flexible swimmer"
          and may affect future booking priority.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isSubmitting || !hasEnoughSessions}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Confirming...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  );
}