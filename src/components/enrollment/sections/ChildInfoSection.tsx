'use client';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';

export function ChildInfoSection() {
  const { control, setValue, getValues } = useFormContext<EnrollmentFormData>();
  const searchParams = useSearchParams();
   useEffect(() => {
    if (!searchParams) return;
    
    const paramFirst = searchParams.get('firstName');
    const paramLast = searchParams.get('lastName');
    const paramDob = searchParams.get('dob');
    let paramGender = searchParams.get('gender');
    const selectedFundingSourceId = searchParams.get('selectedFundingSourceId');
    const coordinatorName = searchParams.get('coordinatorName');
    const coordinatorEmail = searchParams.get('coordinatorEmail');
    const coordinatorPhone = searchParams.get('coordinatorPhone')
    
    
    

    if (paramFirst) {
      setValue('child_first_name', paramFirst, { shouldDirty: true, shouldValidate: true });
    }
    if (paramLast) {
      setValue('child_last_name', paramLast, { shouldDirty: true, shouldValidate: true });
    }
    if (paramDob ) {
      // assume incoming date is already yyyy-mm-dd; adjust if needed
      setValue('child_date_of_birth', paramDob, { shouldDirty: true, shouldValidate: true });
    }
    if (paramGender) {
      console.log(paramGender)
      setValue('child_gender', paramGender, { shouldDirty: true, shouldValidate: true });
    }
    if (selectedFundingSourceId) {
      setValue('funding_source_id', selectedFundingSourceId, { shouldDirty: true, shouldValidate: true });
    }
    if (coordinatorName) {
      setValue('funding_coordinator_name', coordinatorName, { shouldDirty: true, shouldValidate: true });
    }
    if (coordinatorEmail) {
      setValue('funding_coordinator_email', coordinatorEmail, { shouldDirty: true, shouldValidate: true });
    }
    if (coordinatorPhone) {
      setValue('funding_coordinator_phone', coordinatorPhone, { shouldDirty: true, shouldValidate: true });
    }
  // only run once on mount or when searchParams object changes
  }, [searchParams, setValue]);

  // console.log('.................', getValues('child_first_name'), getValues('child_last_name'), getValues('child_date_of_birth'), getValues('child_gender'), )
  console.log('.................', getValues('funding_coordinator_phone'), getValues('funding_coordinator_email'), getValues('funding_coordinator_name'), getValues('funding_source_id') )
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
              <Select onValueChange={field.onChange} value={field.value}>
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