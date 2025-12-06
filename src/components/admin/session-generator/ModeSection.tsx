'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SESSION_MODES, SessionMode } from '@/types/session-generator';
import { Calendar, Repeat, ClipboardCheck } from 'lucide-react';

interface ModeSectionProps {
  value: SessionMode;
  onChange: (mode: SessionMode) => void;
}

const ICONS = {
  single: Calendar,
  repeating: Repeat,
  assessment: ClipboardCheck,
};

/**
 * Mode selection section - Radio buttons for session type
 * Options: Single (Floating), Repeating (Weekly), Assessment
 */
export function ModeSection({ value, onChange }: ModeSectionProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Session Type</Label>

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as SessionMode)}
        className="grid gap-3"
      >
        {SESSION_MODES.map((mode) => {
          const Icon = ICONS[mode.value];
          const isSelected = value === mode.value;

          return (
            <label
              key={mode.value}
              className={`
                flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer
                transition-colors
                ${isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/50'
                }
              `}
            >
              <RadioGroupItem value={mode.value} className="mt-0.5" />
              <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <div className="font-medium">{mode.label}</div>
                <div className="text-sm text-muted-foreground">
                  {mode.description}
                </div>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}