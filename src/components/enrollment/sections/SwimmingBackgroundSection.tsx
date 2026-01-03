'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Label } from '@/components/ui/label';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';
import { SWIM_GOALS } from '@/lib/constants';

export function SwimmingBackgroundSection() {
  const { control, watch } = useFormContext<EnrollmentFormData>();

  const hasPreviousSwimLessons = watch('previous_swim_lessons');

  return (
    <div className="space-y-8">
      {/* Previous Swim Lessons */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Previous swim lessons? *</Label>
          <HelpTooltip content="Has your child taken swimming lessons before, either with us or another program?" />
        </div>

        <FormField
          control={control}
          name="previous_swim_lessons"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="lessons-yes" />
                    <Label htmlFor="lessons-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="lessons-no" />
                    <Label htmlFor="lessons-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasPreviousSwimLessons === 'yes' && (
          <FormField
            control={control}
            name="previous_swim_experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please describe previous swim experience</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Where did they take lessons? What did they learn? How long ago?"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Comfort Level in Water */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Comfort level in water? *</Label>
          <HelpTooltip content="How comfortable is your child in and around water? This helps us determine the appropriate starting point." />
        </div>

        <FormField
          control={control}
          name="comfortable_in_water"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very" id="comfort-very" />
                    <Label htmlFor="comfort-very" className="font-normal">
                      Very comfortable - Enjoys water, puts face in, can float with assistance
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="somewhat" id="comfort-somewhat" />
                    <Label htmlFor="comfort-somewhat" className="font-normal">
                      Somewhat comfortable - Okay with water but hesitant, needs reassurance
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_at_all" id="comfort-not" />
                    <Label htmlFor="comfort-not" className="font-normal">
                      Not at all comfortable - Fearful of water, needs gradual introduction
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Swim Goals */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Swim goals (select at least one) *</Label>
        <FormField
          control={control}
          name="swim_goals"
          render={({ field }) => (
            <FormItem>
              <div className="space-y-3">
                {SWIM_GOALS.map((goal) => (
                  <div key={goal.value} className="flex items-start space-x-2">
                    <Checkbox
                      id={`goal-${goal.value}`}
                      checked={field.value?.includes(goal.value)}
                      onCheckedChange={(checked) => {
                        const current = field.value || [];
                        if (checked) {
                          field.onChange([...current, goal.value]);
                        } else {
                          field.onChange(current.filter((v) => v !== goal.value));
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor={`goal-${goal.value}`} className="font-normal">
                        {goal.label}
                      </Label>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}