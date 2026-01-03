'use client';

import { useState, useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEnrollmentForm } from './hooks/useEnrollmentForm';
import { useEnrollmentSubmit } from './hooks/useEnrollmentSubmit';
import { EnrollmentStepIndicator } from './EnrollmentStepIndicator';

// Import section components
import {
  ChildInfoSection,
  ParentInfoSection,
  MedicalSection,
  BehavioralSection,
  SwimmingBackgroundSection,
  SchedulingSection,
  ConsentSection,
} from './sections';

const STEPS = [
  { id: 1, title: 'Child Information', component: ChildInfoSection },
  { id: 2, title: 'Parent Information', component: ParentInfoSection },
  { id: 3, title: 'Medical Information', component: MedicalSection },
  { id: 4, title: 'Behavioral', component: BehavioralSection },
  { id: 5, title: 'Swimming Background', component: SwimmingBackgroundSection },
  { id: 6, title: 'Scheduling', component: SchedulingSection },
  { id: 7, title: 'Consent & Agreements', component: ConsentSection },
];

interface UnifiedEnrollmentFormProps {
  preSelectedPaymentType?: 'private_pay' | 'funding_source';
  preSelectedFundingSourceId?: string;
  onComplete?: (swimmerId: string) => void;
  redirectTo?: string;
}

export function UnifiedEnrollmentForm({
  preSelectedPaymentType,
  preSelectedFundingSourceId,
  onComplete,
  redirectTo,
}: UnifiedEnrollmentFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [queryParams, setQueryParams] = useState<{ firstName?: string; lastName?: string; dob?: string }>({});

  // Read query parameters on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const params = {
        firstName: searchParams.get('firstName') || undefined,
        lastName: searchParams.get('lastName') || undefined,
        dob: searchParams.get('dob') || undefined,
      };
      setQueryParams(params);
    }
  }, []);

  const { form, validateStep, checkAuthentication, isAuthenticated, authLoading } = useEnrollmentForm({
    preSelectedPaymentType,
    preSelectedFundingSourceId,
    queryParams,
  });

  const { mutate: submitEnrollment, isPending: isSubmitting } = useEnrollmentSubmit({
    onSuccess: onComplete,
    redirectTo,
  });

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      // Errors are automatically shown by react-hook-form
      return;
    }

    // Check if user needs to authenticate before continuing
    if (!checkAuthentication(currentStep)) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = form.handleSubmit((data) => {
    submitEnrollment(data);
  });

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading enrollment form...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="enrollment-form max-w-4xl mx-auto px-4 py-6">
          {/* Progress indicator */}
          <EnrollmentStepIndicator
            steps={STEPS}
            currentStep={currentStep}
          />

          {/* Current step content */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                {STEPS[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CurrentStepComponent />
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enrolling...' : 'Complete Enrollment'}
              </Button>
            )}
          </div>

          {/* Authentication notice */}
          {!isAuthenticated && currentStep === 1 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> You'll need to create an account or sign in before continuing to the next step.
                Your progress will be saved.
              </p>
            </div>
          )}
        </form>
      </FormProvider>
    </TooltipProvider>
  );
}