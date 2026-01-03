'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Label } from '@/components/ui/label';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';
import { DIAGNOSIS_OPTIONS } from '@/lib/constants';

export function MedicalSection() {
  const { control, watch, setValue } = useFormContext<EnrollmentFormData>();

  const hasAllergies = watch('has_allergies');
  const hasMedicalConditions = watch('has_medical_conditions');

  return (
    <div className="space-y-8">
      {/* Allergies */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Does your child have any allergies? *</Label>
          <HelpTooltip content="Include food allergies, medication allergies, environmental allergies (chlorine, latex), and any allergic reactions we should be aware of." />
        </div>

        <FormField
          control={control}
          name="has_allergies"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="allergies-yes" />
                    <Label htmlFor="allergies-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="allergies-no" />
                    <Label htmlFor="allergies-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasAllergies === 'yes' && (
          <FormField
            control={control}
            name="allergies_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please describe the allergies *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe allergies, severity, and any medications or treatments..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Medical Conditions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Does your child have any medical conditions? *</Label>
          <HelpTooltip content="Include any chronic conditions, physical limitations, or medical concerns that might affect swimming ability or safety." />
        </div>

        <FormField
          control={control}
          name="has_medical_conditions"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="conditions-yes" />
                    <Label htmlFor="conditions-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="conditions-no" />
                    <Label htmlFor="conditions-no">No</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasMedicalConditions === 'yes' && (
          <FormField
            control={control}
            name="medical_conditions_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please describe the conditions *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe medical conditions, treatments, and any accommodations needed..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Diagnosis */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Diagnosis (select all that apply)</Label>
        <FormField
          control={control}
          name="diagnosis"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DIAGNOSIS_OPTIONS.map((diagnosis) => (
                  <div key={diagnosis} className="flex items-center space-x-2">
                    <Checkbox
                      id={`diagnosis-${diagnosis}`}
                      checked={field.value?.includes(diagnosis)}
                      onCheckedChange={(checked) => {
                        const current = field.value || [];
                        if (checked) {
                          field.onChange([...current, diagnosis]);
                        } else {
                          field.onChange(current.filter((v) => v !== diagnosis));
                        }
                      }}
                    />
                    <Label htmlFor={`diagnosis-${diagnosis}`}>{diagnosis}</Label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* History of Seizures */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">History of seizures? *</Label>
            <HelpTooltip content="This information is critical for water safety and emergency preparedness." />
          </div>
          <FormField
            control={control}
            name="history_of_seizures"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="seizures-yes" />
                      <Label htmlFor="seizures-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="seizures-no" />
                      <Label htmlFor="seizures-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Toilet Trained */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Toilet trained? *</Label>
            <HelpTooltip content="This helps us with appropriate facility arrangements and hygiene protocols." />
          </div>
          <FormField
            control={control}
            name="toilet_trained"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="toilet-yes" />
                      <Label htmlFor="toilet-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="toilet-no" />
                      <Label htmlFor="toilet-no">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sometimes" id="toilet-sometimes" />
                      <Label htmlFor="toilet-sometimes">Sometimes</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Non-Ambulatory */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Is your child non-ambulatory? *</Label>
          <HelpTooltip content="Non-ambulatory means unable to walk without assistance. This helps us with facility access and instructor support." />
        </div>
        <FormField
          control={control}
          name="non_ambulatory"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="ambulatory-yes" />
                    <Label htmlFor="ambulatory-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="ambulatory-no" />
                    <Label htmlFor="ambulatory-no">No</Label>
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