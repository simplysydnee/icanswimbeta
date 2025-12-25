'use client';

import { Calendar, Repeat, Check, AlertCircle } from 'lucide-react';
import { SessionType } from '@/types/booking';
import { PRICING } from '@/lib/constants';
import { formatPrice, cn, canBookRegularLessons, needsAssessment as needsAssessmentCheck, isPendingApproval } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SessionTypeStepProps {
  selectedType: SessionType | null;
  paymentType?: string; // 'private_pay', 'funded', 'scholarship', 'other'
  fundingSourceName?: string; // Name of funding source (e.g., "Valley Mountain Regional Center")
  isFlexibleSwimmer: boolean; // Add flexible swimmer status
  enrollmentStatus?: string; // 'waitlist', 'enrolled', 'assessment_only', etc.
  assessmentStatus?: string | null; // 'not_started', 'scheduled', 'completed', etc.
  onSelectType: (type: SessionType) => void;
}

export function SessionTypeStep({ selectedType, paymentType, fundingSourceName, isFlexibleSwimmer, enrollmentStatus, assessmentStatus, onSelectType }: SessionTypeStepProps) {
  const isFunded = paymentType === 'funded' || paymentType === 'scholarship' || !!fundingSourceName;
  // Check swimmer status using utility functions
  const swimmer = enrollmentStatus && assessmentStatus ? {
    enrollmentStatus: enrollmentStatus as 'waitlist' | 'pending_enrollment' | 'enrolled' | 'inactive',
    assessmentStatus
  } : null;

  const isWaitlist = enrollmentStatus === 'waitlist';
  const canBookRegular = swimmer ? canBookRegularLessons(swimmer as any) : false;
  const swimmerNeedsAssessment = swimmer ? needsAssessmentCheck(swimmer as any) : false;
  const isPending = swimmer ? isPendingApproval(swimmer as any) : false;

  // Use assessment price for waitlist swimmers, otherwise use regular lesson price
  const sessionPrice = isWaitlist
    ? PRICING.ASSESSMENT
    : (isFunded ? PRICING.FUNDING_SOURCE_LESSON : PRICING.LESSON_PRIVATE_PAY);

  // Get funding source display name
  const getFundingSourceName = () => {
    if (fundingSourceName) return fundingSourceName;
    if (paymentType === 'funded') return 'Funding Source';
    if (paymentType === 'scholarship') return 'Scholarship';
    if (paymentType === 'other') return 'Other Funding';
    return 'Private Pay';
  };

  const priceDisplay = isWaitlist
    ? formatPrice(sessionPrice) // Show actual price for assessments
    : (isFunded
      ? `Covered by ${getFundingSourceName()}`
      : formatPrice(sessionPrice));

  // Determine which session types to show based on swimmer status
  const sessionTypes = [];

  // Waitlist swimmers or those needing assessment ONLY see assessment option
  if (isWaitlist || swimmerNeedsAssessment) {
    sessionTypes.push({
      id: 'single' as SessionType,
      title: 'Initial Assessment',
      description: 'Complete an assessment session to determine swimmer level and goals',
      icon: Calendar,
      benefits: [
        '30-minute evaluation session',
        'Skill level assessment',
        'Goal setting with instructor',
        'Required before regular lessons',
      ],
      note: 'Required for all new swimmers on waitlist',
      disabled: false,
    });
  }

  // Enrolled swimmers who can book regular lessons see all options
  if (canBookRegular) {
    sessionTypes.push(
      {
        id: 'single' as SessionType,
        title: 'Single Lesson',
        description: 'Book a one-time floating session (canceled slots made available)',
        icon: Calendar,
        benefits: [
          'Canceled weekly slots released back',
          'Flexible scheduling',
          'Great for trying out',
          'No commitment required',
        ],
        note: 'Available to all enrolled swimmers',
        disabled: false,
      },
      {
        id: 'recurring' as SessionType,
        title: 'Weekly Recurring',
        description: 'Book the same time slot every week',
        icon: Repeat,
        benefits: [
          'Consistent schedule',
          'Guaranteed time slot',
          'Better skill progression',
        ],
        note: 'For enrolled swimmers with active status',
        disabled: isFlexibleSwimmer, // Disabled only for flexible swimmers
      }
    );
  }

  // Show appropriate message if no session types available
  if (sessionTypes.length === 0) {
    if (isPending) {
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Booking Not Available</h3>
            <p className="text-sm text-muted-foreground">
              This swimmer is awaiting approval
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Pending Approval</AlertTitle>
            <AlertDescription>
              This swimmer is awaiting admin approval. You'll be notified when booking is available.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Booking Not Available</h3>
          <p className="text-sm text-muted-foreground">
            Unable to determine booking options for this swimmer
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Booking Error</AlertTitle>
          <AlertDescription>
            Unable to determine booking options for this swimmer's status. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Select Session Type</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you&apos;d like to schedule lessons
        </p>
      </div>

      <RadioGroup
        value={selectedType || ''}
        onValueChange={(value) => onSelectType(value as SessionType)}
        className="space-y-4"
      >
        {sessionTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;

          return (
            <div
              key={type.id}
              className={cn(
                'relative p-5 rounded-lg border-2 transition-all text-left cursor-pointer',
                'hover:border-primary/50 hover:bg-muted/50',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-muted bg-background',
                type.disabled && 'opacity-60 cursor-not-allowed hover:border-muted hover:bg-background'
              )}
              onClick={() => !type.disabled && onSelectType(type.id)}
            >
              {/* Radio button */}
              <div className="absolute top-3 right-3">
                <RadioGroupItem
                  value={type.id}
                  id={type.id}
                  disabled={type.disabled}
                  className={cn(
                    'h-5 w-5',
                    type.disabled && 'cursor-not-allowed'
                  )}
                />
              </div>

              {/* Icon */}
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>

              {/* Title & Description */}
              <Label
                htmlFor={type.id}
                className={cn(
                  'text-lg font-semibold mb-1 block',
                  type.disabled && 'text-muted-foreground cursor-not-allowed'
                )}
              >
                {type.title}
              </Label>
              <p className="text-sm text-muted-foreground mb-4">{type.description}</p>

              {/* Benefits list */}
              <ul className="space-y-2 mb-3">
                {type.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Flexible swimmer warning for recurring */}
              {type.id === 'recurring' && type.disabled && (
                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">⚠️ Not available - Flexible swimmers can only book single lessons</p>
                      <p>Flexible swimmers can only book single lessons (floating sessions). Please select Single Lesson option.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Note for non-disabled options */}
              {type.note && !type.disabled && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  {type.note}
                </div>
              )}

              {/* Price footer */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium">{priceDisplay} per session</p>
              </div>
            </div>
          );
        })}
      </RadioGroup>

      {/* Flexible swimmer info box */}
      {isFlexibleSwimmer && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-amber-800">Flexible Swimmer Status</h4>
              <p className="text-sm text-amber-700">
                Your swimmer has flexible status due to a late cancellation. Flexible swimmers can ONLY book single lessons (floating sessions) and cannot book weekly recurring sessions.
              </p>
              <p className="text-xs text-amber-600 mt-2">
                To regain weekly recurring booking privileges, please contact the office.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist info box */}
      {isWaitlist && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-800">Waitlist Status - Assessment Required</h4>
              <p className="text-sm text-blue-700">
                Your swimmer is on the waitlist. Before booking regular lessons, you must complete an initial assessment session.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                The assessment helps our instructors understand your swimmer's needs, skill level, and goals to provide the best instruction.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tip box */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div className="space-y-1">
            <h4 className="font-medium">Tip</h4>
            <p className="text-sm text-muted-foreground">
              Weekly recurring sessions provide the best learning outcomes for swimmers with special needs.
              Consistency helps build trust with instructors and reinforces skills week over week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}