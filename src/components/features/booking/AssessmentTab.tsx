'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAssessmentSessions } from '@/hooks/useAssessmentSessions';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AssessmentTabProps {
  selectedSwimmerId?: string;
  onBookingComplete?: () => void;
}

export function AssessmentTab({ selectedSwimmerId, onBookingComplete }: AssessmentTabProps) {
  const { sessions, loading, error, refetch } = useAssessmentSessions();
  const { user } = useAuth();
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const handleConfirm = async (sessionId: string) => {
    if (!selectedSwimmerId || !user?.id) {
      setBookingError('Please select a swimmer first');
      return;
    }

    try {
      setBookingInProgress(sessionId);
      setBookingError(null);
      setBookingSuccess(null);

      const bookingData = {
        session_id: sessionId,
        swimmer_id: selectedSwimmerId,
        parent_id: user.id,
      };

      const result = await apiClient.bookAssessmentSession(bookingData);

      setBookingSuccess(`Assessment booked successfully! Booking ID: ${result.booking.id}`);

      // Refresh the sessions list
      await refetch();

      // Call the completion callback
      onBookingComplete?.();
    } catch (err) {
      console.error('Error booking assessment:', err);
      setBookingError('Failed to book assessment session. Please try again.');
    } finally {
      setBookingInProgress(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDayOfWeek = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Assessment Sessions</h2>
        <p className="text-gray-600">
          Book an initial assessment to evaluate your child&apos;s swimming abilities and create a personalized lesson plan.
        </p>
      </div>

      {bookingError && (
        <Alert variant="destructive">
          <AlertDescription>{bookingError}</AlertDescription>
        </Alert>
      )}

      {bookingSuccess && (
        <Alert>
          <AlertDescription className="text-green-600">{bookingSuccess}</AlertDescription>
        </Alert>
      )}

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p>No assessment sessions are currently available.</p>
              <p className="text-sm mt-2">Please check back later for new session openings.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {formatDate(session.start_time)}
                    </CardTitle>
                    <CardDescription>
                      {formatTime(session.start_time)} - {formatTime(session.end_time)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={session.is_full ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {session.is_full ? 'Full' : `${session.max_capacity - session.booking_count} spots left`}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {session.location}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Day:</span> {getDayOfWeek(session.day_of_week)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Price:</span> ${(session.price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleConfirm(session.id)}
                    disabled={
                      session.is_full ||
                      !selectedSwimmerId ||
                      bookingInProgress === session.id
                    }
                    className="min-w-[120px]"
                  >
                    {bookingInProgress === session.id ? (
                      <LoadingSpinner size="sm" />
                    ) : session.is_full ? (
                      'Full'
                    ) : !selectedSwimmerId ? (
                      'Select Swimmer'
                    ) : (
                      'Book Assessment'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">About Assessment Sessions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 45-minute one-on-one evaluation with our certified instructors</li>
          <li>• Assessment of current swimming abilities and comfort level</li>
          <li>• Personalized lesson plan recommendation</li>
          <li>• Required before starting regular swim lessons</li>
          <li>• VMRC clients: Assessment is covered by your purchase order</li>
        </ul>
      </div>
    </div>
  );
}