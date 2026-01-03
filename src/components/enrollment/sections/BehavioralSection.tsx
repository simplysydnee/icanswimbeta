'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Label } from '@/components/ui/label';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';

export function BehavioralSection() {
  const { control, watch } = useFormContext<EnrollmentFormData>();

  const hasSelfInjuriousBehavior = watch('self_injurious_behavior');
  const hasAggressiveBehavior = watch('aggressive_behavior');
  const hasElopementHistory = watch('elopement_history');

  return (
    <div className="space-y-8">
      {/* Self-Injurious Behavior */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Self-injurious behavior? *</Label>
          <HelpTooltip content="Includes head-banging, biting self, scratching self, or any behavior that causes self-harm." />
        </div>

        <FormField
          control={control}
          name="self_injurious_behavior"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="self-injurious-yes" />
                    <Label htmlFor="self-injurious-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="self-injurious-no" />
                    <Label htmlFor="self-injurious-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasSelfInjuriousBehavior === 'yes' && (
          <FormField
            control={control}
            name="self_injurious_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please describe the behavior *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe the behavior, triggers, and any de-escalation techniques..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Aggressive Behavior */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Aggressive behavior toward others? *</Label>
          <HelpTooltip content="Includes hitting, biting, kicking, throwing objects, or any behavior that could harm others." />
        </div>

        <FormField
          control={control}
          name="aggressive_behavior"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="aggressive-yes" />
                    <Label htmlFor="aggressive-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="aggressive-no" />
                    <Label htmlFor="aggressive-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasAggressiveBehavior === 'yes' && (
          <FormField
            control={control}
            name="aggressive_behavior_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please describe the behavior *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe the behavior, triggers, and any de-escalation techniques..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Elopement History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">History of elopement (wandering/running away)? *</Label>
          <HelpTooltip content="Elopement refers to leaving a safe area without supervision, which is a serious safety concern around water." />
        </div>

        <FormField
          control={control}
          name="elopement_history"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="elopement-yes" />
                    <Label htmlFor="elopement-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="elopement-no" />
                    <Label htmlFor="elopement-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasElopementHistory === 'yes' && (
          <FormField
            control={control}
            name="elopement_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please describe the history *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe when it happens, triggers, and any strategies that help..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Behavior Plan */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Does your child have a formal behavior plan? *</Label>
          <HelpTooltip content="A formal behavior plan created by a therapist, school, or behavior specialist." />
        </div>

        <FormField
          control={control}
          name="has_behavior_plan"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="plan-yes" />
                    <Label htmlFor="plan-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="plan-no" />
                    <Label htmlFor="plan-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}