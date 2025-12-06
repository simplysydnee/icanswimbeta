'use client';

import { Calendar, Repeat, Check } from 'lucide-react';
import { SessionType } from '@/types/booking';
import { PRICING } from '@/lib/constants';
import { formatPrice, cn } from '@/lib/utils';

interface SessionTypeStepProps {
  selectedType: SessionType | null;
  isVmrcClient: boolean;
  onSelectType: (type: SessionType) => void;
}

export function SessionTypeStep({ selectedType, isVmrcClient, onSelectType }: SessionTypeStepProps) {
  const sessionPrice = isVmrcClient ? PRICING.VMRC_LESSON : PRICING.LESSON_PRIVATE_PAY;
  const priceDisplay = isVmrcClient ? '$0 - State Funded' : formatPrice(sessionPrice);

  const sessionTypes = [
    {
      id: 'single' as SessionType,
      title: 'Single Session',
      description: 'Book one lesson at a time',
      icon: Calendar,
      benefits: [
        'Flexible scheduling',
        'Great for trying out',
        'No commitment required',
      ],
    },
    {
      id: 'recurring' as SessionType,
      title: 'Recurring Weekly',
      description: 'Same day and time each week',
      icon: Repeat,
      benefits: [
        'Consistent schedule',
        'Guaranteed time slot',
        'Better skill progression',
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Select Session Type</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you&apos;d like to schedule lessons
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sessionTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelectType(type.id)}
              className={cn(
                'relative p-5 rounded-lg border-2 cursor-pointer transition-all text-left',
                'hover:border-primary/50 hover:bg-muted/50',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-muted bg-background'
              )}
            >
              {/* Selection indicator */}
              <div className="absolute top-3 right-3">
                <div className={cn(
                  'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted bg-background'
                )}>
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
              </div>

              {/* Icon */}
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>

              {/* Title & Description */}
              <h4 className="text-lg font-semibold mb-1">{type.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">{type.description}</p>

              {/* Benefits list */}
              <ul className="space-y-2 mb-4">
                {type.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Price footer */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium">{priceDisplay} per session</p>
              </div>
            </button>
          );
        })}
      </div>

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