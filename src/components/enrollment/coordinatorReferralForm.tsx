'use client';

import { useState } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { EnrollmentStepIndicator } from './EnrollmentStepIndicator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  coordinatorReferralSchema,
  coordinatorReferralStep1Fields,
  type CoordinatorReferralFormValues,
} from './schemas/coordinatorReferralSchema';

const STEPS = [
  { id: 1, title: 'Child' },
  { id: 2, title: 'Parent / guardian' },
];

function useFormContextCoordinated() {
  return useFormContext<CoordinatorReferralFormValues>();
}

const defaultValues: CoordinatorReferralFormValues = {
  child_first_name: '',
  child_last_name: '',
  child_date_of_birth: '',
  child_gender: 'male',
  parent_name: '',
  parent_email: '',
  parent_phone: '',
  parent_address: '',
  parent_city: '',
  parent_state: '',
  parent_zip: '',
};

function CoordinatorReferralChildStep() {
  const { control, setValue } = useFormContextCoordinated();

  const handleNameBlur = (fieldName: 'child_first_name' | 'child_last_name') => {
    return (event: React.FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value?.trim()) {
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
        <FormField
          control={control}
          name="child_first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Child&apos;s first name *
                <HelpTooltip content="Legal first name as it appears on official documents." />
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="First name" onBlur={handleNameBlur('child_first_name')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="child_last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Child&apos;s last name *
                <HelpTooltip content="Legal last name as it appears on official documents." />
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Last name" onBlur={handleNameBlur('child_last_name')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="child_date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Date of birth *
                <HelpTooltip content="Used for grouping and age-appropriate instruction." />
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} max={new Date().toISOString().split('T')[0]} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="child_gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Gender *
                <HelpTooltip content="Helps with instructor and facility planning." />
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

function CoordinatorReferralParentStep() {
  const { control } = useFormContextCoordinated();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="parent_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Parent / guardian full name *
                <HelpTooltip content="Full name for records and communication." />
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Full name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="parent_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Email *
                <HelpTooltip content="We use this for portal access and updates." />
              </FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="email@example.com" autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="parent_phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Phone *
              <HelpTooltip content="For urgent contact and enrollment follow-up." />
            </FormLabel>
            <FormControl>
              <Input {...field} type="tel" placeholder="(555) 123-4567" autoComplete="tel" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="parent_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Street address *
              <HelpTooltip content="Mailing and service address." />
            </FormLabel>
            <FormControl>
              <Input {...field} placeholder="123 Main St" autoComplete="street-address" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField
          control={control}
          name="parent_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="City" autoComplete="address-level2" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="parent_state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="CA" maxLength={2} className="uppercase" autoComplete="address-level1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="parent_zip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ZIP *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="95350" autoComplete="postal-code" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function CoordinatorReferralForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CoordinatorReferralFormValues>({
    resolver: zodResolver(coordinatorReferralSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const handleNext = async () => {
    if (currentStep !== 1) return;
    const valid = await form.trigger([...coordinatorReferralStep1Fields], { shouldFocus: true });
    if (!valid) return;
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: CoordinatorReferralFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/coordinator/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          parent_state: data.parent_state.trim().toUpperCase(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof json?.error === 'string'
            ? json.error
            : json?.details?.[0]?.message || 'Something went wrong. Please try again.';
        toast({ title: 'Could not submit referral', description: msg, variant: 'destructive' });
        return;
      }
      toast({ title: 'Referral submitted successfully' });
      router.push('/coordinator/referrals');
    } catch {
      toast({
        title: 'Could not submit referral',
        description: 'Network error. Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = form.handleSubmit(onSubmit);

  return (
    <TooltipProvider delayDuration={0}>
      <FormProvider {...form}>
        <form onSubmit={handleFinalSubmit} className="enrollment-form max-w-4xl mx-auto px-4 py-6">
          <EnrollmentStepIndicator steps={STEPS} currentStep={currentStep} />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                {currentStep === 1 ? 'Child information' : 'Parent / guardian information'}
              </CardTitle>
            </CardHeader>
            <CardContent>{currentStep === 1 ? <CoordinatorReferralChildStep /> : <CoordinatorReferralParentStep />}</CardContent>
          </Card>

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 1 || isSubmitting}>
              Back
            </Button>
            {currentStep < STEPS.length ? (
              <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit referral'
                )}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </TooltipProvider>
  );
}
