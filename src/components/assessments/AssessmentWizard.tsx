'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { SwimSkillsStep } from './steps/SwimSkillsStep';
import { RoadblocksStep } from './steps/RoadblocksStep';
import { GoalsStep } from './steps/GoalsStep';
import { ApprovalStep } from './steps/ApprovalStep';
import { Progress } from '@/components/ui/progress';

const STEPS = [
  { id: 'basic', title: 'Basic Info', component: BasicInfoStep },
  { id: 'skills', title: 'Swim Skills', component: SwimSkillsStep },
  { id: 'roadblocks', title: 'Roadblocks', component: RoadblocksStep },
  { id: 'goals', title: 'Goals', component: GoalsStep },
  { id: 'approval', title: 'Approval', component: ApprovalStep },
];

interface AssessmentData {
  // Basic Info
  swimmerId: string;
  swimmerName?: string;
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

  // Approval
  approvalStatus: 'approved' | 'dropped' | '';
}

interface AssessmentWizardProps {
  onSubmit: (data: AssessmentData) => Promise<void>;
  initialData?: Partial<AssessmentData>;
}

export function AssessmentWizard({ onSubmit, initialData }: AssessmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Initialize data with defaults
  const [data, setData] = useState<AssessmentData>(() => ({
    swimmerId: '',
    instructor: '',
    assessmentDate: new Date(),
    strengths: '',
    challenges: '',
    swimSkills: {},
    roadblocks: {},
    swimSkillsGoals: '',
    safetyGoals: '',
    approvalStatus: '',
    ...initialData,
  }));

  // Auto-save to localStorage
  useEffect(() => {
    const saveToStorage = () => {
      try {
        localStorage.setItem('assessment_wizard_draft', JSON.stringify({
          data,
          currentStep,
          timestamp: new Date().toISOString(),
        }));
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    };

    const timer = setTimeout(saveToStorage, 1000);
    return () => clearTimeout(timer);
  }, [data, currentStep]);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('assessment_wizard_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        // Only load if draft is less than 24 hours old
        const draftTime = new Date(parsed.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - draftTime.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          setData(parsed.data);
          setCurrentStep(parsed.currentStep);
          setSaveStatus('saved');
        } else {
          localStorage.removeItem('assessment_wizard_draft');
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);

  const handleDataChange = useCallback((newData: Partial<AssessmentData>) => {
    setData(prev => ({ ...prev, ...newData }));
    setSaveStatus('saving');
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Scroll to top on step change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      // Scroll to top on step change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      // Clear draft on successful submit
      localStorage.removeItem('assessment_wizard_draft');
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
        data.swimmerId &&
        data.instructor &&
        data.assessmentDate &&
        data.strengths.trim() &&
        data.challenges.trim()
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

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
          </div>
          <div className="text-sm text-muted-foreground">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Draft saved'}
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

      {/* Current Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <BasicInfoStep
              data={{
                swimmerId: data.swimmerId,
                instructor: data.instructor,
                assessmentDate: data.assessmentDate,
                strengths: data.strengths,
                challenges: data.challenges,
              }}
              onChange={handleDataChange}
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
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
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
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => {
                // Save draft button
                setSaveStatus('saving');
                setTimeout(() => setSaveStatus('saved'), 500);
              }}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {!canProceed && currentStep !== 4 && (
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
            <li>• Select the correct swimmer from today's scheduled assessments</li>
            <li>• Choose the instructor who conducted the assessment</li>
            <li>• Be specific about strengths and challenges - parents will see this</li>
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