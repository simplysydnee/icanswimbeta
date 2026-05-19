'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { SwimSkillsStep } from './steps/SwimSkillsStep';
import { RoadblocksStep } from './steps/RoadblocksStep';
import { GoalsStep } from './steps/GoalsStep';
import { NotesStep } from './steps/NotesStep';
import { ApprovalStep } from './steps/ApprovalStep';
import { Progress } from '@/components/ui/progress';

const STEPS = [
  { id: 'basic', title: 'Basic Info' },
  { id: 'skills', title: 'Swim Skills' },
  { id: 'roadblocks', title: 'Roadblocks' },
  { id: 'goals', title: 'Goals' },
  { id: 'notes', title: 'Notes' },
  { id: 'approval', title: 'Approval' },
];

export interface AssessmentData {
  // Basic Info
  swimmerId: string;
  swimmerName?: string;
  bookingId: string;
  sessionId: string;
  instructor: string;
  assessmentDate: Date;
  strengths: string;
  challenges: string;

  // Swim Skills
  swimSkills: Record<string, 'emerging' | 'na' | 'no' | 'yes'>;

  // Roadblocks
  roadblocks: Record<string, { needsAddressing: boolean; intervention: string }>;

  // Goals
  swimSkillsGoals: string;
  safetyGoals: string;

  // Notes (Step 5)
  lessonDate: string;
  attendanceStatus: 'present' | 'absent' | 'late';
  lessonSummary: string;
  swimmerMood: 'happy' | 'neutral' | 'frustrated' | 'tired' | '';
  waterComfort: 'comfortable' | 'cautious' | 'anxious' | '';
  instructorNotesPrivate: string;
  parentNotes: string;
  sharedWithParent: boolean;

  // Approval
  approvalStatus: 'approved' | 'dropped' | '';

  // Important Safety Notes
  importantNotesText: string;

  // Swim Level & Priority
  swimLevelId?: string;
  isPriorityBooking?: boolean;
}

interface AssessmentWizardProps {
  onSubmit: (data: AssessmentData) => Promise<void>;
  initialData?: Partial<AssessmentData>;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function AssessmentWizard({ onSubmit, initialData }: AssessmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [data, setData] = useState<AssessmentData>(() => ({
    swimmerId: '',
    bookingId: '',
    sessionId: '',
    instructor: '',
    assessmentDate: new Date(),
    strengths: '',
    challenges: '',
    swimSkills: {},
    roadblocks: {},
    swimSkillsGoals: '',
    safetyGoals: '',
    lessonDate: format(new Date(), 'yyyy-MM-dd'),
    attendanceStatus: 'present',
    lessonSummary: '',
    swimmerMood: '',
    waterComfort: '',
    instructorNotesPrivate: '',
    parentNotes: '',
    sharedWithParent: false,
    approvalStatus: '',
    importantNotesText: '',
    swimLevelId: undefined,
    isPriorityBooking: false,
    ...initialData,
  }));

  const handleDataChange = useCallback((newData: Partial<AssessmentData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  // Hydrate the wizard from a server-side draft (called by Step 1 after the
  // swimmer is selected). Splat the persisted fields onto the existing state
  // so locally-typed values that arrived between selection and fetch aren't
  // lost.
  const handleHydrate = useCallback((draft: Partial<AssessmentData>) => {
    setData((prev) => ({ ...prev, ...draft }));
  }, []);

  const persistDraft = useCallback(
    async (latest: AssessmentData) => {
      // Saves require at least swimmer/booking/date — no point hitting the
      // server before Step 1 has been completed.
      if (!latest.swimmerId || !latest.bookingId || !latest.assessmentDate) {
        return;
      }
      try {
        setSaveStatus('saving');
        setSaveError(null);
        const response = await fetch('/api/assessments/wizard/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latest),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          const detail =
            err?.details || err?.error || `Save failed (${response.status})`;
          throw new Error(detail);
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to persist wizard draft:', err);
        setSaveStatus('error');
        setSaveError(err instanceof Error ? err.message : 'Failed to save');
      }
    },
    []
  );

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      await persistDraft(data);
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = async () => {
    if (currentStep > 0) {
      await persistDraft(data);
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCurrentStep = () => {
    const step = STEPS[currentStep];

    if (step.id === 'basic') {
      return (
        !!data.swimmerId &&
        !!data.bookingId &&
        !!data.sessionId &&
        !!data.instructor &&
        !!data.assessmentDate &&
        data.strengths.trim().length > 0 &&
        data.challenges.trim().length > 0
      );
    }

    if (step.id === 'approval') {
      return data.approvalStatus !== '';
    }

    return true;
  };

  const canProceed = validateCurrentStep();
  const isLastStep = currentStep === STEPS.length - 1;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
          </div>
          <div className="text-sm text-muted-foreground">
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'Draft saved'}
            {saveStatus === 'error' && (
              <span className="text-red-600">Couldn't save draft</span>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`flex flex-col items-center ${index <= currentStep ? 'text-cyan-600' : 'text-gray-400'}`}
          >
            <div
              className={`
                h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index < currentStep ? 'bg-cyan-100' : ''}
                ${index === currentStep ? 'bg-cyan-600 text-white' : ''}
                ${index > currentStep ? 'bg-gray-100' : ''}
              `}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            <div className="text-xs mt-1 text-center">{step.title}</div>
          </div>
        ))}
      </div>

      {saveStatus === 'error' && saveError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <span className="font-medium">Draft save failed:</span> {saveError}.
            You can keep working — your inputs are kept locally and we'll retry
            on the next step.
          </p>
        </div>
      )}

      {/* Current Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <BasicInfoStep
              data={{
                swimmerId: data.swimmerId,
                swimmerName: data.swimmerName,
                bookingId: data.bookingId,
                sessionId: data.sessionId,
                instructor: data.instructor,
                assessmentDate: data.assessmentDate,
                strengths: data.strengths,
                challenges: data.challenges,
              }}
              onChange={handleDataChange}
              onHydrate={handleHydrate}
            />
          )}

          {currentStep === 1 && (
            <SwimSkillsStep
              data={data.swimSkills}
              onChange={(swimSkills) => handleDataChange({ swimSkills })}
            />
          )}

          {currentStep === 2 && (
            <RoadblocksStep
              data={data.roadblocks}
              onChange={(roadblocks) => handleDataChange({ roadblocks })}
            />
          )}

          {currentStep === 3 && (
            <GoalsStep
              data={{
                swimSkillsGoals: data.swimSkillsGoals,
                safetyGoals: data.safetyGoals,
              }}
              onChange={handleDataChange}
            />
          )}

          {currentStep === 4 && (
            <NotesStep
              data={{
                lessonDate: data.lessonDate,
                attendanceStatus: data.attendanceStatus,
                lessonSummary: data.lessonSummary,
                swimmerMood: data.swimmerMood,
                waterComfort: data.waterComfort,
                instructorNotesPrivate: data.instructorNotesPrivate,
                parentNotes: data.parentNotes,
                sharedWithParent: data.sharedWithParent,
              }}
              onChange={handleDataChange}
            />
          )}

          {currentStep === 5 && (
            <ApprovalStep
              data={data}
              onChange={(approvalData) => handleDataChange(approvalData)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {!isLastStep && (
        <div className="flex justify-between">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={currentStep === 0 || saveStatus === 'saving'}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed || saveStatus === 'saving'}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Mobile-friendly bottom navigation for last step */}
      {isLastStep && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:relative md:border-0 md:p-0">
          <div className="flex gap-3">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1"
              size="lg"
              disabled={saveStatus === 'saving'}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {!canProceed && !isLastStep && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 text-center">
            Please complete all required fields before proceeding
          </p>
        </div>
      )}

      {/* Tips for each step */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Tips for this step:</h4>
        {currentStep === 0 && (
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Select the swimmer whose assessment you're completing &mdash; the list shows only swimmers with a scheduled assessment</li>
            <li>• Instructor and date are auto-filled from the assessment booking</li>
            <li>• Be specific about strengths and challenges &mdash; parents will see this</li>
            <li>• Use positive, constructive language</li>
          </ul>
        )}
        {currentStep === 1 && (
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• "Emerging Skill" means they're starting to learn it</li>
            <li>• "N/A" means this skill isn't appropriate for their level/age</li>
            <li>• Be honest about current abilities</li>
            <li>• Focus on foundational skills first</li>
          </ul>
        )}
        {currentStep === 2 && (
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Only mark "Needs to be addressed" for significant roadblocks</li>
            <li>• Provide specific, actionable intervention strategies</li>
            <li>• Consider the swimmer's unique needs and abilities</li>
            <li>• Think about what would help most in the next 4-8 lessons</li>
          </ul>
        )}
        {currentStep === 3 && (
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Set 2-3 achievable swim skills goals</li>
            <li>• Include at least 1 safety goal</li>
            <li>• Make goals specific and measurable</li>
            <li>• Consider what can be achieved in 4-8 lessons</li>
          </ul>
        )}
        {currentStep === 4 && (
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• All fields are optional &mdash; leave the step blank to skip creating a progress note</li>
            <li>• "Share with parent" must be checked for the parent notes to be visible to family</li>
            <li>• Instructor notes are private and only visible to staff</li>
            <li>• A progress note is only saved if you fill at least one field</li>
          </ul>
        )}
        {currentStep === 5 && (
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Review all information carefully before submitting</li>
            <li>• "Approved" enrolls swimmer in regular lessons</li>
            <li>• "Dropped" keeps swimmer on waitlist</li>
            <li>• Once submitted, assessment cannot be edited</li>
          </ul>
        )}
      </div>
    </div>
  );
}
