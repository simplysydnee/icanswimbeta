'use client';

import { format, parseISO } from 'date-fns';
import { User, Calendar, Clock, MapPin, CreditCard } from 'lucide-react';

import type { Swimmer, AvailableSession } from '@/types/booking';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { PRICING } from '@/lib/constants';

// Helper constants
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper function to format time to 12-hour format
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Props interface
interface BookingSummaryProps {
  swimmer: Swimmer | null;
  sessionType: 'single' | 'recurring' | null;
  instructorName: string | null;
  instructorPreference: 'any' | 'specific';
  selectedSession: AvailableSession | null;
  selectedRecurringSessions: AvailableSession[];
  recurringDay: number | null;
  recurringTime: string | null;
  recurringStartDate: Date | null;
  recurringEndDate: Date | null;
}

export function BookingSummary({
  swimmer,
  sessionType,
  instructorName,
  instructorPreference,
  selectedSession,
  selectedRecurringSessions,
  recurringDay,
  recurringTime,
  recurringStartDate,
  recurringEndDate,
}: BookingSummaryProps) {
  // Calculate session count and total price
  const sessionCount = sessionType === 'single'
    ? (selectedSession ? 1 : 0)
    : selectedRecurringSessions.length;

  const isVmrcClient = swimmer?.isVmrcClient ?? false;
  const sessionPrice = isVmrcClient ? PRICING.VMRC_LESSON : PRICING.LESSON_PRIVATE_PAY;
  const totalPrice = sessionCount * sessionPrice;

  // Helper to format date range
  const formatDateRange = () => {
    if (!recurringStartDate || !recurringEndDate) return '';
    return `${format(recurringStartDate, 'MMM d, yyyy')} - ${format(recurringEndDate, 'MMM d, yyyy')}`;
  };

  // Helper to get day name from day number
  const getDayName = (dayNumber: number | null): string => {
    if (dayNumber === null) return '';
    return DAYS_OF_WEEK[dayNumber] || '';
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Booking Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Swimmer Section */}
        {swimmer ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {swimmer.firstName} {swimmer.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={swimmer.enrollmentStatus} size="sm" />
              {swimmer.isVmrcClient && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  VMRC Client - State Funded
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Select a swimmer to start
          </div>
        )}

        {/* Separator */}
        {swimmer && <div className="border-t" />}

        {/* Session Details Section */}
        {swimmer && sessionType && (
          <div className="space-y-4">
            {sessionType === 'single' && selectedSession ? (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Single Session</span>
                </div>

                <div className="space-y-2 pl-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTime12Hour(format(parseISO(selectedSession.startTime), 'HH:mm'))}</span>
                  </div>

                  <div className="text-sm">
                    {format(parseISO(selectedSession.startTime), 'EEEE, MMM d, yyyy')}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedSession.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{instructorPreference === 'specific' && instructorName ? instructorName : 'Any Available'}</span>
                  </div>
                </div>
              </>
            ) : sessionType === 'recurring' && (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Recurring Weekly</span>
                </div>

                <div className="space-y-2 pl-6">
                  {recurringDay !== null && recurringTime && (
                    <div className="text-sm">
                      {selectedRecurringSessions.length} sessions on {getDayName(recurringDay)}s at {formatTime12Hour(recurringTime)}
                    </div>
                  )}

                  {recurringStartDate && recurringEndDate && (
                    <div className="text-sm">{formatDateRange()}</div>
                  )}

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{instructorPreference === 'specific' && instructorName ? instructorName : 'Any Available'}</span>
                  </div>

                  {selectedRecurringSessions.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {selectedRecurringSessions.length} session{selectedRecurringSessions.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Separator */}
        {swimmer && sessionType && <div className="border-t" />}

        {/* Pricing Section */}
        {swimmer && sessionType && sessionCount > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Payment</span>
            </div>

            {isVmrcClient ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">State Funded</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    $0.00
                  </Badge>
                </div>
                {swimmer.vmrcSessionsUsed !== undefined && swimmer.vmrcSessionsAuthorized !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    {sessionCount} of {swimmer.vmrcSessionsAuthorized} authorized sessions will be used
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {sessionCount} × {formatPrice(PRICING.LESSON_PRIVATE_PAY)}
                  </span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>

                <div className="border-t" />

                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}