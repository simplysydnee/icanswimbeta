'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';

export function ChildInfoSection() {
  const { control, setValue } = useFormContext<EnrollmentFormData>();

  // Function to format name fields on blur
  const handleNameBlur = (fieldName: 'child_first_name' | 'child_last_name') => {
    return (event: React.FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value && value.trim()) {
        import('@/lib/name-utils').then(({ formatNameField }) => {
          const formatted = formatNameField(value);
          if (formatted !== value) {
            setValue(fieldName, formatted, { shouldValidate: true });
          }
        });
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Child First Name */}
        <FormField
          control={control}
          name="child_first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Child's First Name *
                <HelpTooltip content="Enter your child's legal first name as it appears on official documents." />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="First name"
                  onBlur={handleNameBlur('child_first_name')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Child Last Name */}
        <FormField
          control={control}
          name="child_last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Child's Last Name *
                <HelpTooltip content="Enter your child's legal last name as it appears on official documents." />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Last name"
                  onBlur={handleNameBlur('child_last_name')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date of Birth */}
        <FormField
          control={control}
          name="child_date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Date of Birth *
                <HelpTooltip content="Enter your child's date of birth. We use this to determine appropriate lesson groups and ensure age-appropriate instruction." />
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  max={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gender */}
        <FormField
          control={control}
          name="child_gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Gender *
                <HelpTooltip content="This helps us with appropriate instructor assignments and facility arrangements." />
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}