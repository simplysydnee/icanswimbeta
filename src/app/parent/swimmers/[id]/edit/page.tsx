'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useToast } from '@/hooks/use-toast';
import { MedicalSection } from '@/components/enrollment/sections/MedicalSection';
import { BehavioralSection } from '@/components/enrollment/sections/BehavioralSection';
import { FundamentalInformationSection } from '@/components/enrollment/sections/FundamentalInformationSection';
import { SwimmingBackgroundSection } from '@/components/enrollment/sections/SwimmingBackgroundSection';
import { SchedulingSection } from '@/components/enrollment/sections/SchedulingSection';

type YesNo = 'yes' | 'no' | undefined;

const boolToYesNo = (v: unknown): YesNo => {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  return undefined;
};

const yesNoToBool = (v: unknown): boolean | null => {
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return null;
};

interface EditFormState {
  // Demographics (form keys mirror enrollment schema)
  child_first_name: string;
  child_last_name: string;
  child_date_of_birth: string;
  child_gender: string;
  // Medical
  has_allergies: YesNo;
  allergies_description: string;
  has_medical_conditions: YesNo;
  medical_conditions_description: string;
  diagnosis: string[];
  history_of_seizures: YesNo;
  toilet_trained: 'yes' | 'no' | 'sometimes' | undefined;
  non_ambulatory: YesNo;
  // Behavioral (form uses short keys)
  self_injurious_behavior: YesNo;
  self_injurious_description: string;
  aggressive_behavior: YesNo;
  aggressive_behavior_description: string;
  elopement_history: YesNo;
  elopement_description: string;
  has_behavior_plan: YesNo;
  // Fundamental
  communication_type: 'verbal' | 'non_verbal' | 'other' | '';
  strengths_interests: string;
  motivators: string;
  other_therapies: YesNo;
  therapies_description: string;
  // Swim background
  previous_swim_lessons: YesNo;
  previous_swim_experience: string;
  comfortable_in_water: 'very' | 'somewhat' | 'not_at_all' | '';
  swim_goals: string[];
  // Scheduling
  availability: string[];
  other_availability: string;
  flexible_swimmer: boolean;
  // Emergency contact
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

const dbToForm = (s: any): EditFormState => ({
  child_first_name: s.first_name ?? '',
  child_last_name: s.last_name ?? '',
  child_date_of_birth: s.date_of_birth ?? '',
  child_gender: s.gender ?? '',
  has_allergies: boolToYesNo(s.has_allergies),
  allergies_description: s.allergies_description ?? '',
  has_medical_conditions: boolToYesNo(s.has_medical_conditions),
  medical_conditions_description: s.medical_conditions_description ?? '',
  diagnosis: Array.isArray(s.diagnosis) ? s.diagnosis : [],
  history_of_seizures: boolToYesNo(s.history_of_seizures),
  toilet_trained: s.toilet_trained ?? undefined,
  non_ambulatory: boolToYesNo(s.non_ambulatory),
  self_injurious_behavior: boolToYesNo(s.self_injurious_behavior),
  self_injurious_description: s.self_injurious_behavior_description ?? '',
  aggressive_behavior: boolToYesNo(s.aggressive_behavior),
  aggressive_behavior_description: s.aggressive_behavior_description ?? '',
  elopement_history: boolToYesNo(s.elopement_history),
  elopement_description: s.elopement_history_description ?? '',
  has_behavior_plan: boolToYesNo(s.has_behavior_plan),
  communication_type: Array.isArray(s.communication_type)
    ? (s.communication_type[0] ?? '')
    : (s.communication_type ?? ''),
  strengths_interests: s.strengths_interests ?? '',
  motivators: s.motivators ?? '',
  other_therapies: boolToYesNo(s.other_therapies),
  therapies_description: s.therapies_description ?? '',
  previous_swim_lessons: boolToYesNo(s.previous_swim_lessons),
  previous_swim_experience: s.previous_swim_lessons_description ?? '',
  comfortable_in_water: s.comfortable_in_water ?? '',
  swim_goals: Array.isArray(s.swim_goals) ? s.swim_goals : [],
  availability: Array.isArray(s.availability) ? s.availability : [],
  other_availability: '',
  flexible_swimmer: !!s.flexible_swimmer,
  emergency_contact_name: s.emergency_contact_name ?? '',
  emergency_contact_phone: s.emergency_contact_phone ?? '',
  emergency_contact_relationship: s.emergency_contact_relationship ?? '',
});

const formToDb = (v: EditFormState) => ({
  first_name: v.child_first_name?.trim() || null,
  last_name: v.child_last_name?.trim() || null,
  date_of_birth: v.child_date_of_birth || null,
  gender: v.child_gender || null,
  has_allergies: yesNoToBool(v.has_allergies),
  allergies_description: v.allergies_description?.trim() || null,
  has_medical_conditions: yesNoToBool(v.has_medical_conditions),
  medical_conditions_description: v.medical_conditions_description?.trim() || null,
  diagnosis: v.diagnosis ?? [],
  history_of_seizures: yesNoToBool(v.history_of_seizures),
  toilet_trained: v.toilet_trained || null,
  non_ambulatory: yesNoToBool(v.non_ambulatory),
  self_injurious_behavior: yesNoToBool(v.self_injurious_behavior),
  self_injurious_behavior_description: v.self_injurious_description?.trim() || null,
  aggressive_behavior: yesNoToBool(v.aggressive_behavior),
  aggressive_behavior_description: v.aggressive_behavior_description?.trim() || null,
  elopement_history: yesNoToBool(v.elopement_history),
  elopement_history_description: v.elopement_description?.trim() || null,
  has_behavior_plan: yesNoToBool(v.has_behavior_plan),
  communication_type: v.communication_type ? [v.communication_type] : null,
  strengths_interests: v.strengths_interests?.trim() || null,
  motivators: v.motivators?.trim() || null,
  other_therapies: yesNoToBool(v.other_therapies),
  therapies_description: v.therapies_description?.trim() || null,
  previous_swim_lessons: yesNoToBool(v.previous_swim_lessons),
  previous_swim_lessons_description: v.previous_swim_experience?.trim() || null,
  comfortable_in_water: v.comfortable_in_water || null,
  swim_goals: v.swim_goals ?? [],
  availability: v.availability ?? [],
  flexible_swimmer: !!v.flexible_swimmer,
  emergency_contact_name: v.emergency_contact_name?.trim() || null,
  emergency_contact_phone: v.emergency_contact_phone?.trim() || null,
  emergency_contact_relationship: v.emergency_contact_relationship?.trim() || null,
});

export default function ParentEditSwimmerPage() {
  const params = useParams();
  const router = useRouter();
  const swimmerId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [swimmerName, setSwimmerName] = useState('');

  const form = useForm<EditFormState>({
    mode: 'onSubmit',
    defaultValues: dbToForm({}),
  });

  useEffect(() => {
    const fetchSwimmer = async () => {
      try {
        const response = await fetch(`/api/parent/swimmers/${swimmerId}`);
        if (!response.ok) throw new Error('Failed to fetch swimmer');
        const data = await response.json();
        const swimmer = data.swimmer || data;
        setSwimmerName(`${swimmer.first_name ?? ''} ${swimmer.last_name ?? ''}`.trim());
        form.reset(dbToForm(swimmer));
      } catch (error) {
        console.error('Error fetching swimmer:', error);
        toast({
          title: 'Error',
          description: 'Failed to load swimmer data',
          variant: 'destructive',
        });
        router.push('/parent/swimmers');
      } finally {
        setLoading(false);
      }
    };
    fetchSwimmer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swimmerId]);

  const onSubmit = async (values: EditFormState) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/parent/swimmers/${swimmerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToDb(values)),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
      toast({ title: 'Saved', description: 'Swimmer information updated.' });
      router.push(`/parent/swimmers`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['parent']}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['parent']}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/parent/swimmers">
              <Button type="button" variant="ghost" size="icon" aria-label="Go back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">
              {swimmerName ? `Edit ${swimmerName}` : 'Edit Swimmer'}
            </h1>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Funding details and waiver/consent fields are managed by staff. To
            update those, please contact us.
          </p>

          <div className="space-y-6">
            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>Demographics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="child_first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="child_last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="child_date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="child_gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
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
              </CardContent>
            </Card>

            {/* Medical */}
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent>
                <MedicalSection />
              </CardContent>
            </Card>

            {/* Behavioral */}
            <Card>
              <CardHeader>
                <CardTitle>Behavioral Information</CardTitle>
              </CardHeader>
              <CardContent>
                <BehavioralSection />
              </CardContent>
            </Card>

            {/* Fundamental */}
            <Card>
              <CardHeader>
                <CardTitle>Fundamental Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FundamentalInformationSection />
              </CardContent>
            </Card>

            {/* Swim Background */}
            <Card>
              <CardHeader>
                <CardTitle>Swimming Background</CardTitle>
              </CardHeader>
              <CardContent>
                <SwimmingBackgroundSection />
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <SchedulingSection />
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergency_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Full name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergency_contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergency_contact_relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Mother, Father, Grandparent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Link href="/parent/swimmers">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="min-w-[120px]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </FormProvider>
    </RoleGuard>
  );
}
