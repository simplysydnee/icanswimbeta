'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Droplets, CheckCircle, XCircle, HelpCircle, MinusCircle } from 'lucide-react';

interface SwimSkillsStepProps {
  data: Record<string, 'emerging' | 'na' | 'no' | 'yes'>;
  onChange: (skills: Record<string, 'emerging' | 'na' | 'no' | 'yes'>) => void;
}

const SWIM_SKILLS = [
  { id: 'walks_in_water', label: 'Walks in water' },
  { id: 'swims_with_equipment', label: 'Swims with equipment' },
  { id: 'swims_with_pdf', label: 'Swims with approved PDF' },
  { id: 'swims_with_floaties', label: 'Swims with floaties' },
  { id: 'front_float', label: 'Front float' },
  { id: 'back_float', label: 'Back float' },
  { id: 'changing_directions', label: 'Changing directions' },
  { id: 'rollovers', label: 'Rollovers' },
  { id: 'blow_bubbles', label: 'Blow bubbles' },
  { id: 'submerging', label: 'Submerging' },
  { id: 'jumping_in', label: 'Jumping in' },
  { id: 'side_breathing', label: 'Side breathing' },
  { id: 'streamline', label: 'Streamline' },
  { id: 'front_crawl', label: 'Front crawl/freestyle' },
  { id: 'back_crawl', label: 'Back crawl/freestyle' },
  { id: 'elementary_backstroke', label: 'Elementary backstroke' },
  { id: 'breaststroke', label: 'Breaststroke' },
  { id: 'butterfly', label: 'Butterfly' },
  { id: 'side_stroke', label: 'Side stroke' },
  { id: 'sculling', label: 'Sculling' },
  { id: 'treading_water', label: 'Treading water' },
  { id: 'survival_float', label: 'Survival float' },
  { id: 'enters_safely', label: 'Enters safely' },
  { id: 'exits_safely', label: 'Exits safely' },
];

const SKILL_OPTIONS = [
  { value: 'emerging', label: 'Emerging Skill', icon: HelpCircle, color: 'text-amber-500' },
  { value: 'na', label: 'N/A', icon: MinusCircle, color: 'text-gray-500' },
  { value: 'no', label: 'No', icon: XCircle, color: 'text-red-500' },
  { value: 'yes', label: 'Yes', icon: CheckCircle, color: 'text-green-500' },
];

export function SwimSkillsStep({ data, onChange }: SwimSkillsStepProps) {
  const handleSkillChange = (skillId: string, value: 'emerging' | 'na' | 'no' | 'yes') => {
    onChange({
      ...data,
      [skillId]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-cyan-600" />
          <Label className="text-lg font-semibold">Swim Skills Assessment</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Rate each swim skill. Select "Emerging Skill" if they're starting to learn it,
          "N/A" if not applicable, "No" if they cannot do it, or "Yes" if they can do it.
        </p>
      </div>

      {/* Skill Options Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {SKILL_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <div
              key={option.value}
              className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50"
            >
              <Icon className={`h-5 w-5 ${option.color}`} />
              <div>
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground capitalize">{option.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skills Grid */}
      <div className="space-y-6">
        {SWIM_SKILLS.map((skill) => (
          <div key={skill.id} className="border rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="md:w-1/3">
                <Label className="font-medium text-sm md:text-base">
                  {skill.label}
                </Label>
              </div>
              <div className="md:w-2/3">
                <RadioGroup
                  value={data[skill.id] || 'na'}
                  onValueChange={(value: 'emerging' | 'na' | 'no' | 'yes') =>
                    handleSkillChange(skill.id, value)
                  }
                  className="flex flex-wrap gap-3"
                >
                  {SKILL_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option.value}
                          id={`${skill.id}-${option.value}`}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={`${skill.id}-${option.value}`}
                          className={`
                            flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer
                            transition-colors hover:bg-gray-50
                            ${data[skill.id] === option.value
                              ? 'border-cyan-500 bg-cyan-50'
                              : 'border-gray-200'
                            }
                          `}
                        >
                          <Icon className={`h-4 w-4 ${option.color}`} />
                          <span className="text-sm">{option.label}</span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {Object.values(data).filter(v => v === 'yes').length}
          </div>
          <div className="text-sm text-muted-foreground">Yes</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {Object.values(data).filter(v => v === 'emerging').length}
          </div>
          <div className="text-sm text-muted-foreground">Emerging</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {Object.values(data).filter(v => v === 'no').length}
          </div>
          <div className="text-sm text-muted-foreground">No</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {Object.values(data).filter(v => v === 'na').length}
          </div>
          <div className="text-sm text-muted-foreground">N/A</div>
        </div>
      </div>
    </div>
  );
}