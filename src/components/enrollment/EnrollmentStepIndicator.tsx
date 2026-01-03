'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
}

interface EnrollmentStepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function EnrollmentStepIndicator({ steps, currentStep }: EnrollmentStepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-cyan-600 -z-10 transition-all duration-300"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center">
              {/* Step circle */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  isCompleted && 'bg-cyan-600 border-cyan-600',
                  isCurrent && 'bg-white border-cyan-600',
                  isUpcoming && 'bg-white border-gray-300'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-cyan-600',
                      isUpcoming && 'text-gray-500'
                    )}
                  >
                    {step.id}
                  </span>
                )}
              </div>

              {/* Step label */}
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center max-w-[100px]',
                  isCompleted && 'text-cyan-700',
                  isCurrent && 'text-cyan-600 font-semibold',
                  isUpcoming && 'text-gray-500'
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}