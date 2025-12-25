'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

import type { Swimmer, AvailableSession, BookingStep, SessionType } from '@/types/booking';
import { SwimmerSelectStep } from './steps/SwimmerSelectStep';
import { SessionTypeStep } from './steps/SessionTypeStep';
import InstructorStep from './steps/InstructorStep';
import { DateSelectStep } from './steps/DateSelectStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { BookingSummary } from './BookingSummary';
import { AssessmentTab } from '@/components/features/booking/AssessmentTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Props interface
interface BookingWizardProps {
  // Can add props later if needed
}

export function BookingWizard({}: BookingWizardProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Step management
  const [currentStep, setCurrentStep] = useState<BookingStep>('select-swimmer');

  // Swimmer selection
  const [selectedSwimmer, setSelectedSwimmer] = useState<Swimmer | null>(null);

  // Session type (for enrolled swimmers)
  const [sessionType, setSessionType] = useState<SessionType | null>(null);

  // Instructor selection
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [instructorPreference, setInstructorPreference] = useState<'any' | 'specific'>('any');
  const [instructorName, setInstructorName] = useState<string | null>(null);

  // Single session selection
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<AvailableSession | null>(null);

  // Recurring session selections
  const [recurringDay, setRecurringDay] = useState<number | null>(null);
  const [recurringTime, setRecurringTime] = useState<string | null>(null);
  const [recurringStartDate, setRecurringStartDate] = useState<Date | null>(null);
  const [recurringEndDate, setRecurringEndDate] = useState<Date | null>(null);
  const [selectedRecurringSessions, setSelectedRecurringSessions] = useState<AvailableSession[]>([]);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    confirmationNumber?: string;
    error?: string;
  } | null>(null);

  // Step flow logic
  const getStepNumber = (step: BookingStep): number => {
    const isWaitlist = selectedSwimmer?.enrollmentStatus === 'waitlist';

    if (isWaitlist) {
      // Waitlist flow: select-swimmer → assessment → confirm
      const waitlistSteps = ['select-swimmer', 'assessment', 'confirm'];
      return waitlistSteps.indexOf(step) + 1;
    } else {
      // Enrolled flow: select-swimmer → session-type → select-instructor → select-date → confirm
      const enrolledSteps = ['select-swimmer', 'session-type', 'select-instructor', 'select-date', 'confirm'];
      return enrolledSteps.indexOf(step) + 1;
    }
  };

  const getTotalSteps = (): number => {
    const isWaitlist = selectedSwimmer?.enrollmentStatus === 'waitlist';
    return isWaitlist ? 3 : 5;
  };

  const getProgress = (): number => {
    return (getStepNumber(currentStep) / getTotalSteps()) * 100;
  };

  // Navigation functions
  const handleNext = () => {
    const isWaitlist = selectedSwimmer?.enrollmentStatus === 'waitlist';
    const isPending = selectedSwimmer?.enrollmentStatus === 'pending_enrollment';

    switch (currentStep) {
      case 'select-swimmer':
        if (isWaitlist) {
          setCurrentStep('assessment');
        } else if (isPending) {
          // For pending approval, skip to confirmation with message
          setCurrentStep('confirm');
        } else {
          setCurrentStep('session-type');
        }
        break;
      case 'session-type':
        setCurrentStep('select-instructor');
        break;
      case 'select-instructor':
        setCurrentStep('select-date');
        break;
      case 'select-date':
      case 'assessment':
        setCurrentStep('confirm');
        break;
    }
  };

  const handleBack = () => {
    const isWaitlist = selectedSwimmer?.enrollmentStatus === 'waitlist';

    switch (currentStep) {
      case 'session-type':
        setCurrentStep('select-swimmer');
        break;
      case 'select-instructor':
        setCurrentStep('session-type');
        break;
      case 'select-date':
        setCurrentStep('select-instructor');
        break;
      case 'assessment':
        setCurrentStep('select-swimmer');
        break;
      case 'confirm':
        setCurrentStep(isWaitlist ? 'assessment' : 'select-date');
        break;
    }
  };

  // Can proceed logic
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'select-swimmer':
        return selectedSwimmer !== null;
      case 'session-type':
        return sessionType !== null;
      case 'select-instructor':
        return instructorPreference === 'any' || selectedInstructorId !== null;
      case 'select-date':
        if (sessionType === 'single') {
          return selectedSessionId !== null;
        } else {
          return selectedRecurringSessions.length > 0;
        }
      case 'assessment':
        return selectedSessionId !== null;
      case 'confirm':
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedSwimmer, sessionType, instructorPreference, selectedInstructorId, selectedSessionId, selectedRecurringSessions]);

  // Step titles
  const getStepInfo = (step: BookingStep) => {
    const stepInfo: Record<BookingStep, { title: string; description: string }> = {
      'select-swimmer': { title: 'Select Swimmer', description: 'Choose which swimmer to book for' },
      'session-type': { title: 'Session Type', description: 'Choose single or recurring sessions' },
      'select-instructor': { title: 'Select Instructor', description: 'Choose your preferred instructor' },
      'select-date': { title: 'Select Date & Time', description: 'Pick your session schedule' },
      'assessment': { title: 'Book Assessment', description: 'Schedule your initial assessment' },
      'confirm': { title: 'Confirm Booking', description: 'Review and confirm your booking' },
    };
    return stepInfo[step];
  };

  // Submit function
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setBookingResult(null);

    try {
      if (!selectedSwimmer) {
        throw new Error('No swimmer selected');
      }

      let response: Response;
      let endpoint = '';
      let payload: any = { swimmerId: selectedSwimmer.id };

      if (currentStep === 'assessment') {
        // Assessment booking
        if (!selectedSessionId) {
          throw new Error('No session selected');
        }
        endpoint = '/api/bookings/assessment';
        payload.sessionId = selectedSessionId;
      } else if (sessionType === 'single') {
        // Single lesson booking
        if (!selectedSessionId) {
          throw new Error('No session selected');
        }

        // Check for conflicts before booking
        const conflictResponse = await fetch('/api/bookings/check-conflict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            swimmerId: selectedSwimmer.id,
            sessionId: selectedSessionId,
          }),
        });

        const conflictData = await conflictResponse.json();
        if (conflictData.hasConflict) {
          throw new Error(conflictData.message || 'Booking conflict detected');
        }

        endpoint = '/api/bookings/single';
        payload.sessionId = selectedSessionId;
      } else {
        // Recurring bookings
        const sessionIds = selectedRecurringSessions.map(s => s.id);
        if (sessionIds.length === 0) {
          throw new Error('No sessions selected');
        }

        // Check for conflicts for each session
        for (const session of selectedRecurringSessions) {
          const conflictResponse = await fetch('/api/bookings/check-conflict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              swimmerId: selectedSwimmer.id,
              startTime: session.startTime,
              endTime: session.endTime,
            }),
          });

          const conflictData = await conflictResponse.json();
          if (conflictData.hasConflict) {
            throw new Error(`Conflict detected for session on ${new Date(session.startTime).toLocaleDateString()}: ${conflictData.message}`);
          }
        }

        endpoint = '/api/bookings/recurring';
        payload.sessionIds = sessionIds;
      }

      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      // Generate confirmation number (format: ICS-YYYYMMDD-XXXXX)
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const confirmationNumber = `ICS-${dateStr}-${randomNum}`;

      // Set success result
      setBookingResult({
        success: true,
        confirmationNumber,
      });

    } catch (err) {
      console.error('Booking error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking. Please try again.';
      setError(errorMessage);
      setBookingResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep('select-swimmer');
    setSelectedSwimmer(null);
    setSessionType(null);
    setSelectedInstructorId(null);
    setInstructorPreference('any');
    setInstructorName(null);
    setSelectedSessionId(null);
    setSelectedSession(null);
    setRecurringDay(null);
    setRecurringTime(null);
    setRecurringStartDate(null);
    setRecurringEndDate(null);
    setSelectedRecurringSessions([]);
    setError(null);
    setBookingResult(null);
  };

  // Render step function
  const renderStep = () => {
    switch (currentStep) {
      case 'select-swimmer':
        return (
          <SwimmerSelectStep
            selectedSwimmerId={selectedSwimmer?.id || null}
            onSelectSwimmer={(swimmer) => {
              setSelectedSwimmer(swimmer);
              // Auto-advance after selection
              setTimeout(() => handleNext(), 150);
            }}
          />
        );

      case 'session-type':
        return (
          <SessionTypeStep
            selectedType={sessionType}
            paymentType={selectedSwimmer?.paymentType}
            fundingSourceName={selectedSwimmer?.fundingSourceName}
            isFlexibleSwimmer={selectedSwimmer?.flexibleSwimmer || false}
            enrollmentStatus={selectedSwimmer?.enrollmentStatus}
            assessmentStatus={selectedSwimmer?.assessmentStatus}
            onSelectType={(type) => {
              setSessionType(type);
              setTimeout(() => handleNext(), 150);
            }}
          />
        );

      case 'select-instructor':
        return (
          <InstructorStep
            selectedInstructorId={selectedInstructorId}
            instructorPreference={instructorPreference}
            onSelectInstructor={(id, preference) => {
              setSelectedInstructorId(id);
              setInstructorPreference(preference);
              // We'll need to fetch instructor name if specific
              // For now, set a placeholder name
              if (id && preference === 'specific') {
                setInstructorName('Instructor Name');
              }
              setTimeout(() => handleNext(), 150);
            }}
          />
        );

      case 'select-date':
        return (
          <DateSelectStep
            sessionType={sessionType || 'single'}
            instructorId={instructorPreference === 'specific' ? selectedInstructorId : null}
            selectedSessionId={selectedSessionId}
            recurringDay={recurringDay}
            recurringTime={recurringTime}
            recurringStartDate={recurringStartDate}
            recurringEndDate={recurringEndDate}
            selectedRecurringSessions={selectedRecurringSessions.map(s => s.id)}
            swimmerId={selectedSwimmer?.id || null} // Pass swimmerId for flexible_swimmer check
            onSelectSession={(session) => {
              setSelectedSessionId(session.id);
              setSelectedSession(session);
            }}
            onSetRecurring={(opts) => {
              if (opts.day !== undefined) setRecurringDay(opts.day);
              if (opts.time !== undefined) setRecurringTime(opts.time);
              if (opts.startDate !== undefined) setRecurringStartDate(opts.startDate);
              if (opts.endDate !== undefined) setRecurringEndDate(opts.endDate);
              if (opts.sessions && opts.sessions.length > 0) {
                setSelectedRecurringSessions(opts.sessions);
              }
            }}
          />
        );

      case 'assessment':
        return (
          <AssessmentTab
            selectedSwimmerId={selectedSwimmer?.id}
            onBookingComplete={() => {
              // After assessment is booked, move to confirmation
              setTimeout(() => handleNext(), 150);
            }}
          />
        );

      case 'confirm':
        const isAssessment = selectedSwimmer?.enrollmentStatus === 'waitlist';
        const isPending = selectedSwimmer?.enrollmentStatus === 'pending_enrollment';

        if (isPending) {
          // Pending approval message
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Pending Approval</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSwimmer?.firstName} is awaiting admin approval.
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">What happens next:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your swimmer's application is being reviewed by our team</li>
                    <li>You'll receive an email notification once approved</li>
                    <li>After approval, you can book assessments or regular lessons</li>
                    <li>For regional center clients: Coordinator approval is also required</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">Current Status</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Enrollment status: Pending Approval</li>
                  <li>• Assessment status: Not available until approved</li>
                  <li>• Booking: Not available until approved</li>
                  <li>• Contact: info@icanswim209.com or (209) 778-7877 for questions</li>
                </ul>
              </div>
            </div>
          );
        } else if (isAssessment) {
          // Assessment confirmation (keep existing for now)
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Assessment Booked Successfully! 🎉</p>
                  <p className="text-sm text-muted-foreground">
                    Your assessment has been scheduled. Check your email for confirmation.
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">What happens next:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>You'll receive a confirmation email with assessment details</li>
                    <li>Our team will review and approve the assessment</li>
                    <li>Once approved, you can book regular lessons</li>
                    <li>For regional center clients: Coordinator approval is required</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Assessment Details</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 30-minute one-on-one evaluation</li>
                  <li>• Assessment of current swimming abilities</li>
                  <li>• Personalized lesson plan recommendation</li>
                  <li>• Required before starting regular swim lessons</li>
                </ul>
              </div>
            </div>
          );
        } else {
          // Regular booking confirmation using ConfirmationStep
          const sessions = sessionType === 'single' && selectedSession
            ? [selectedSession]
            : selectedRecurringSessions;

          return (
            <ConfirmationStep
              swimmer={selectedSwimmer!}
              sessions={sessions}
              sessionType={sessionType || 'single'}
              onConfirm={handleSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
              bookingResult={bookingResult || undefined}
            />
          );
        }

      default:
        return null;
    }
  };

  // Add error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('BookingWizard caught error:', event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || 'Unknown error');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-destructive rounded-lg bg-destructive/10">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Booking Wizard</h2>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        <Button
          variant="outline"
          onClick={() => {
            setHasError(false);
            setErrorMessage('');
            window.location.reload();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  try {
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main wizard card */}
        <Card className="flex-1">
          <CardHeader>
            {/* Progress bar */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {getStepNumber(currentStep)} of {getTotalSteps()}</span>
                <span>{Math.round(getProgress())}% complete</span>
              </div>
              {/* Simple progress bar since Progress component doesn't exist */}
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>

            {/* Step title */}
            <CardTitle>{getStepInfo(currentStep).title}</CardTitle>
            <CardDescription>{getStepInfo(currentStep).description}</CardDescription>
          </CardHeader>

          <CardContent>
            {/* Error alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step content */}
            <div key={currentStep} className="transition-opacity duration-200">
              {renderStep()}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 'select-swimmer' || isSubmitting || (currentStep === 'confirm' && selectedSwimmer?.enrollmentStatus !== 'waitlist')}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep === 'confirm' ? (
                selectedSwimmer?.enrollmentStatus === 'waitlist' ? (
                  // For assessments, show "Done" button
                  <Button onClick={() => resetWizard()}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                ) : (
                  // For regular bookings, ConfirmationStep has its own buttons
                  // Show empty div to maintain layout
                  <div></div>
                )
              ) : (
                <Button onClick={handleNext} disabled={!canProceed}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary sidebar - hidden on mobile */}
        <div className="hidden lg:block lg:w-80">
          <BookingSummary
            swimmer={selectedSwimmer}
            sessionType={sessionType}
            instructorName={instructorName}
            instructorPreference={instructorPreference}
            selectedSession={selectedSession}
            selectedRecurringSessions={selectedRecurringSessions}
            recurringDay={recurringDay}
            recurringTime={recurringTime}
            recurringStartDate={recurringStartDate}
            recurringEndDate={recurringEndDate}
          />
        </div>
      </div>
    );
  } catch (err) {
    console.error('BookingWizard render error:', err);
    setHasError(true);
    setErrorMessage(err instanceof Error ? err.message : 'Render error');
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-destructive rounded-lg bg-destructive/10">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Booking Wizard</h2>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </div>
    );
  }
}