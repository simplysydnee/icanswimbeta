'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';

export function ParentInfoSection() {
  const { control } = useFormContext<EnrollmentFormData>();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parent Name */}
        <FormField
          control={control}
          name="parent_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Your Name *
                <HelpTooltip content="Enter your full legal name as it appears on official documents." />
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Full name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent Email */}
        <FormField
          control={control}
          name="parent_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Email Address *
                <HelpTooltip content="We'll use this email for all communications, including lesson confirmations, reminders, and important updates." />
              </FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="email@example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Parent Phone */}
      <FormField
        control={control}
        name="parent_phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Phone Number *
              <HelpTooltip content="We'll use this number for urgent communications and emergency contact." />
            </FormLabel>
            <FormControl>
              <Input {...field} placeholder="(123) 456-7890" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Parent Address */}
      <FormField
        control={control}
        name="parent_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Street Address *
              <HelpTooltip content="Your complete street address for billing and communication purposes." />
            </FormLabel>
            <FormControl>
              <Input {...field} placeholder="123 Main St" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Parent City */}
        <FormField
          control={control}
          name="parent_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                City *
                <HelpTooltip content="Your city of residence." />
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="City" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent State */}
        <FormField
          control={control}
          name="parent_state"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                State *
                <HelpTooltip content="Your state of residence." />
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="State" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent ZIP */}
        <FormField
          control={control}
          name="parent_zip"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                ZIP Code *
                <HelpTooltip content="Your postal/ZIP code." />
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="12345" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}