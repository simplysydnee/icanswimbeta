'use client';

import { AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface POSStatusBannerProps {
  isFunded: boolean;
  fundingSource: { name: string; short_name: string } | null;
  activePOS: {
    status: string;
    sessions_authorized: number;
    sessions_booked: number;
    sessions_available: number;
    end_date: string;
  } | null;
  needsAttention: boolean;
}

export function POSStatusBanner({
  isFunded,
  fundingSource,
  activePOS,
  needsAttention
}: POSStatusBannerProps) {
  if (!isFunded) {
    return null; // Private pay - no banner needed
  }

  if (!activePOS) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Active Authorization</AlertTitle>
        <AlertDescription>
          No active Purchase Order found for {fundingSource?.short_name || 'funding'}.
          Please contact your coordinator to set up authorization before booking.
        </AlertDescription>
      </Alert>
    );
  }

  if (activePOS.status === 'pending') {
    return (
      <Alert className="mb-4 border-yellow-300 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Authorization Pending</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Your {fundingSource?.short_name} authorization is awaiting coordinator approval.
          You can book sessions, but they won&apos;t be confirmed until approved.
        </AlertDescription>
      </Alert>
    );
  }

  if (activePOS.status === 'approved_pending_auth') {
    return (
      <Alert className="mb-4 border-orange-300 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">Approved - Pending Auth Number</AlertTitle>
        <AlertDescription className="text-orange-700">
          Your authorization is approved. Waiting for authorization number from coordinator.
          <span className="block mt-1 font-medium">
            {activePOS.sessions_available} of {activePOS.sessions_authorized} sessions available
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  // Active POS
  const sessionsLow = activePOS.sessions_available <= 3;

  return (
    <Alert className={`mb-4 ${sessionsLow ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
      {sessionsLow ? (
        <AlertCircle className="h-4 w-4 text-orange-600" />
      ) : (
        <CheckCircle className="h-4 w-4 text-green-600" />
      )}
      <AlertTitle className={sessionsLow ? 'text-orange-800' : 'text-green-800'}>
        {fundingSource?.short_name} Authorization Active
      </AlertTitle>
      <AlertDescription className={sessionsLow ? 'text-orange-700' : 'text-green-700'}>
        <span className="font-medium">
          {activePOS.sessions_available} of {activePOS.sessions_authorized} sessions available
        </span>
        <span className="block text-sm">
          Valid through {new Date(activePOS.end_date).toLocaleDateString()}
        </span>
        {sessionsLow && (
          <span className="block mt-1 text-orange-600 font-medium">
            ⚠️ Running low on sessions - renewal will be requested soon
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}