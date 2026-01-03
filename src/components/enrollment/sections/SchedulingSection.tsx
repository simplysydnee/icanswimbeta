'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Label } from '@/components/ui/label';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';
import { AVAILABILITY_SLOTS } from '@/lib/constants';

export function SchedulingSection() {
  const { control, watch } = useFormContext<EnrollmentFormData>();

  const availabilitySlots = watch('availability_slots');
  const hasOtherAvailability = availabilitySlots?.includes('Other (please specify)');

  return (
    <div className="space-y-8">
      {/* Availability Slots */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Preferred availability (select at least one) *</Label>
        <p className="text-sm text-muted-foreground">
          Select all time slots when your child would be available for weekly lessons.
        </p>

        <FormField
          control={control}
          name="availability_slots"
          render={({ field }) => (
            <FormItem>
              <div className="space-y-3">
                {AVAILABILITY_SLOTS.map((slot) => (
                  <div key={slot.value} className="flex items-start space-x-2">
                    <Checkbox
                      id={`slot-${slot.value}`}
                      checked={field.value?.includes(slot.value)}
                      onCheckedChange={(checked) => {
                        const current = field.value || [];
                        if (checked) {
                          field.onChange([...current, slot.value]);
                        } else {
                          field.onChange(current.filter((v) => v !== slot.value));
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor={`slot-${slot.value}`} className="font-normal">
                        {slot.label}
                      </Label>
                      {slot.description && (
                        <p className="text-sm text-muted-foreground">{slot.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasOtherAvailability && (
          <FormField
            control={control}
            name="other_availability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please specify other availability</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Please describe any other availability or scheduling constraints..."
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Flexible Swimmer */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Flexible swimmer? *</Label>
          <HelpTooltip content="A flexible swimmer can be scheduled in different time slots each week based on instructor availability. This increases the chances of getting a regular spot." />
        </div>

        <FormField
          control={control}
          name="flexible_swimmer"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flexible-swimmer"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="flexible-swimmer" className="font-normal">
                  Yes, my child can be scheduled flexibly in different time slots
                </Label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-sm text-muted-foreground">
          Selecting this option means your child's lesson time may vary week to week based on instructor availability.
          This increases the likelihood of securing a regular spot in our program.
        </p>
      </div>
    </div>
  );
}