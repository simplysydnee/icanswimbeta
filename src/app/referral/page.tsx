'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { emailService } from '@/lib/email-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn } from 'lucide-react';

// Comprehensive form validation schema based on database schema
const referralFormSchema = z.object({
  // Section 1: Client Information
  child_first_name: z.string().min(1, "Child's first name is required"),
  child_last_name: z.string().min(1, "Child's last name is required"),
  child_date_of_birth: z.string().min(1, 'Date of birth is required'),
  child_gender: z.string().min(1, 'Gender is required'),
  diagnosis: z.array(z.string()).min(1, 'At least one diagnosis is required'),
  parent_name: z.string().min(1, 'Parent name is required'),
  parent_email: z.string().email('Valid email is required'),
  parent_phone: z.string().min(1, 'Phone number is required'),

  // Section 2: Medical & Safety Information
  has_allergies: z.enum(['yes', 'no']),
  allergies_description: z.string().optional(),
  has_medical_conditions: z.enum(['yes', 'no']),
  medical_conditions_description: z.string().optional(),
  history_of_seizures: z.enum(['yes', 'no']),
  toilet_trained: z.enum(['yes', 'no', 'sometimes']),
  non_ambulatory: z.enum(['yes', 'no']),
  height: z.string().optional(),
  weight: z.string().optional(),

  // Section 3: Behavioral Information
  self_injurious_behavior: z.enum(['yes', 'no']),
  self_injurious_description: z.string().optional(),
  aggressive_behavior: z.enum(['yes', 'no']),
  aggressive_behavior_description: z.string().optional(),
  elopement_history: z.enum(['yes', 'no']),
  elopement_description: z.string().optional(),
  has_safety_plan: z.enum(['yes', 'no']),
  safety_plan_description: z.string().optional(),

  // Section 4: Swimming Background
  previous_swim_lessons: z.enum(['yes', 'no']),
  previous_swim_experience: z.string().optional(),
  comfortable_in_water: z.enum(['very', 'somewhat', 'not_at_all']),
  swim_goals: z.array(z.string()).min(1, 'At least one swim goal is required'),

  // Section 5: Other Therapies & Information
  has_other_therapies: z.enum(['yes', 'no']),
  other_therapies_description: z.string().optional(),

  // Section 6: Coordinator Information
  coordinator_name: z.string().min(1, 'Coordinator name is required'),
  coordinator_email: z.string().email('Valid coordinator email is required'),
  additional_info: z.string().optional(),
});

type ReferralFormData = z.infer<typeof referralFormSchema>;

// Type for API data (arrays need to be strings, and we need to map field names)
type ApiReferralData = {
  // Section 1 - Map from form fields to API fields
  child_name: string; // Combined from child_first_name and child_last_name
  child_date_of_birth: string;
  diagnosis: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;

  // Section 2 - Medical & Safety
  non_ambulatory: string;
  has_seizure_disorder: string; // Map from history_of_seizures
  height?: string;
  weight?: string;
  toilet_trained: string;
  has_medical_conditions: string;
  medical_conditions_description?: string;
  has_allergies: string;
  allergies_description?: string;
  has_other_therapies: string;
  other_therapies_description?: string;

  // Section 3 - Behavioral
  comfortable_in_water: string;
  self_injurious_behavior: string;
  self_injurious_description?: string;
  aggressive_behavior: string;
  aggressive_behavior_description?: string;
  elopement_behavior: string; // Map from elopement_history
  elopement_description?: string;
  has_safety_plan: string;
  safety_plan_description?: string;

  // Section 4 - Coordinator & Additional Info
  referral_type: string; // Will be hardcoded as 'vmrc_client'
  coordinator_name?: string;
  coordinator_email?: string;
  photo_release: string; // Will be hardcoded as 'no'
  liability_agreement: boolean; // Will be hardcoded as false
  swimmer_photo_url?: string; // Will be undefined
  additional_info?: string;
};

export default function ReferralPage() {
  const { user, loading: authLoading } = useAuth();
  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize form hook at the top (before any conditional returns)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      diagnosis: [],
      swim_goals: [],
      non_ambulatory: 'no',
      history_of_seizures: 'no',
      comfortable_in_water: 'not_at_all',
      has_safety_plan: 'no',
      has_allergies: 'no',
      has_medical_conditions: 'no',
      toilet_trained: 'no',
      self_injurious_behavior: 'no',
      aggressive_behavior: 'no',
      elopement_history: 'no',
      previous_swim_lessons: 'no',
      has_other_therapies: 'no',
      coordinator_name: '', // Will be populated when user is logged in
      coordinator_email: '', // Will be populated when user is logged in
    },
  });

  // Update form values with user info when user is logged in
  useEffect(() => {
    if (user) {
      setValue('coordinator_name', user.fullName || '');
      setValue('coordinator_email', user.email || '');
    }
  }, [user, setValue]);

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2a5e84] mx-auto" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // NOT LOGGED IN - Show login prompt (NOT the form)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-[#2a5e84]/10 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-[#2a5e84]" />
            </div>
            <CardTitle className="text-2xl">Coordinator Login Required</CardTitle>
            <CardDescription className="text-base mt-2">
              Please log in to submit a referral. We use your account to track your caseload and identify your regional center.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full bg-[#2a5e84] hover:bg-[#1e4a6d]"
              onClick={() => window.location.href = '/login?redirect=/referral'}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Log In to Continue
            </Button>

            <div className="text-center text-sm text-gray-500">
              <p>Don&apos;t have an account?</p>
              <a
                href="/signup?redirect=/referral"
                className="text-[#2a5e84] hover:underline"
              >
                Sign up as a coordinator
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Watch conditional fields
  const hasSafetyPlan = watch('has_safety_plan');

  const onSubmit = async (data: ReferralFormData) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Map form data to API data structure
      const apiData: ApiReferralData = {
        // Section 1 - Client Information
        child_name: `${data.child_first_name} ${data.child_last_name}`,
        child_date_of_birth: data.child_date_of_birth,
        diagnosis: data.diagnosis.join(', '),
        parent_name: data.parent_name,
        parent_email: data.parent_email,
        parent_phone: data.parent_phone,

        // Section 2 - Medical & Safety
        non_ambulatory: data.non_ambulatory,
        has_seizure_disorder: data.history_of_seizures,
        height: data.height,
        weight: data.weight,
        toilet_trained: data.toilet_trained,
        has_medical_conditions: data.has_medical_conditions,
        medical_conditions_description: data.medical_conditions_description,
        has_allergies: data.has_allergies,
        allergies_description: data.allergies_description,
        has_other_therapies: data.has_other_therapies,
        other_therapies_description: data.other_therapies_description,

        // Section 3 - Behavioral
        comfortable_in_water: data.comfortable_in_water,
        self_injurious_behavior: data.self_injurious_behavior,
        self_injurious_description: data.self_injurious_description,
        aggressive_behavior: data.aggressive_behavior,
        aggressive_behavior_description: data.aggressive_behavior_description,
        elopement_behavior: data.elopement_history,
        elopement_description: data.elopement_description,
        has_safety_plan: data.has_safety_plan,
        safety_plan_description: data.safety_plan_description,

        // Section 4 - Coordinator & Additional Info
        referral_type: 'vmrc_client', // Hardcoded as requested
        coordinator_name: data.coordinator_name,
        coordinator_email: data.coordinator_email,
        photo_release: 'no', // Hardcoded as requested
        liability_agreement: false, // Hardcoded as requested
        additional_info: data.additional_info,
      };

      await apiClient.createVmrcReferralRequest(apiData);

      // Send enrollment email to parent
      const emailResult = await emailService.sendEnrollmentInvite({
        parentEmail: data.parent_email,
        parentName: data.parent_name,
        childName: `${data.child_first_name} ${data.child_last_name}`,
        coordinatorName: data.coordinator_name,
      });

      if (emailResult.success) {
        setSubmitResult({
          success: true,
          message: `Referral submitted successfully! Email sent to ${data.parent_email} to complete enrollment.`,
        });
      } else {
        setSubmitResult({
          success: true,
          message: 'Referral submitted successfully! Parent will be contacted to complete enrollment.',
        });
      }
    } catch (error) {
      console.error('Error submitting referral:', error);
      setSubmitResult({
        success: false,
        message: 'Failed to submit referral. Please try again or contact support.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextSection = () => {
    setCurrentSection(Math.min(currentSection + 1, 6));
  };

  const prevSection = () => {
    setCurrentSection(Math.max(currentSection - 1, 1));
  };

  if (submitResult?.success) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Referral Submitted Successfully!</CardTitle>
            <CardDescription>
              Thank you for submitting the VMRC referral form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {submitResult.message}
              </AlertDescription>
            </Alert>
            <div className="mt-6">
              <Button onClick={() => window.location.reload()}>
                Submit Another Referral
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Coordinator Referral Form</CardTitle>
          <CardDescription>
            Complete this form to refer a client for adaptive swim lessons at I Can Swim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar - Now 6 sections */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5, 6].map((section) => (
                <div
                  key={section}
                  className={`flex-1 h-2 mx-1 rounded-full ${
                    section <= currentSection ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Client Info</span>
              <span>Medical</span>
              <span>Behavioral</span>
              <span>Swimming</span>
              <span>Therapies</span>
              <span>Coordinator</span>
            </div>
          </div>

          {submitResult && !submitResult.success && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {submitResult.message}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Client Information */}
            {currentSection === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="child_first_name">Child&apos;s First Name *</Label>
                    <Input
                      id="child_first_name"
                      {...register('child_first_name')}
                      placeholder="First name"
                    />
                    {errors.child_first_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.child_first_name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="child_last_name">Child&apos;s Last Name *</Label>
                    <Input
                      id="child_last_name"
                      {...register('child_last_name')}
                      placeholder="Last name"
                    />
                    {errors.child_last_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.child_last_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="child_date_of_birth">Date of Birth *</Label>
                    <Input
                      id="child_date_of_birth"
                      type="date"
                      {...register('child_date_of_birth')}
                    />
                    {errors.child_date_of_birth && (
                      <p className="text-sm text-red-600 mt-1">{errors.child_date_of_birth.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="child_gender">Gender *</Label>
                    <select
                      id="child_gender"
                      {...register('child_gender')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                    {errors.child_gender && (
                      <p className="text-sm text-red-600 mt-1">{errors.child_gender.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Diagnosis (select all that apply) *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      'ADD/ADHD',
                      'Autism',
                      'Speech Impairment',
                      'Developmental Delay',
                      'Specific Learning Disability',
                      'Sensory Processing',
                      'Deaf/Hard of Hearing'
                    ].map((option) => {
                      const currentDiagnosis = watch('diagnosis') || [];
                      return (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`diagnosis-${option}`}
                            checked={currentDiagnosis.includes(option)}
                            onChange={(e) => {
                              const current = watch('diagnosis') || [];
                              if (e.target.checked) {
                                setValue('diagnosis', [...current, option], { shouldValidate: true });
                              } else {
                                setValue('diagnosis', current.filter((d: string) => d !== option), { shouldValidate: true });
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor={`diagnosis-${option}`} className="text-sm font-normal">
                            {option}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  {errors.diagnosis && (
                    <p className="text-sm text-red-600 mt-1">{errors.diagnosis.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="parent_name">Parent/Guardian Name *</Label>
                    <Input
                      id="parent_name"
                      {...register('parent_name')}
                      placeholder="Parent's full name"
                    />
                    {errors.parent_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.parent_name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="parent_email">Parent Email *</Label>
                    <Input
                      id="parent_email"
                      type="email"
                      {...register('parent_email')}
                      placeholder="parent@example.com"
                    />
                    {errors.parent_email && (
                      <p className="text-sm text-red-600 mt-1">{errors.parent_email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="parent_phone">Parent Phone *</Label>
                    <Input
                      id="parent_phone"
                      {...register('parent_phone')}
                      placeholder="(555) 123-4567"
                    />
                    {errors.parent_phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.parent_phone.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Medical & Safety Information */}
            {currentSection === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Medical & Safety Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Non-Ambulatory? *</Label>
                    <div className="flex space-x-4 mt-2">
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="yes" {...register('non_ambulatory')} />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="no" {...register('non_ambulatory')} />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label>History of Seizures? *</Label>
                    <div className="flex space-x-4 mt-2">
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="yes" {...register('history_of_seizures')} />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="no" {...register('history_of_seizures')} />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height (optional)</Label>
                    <Input
                      id="height"
                      {...register('height')}
                      placeholder="e.g., 4'2&quot;"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (optional)</Label>
                    <Input
                      id="weight"
                      {...register('weight')}
                      placeholder="e.g., 65 lbs"
                    />
                  </div>
                </div>

                <div>
                  <Label>Toilet Trained? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('toilet_trained')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('toilet_trained')} />
                      <span>No</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="sometimes" {...register('toilet_trained')} />
                      <span>Sometimes</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Has Medical Conditions? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('has_medical_conditions')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('has_medical_conditions')} />
                      <span>No</span>
                    </label>
                  </div>
                  {watch('has_medical_conditions') === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="medical_conditions_description">Describe Medical Conditions</Label>
                      <Textarea
                        id="medical_conditions_description"
                        {...register('medical_conditions_description')}
                        placeholder="Please describe any medical conditions..."
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Has Allergies? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('has_allergies')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('has_allergies')} />
                      <span>No</span>
                    </label>
                  </div>
                  {watch('has_allergies') === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="allergies_description">Describe Allergies</Label>
                      <Textarea
                        id="allergies_description"
                        {...register('allergies_description')}
                        placeholder="Please describe any allergies..."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 3: Behavioral Information */}
            {currentSection === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Behavioral Information</h3>

                <div>
                  <Label>Comfortable in Water? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="very" {...register('comfortable_in_water')} />
                      <span>Very comfortable</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="somewhat" {...register('comfortable_in_water')} />
                      <span>Somewhat comfortable</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="not_at_all" {...register('comfortable_in_water')} />
                      <span>Not at all comfortable</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Safety Plan? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('has_safety_plan')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('has_safety_plan')} />
                      <span>No</span>
                    </label>
                  </div>
                  {hasSafetyPlan === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="safety_plan_description">Describe Safety Plan</Label>
                      <Textarea
                        id="safety_plan_description"
                        {...register('safety_plan_description')}
                        placeholder="Please describe the safety plan..."
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Self-Injurious Behavior? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('self_injurious_behavior')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('self_injurious_behavior')} />
                      <span>No</span>
                    </label>
                  </div>
                  {watch('self_injurious_behavior') === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="self_injurious_description">Describe Self-Injurious Behavior</Label>
                      <Textarea
                        id="self_injurious_description"
                        {...register('self_injurious_description')}
                        placeholder="Please describe the behavior..."
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Aggressive Behavior? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('aggressive_behavior')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('aggressive_behavior')} />
                      <span>No</span>
                    </label>
                  </div>
                  {watch('aggressive_behavior') === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="aggressive_behavior_description">Describe Aggressive Behavior</Label>
                      <Textarea
                        id="aggressive_behavior_description"
                        {...register('aggressive_behavior_description')}
                        placeholder="Please describe the behavior..."
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Elopement History? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('elopement_history')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('elopement_history')} />
                      <span>No</span>
                    </label>
                  </div>
                  {watch('elopement_history') === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="elopement_description">Describe Elopement Behavior</Label>
                      <Textarea
                        id="elopement_description"
                        {...register('elopement_description')}
                        placeholder="Please describe elopement behavior..."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 4: Swimming Background */}
            {currentSection === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Swimming Background</h3>

                <div>
                  <Label>Previous Swim Lessons? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('previous_swim_lessons')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('previous_swim_lessons')} />
                      <span>No</span>
                    </label>
                  </div>
                  {watch('previous_swim_lessons') === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="previous_swim_experience">Describe Previous Swim Experience</Label>
                      <Textarea
                        id="previous_swim_experience"
                        {...register('previous_swim_experience')}
                        placeholder="Please describe previous swim lessons or experience..."
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Swim Goals (select all that apply) *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      'Water safety skills',
                      'Basic swimming strokes',
                      'Building confidence in water',
                      'Social interaction with peers',
                      'Therapeutic benefits',
                      'Competitive swimming preparation'
                    ].map((option) => {
                      const currentGoals = watch('swim_goals') || [];
                      return (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`goal-${option}`}
                            checked={currentGoals.includes(option)}
                            onChange={(e) => {
                              const current = watch('swim_goals') || [];
                              if (e.target.checked) {
                                setValue('swim_goals', [...current, option], { shouldValidate: true });
                              } else {
                                setValue('swim_goals', current.filter((g: string) => g !== option), { shouldValidate: true });
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor={`goal-${option}`} className="text-sm font-normal">
                            {option}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  {errors.swim_goals && (
                    <p className="text-sm text-red-600 mt-1">{errors.swim_goals.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Section 5: Other Therapies */}
            {currentSection === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Other Therapies & Information</h3>

                <div>
                  <Label>Receiving Other Therapies? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('has_other_therapies')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('has_other_therapies')} />
                      <span>No</span>
                    </label>
                  </div>
                  {watch('has_other_therapies') === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="other_therapies_description">Describe Other Therapies</Label>
                      <Textarea
                        id="other_therapies_description"
                        {...register('other_therapies_description')}
                        placeholder="Please describe other therapies (OT, PT, speech, etc.)..."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 6: Coordinator Information */}
            {currentSection === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Coordinator Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coordinator_name">Coordinator Name *</Label>
                    <Input
                      id="coordinator_name"
                      {...register('coordinator_name')}
                      placeholder="Your full name"
                      readOnly
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-filled from your account</p>
                    {errors.coordinator_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.coordinator_name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="coordinator_email">Coordinator Email *</Label>
                    <Input
                      id="coordinator_email"
                      type="email"
                      {...register('coordinator_email')}
                      placeholder="coordinator@example.com"
                      readOnly
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-filled from your account</p>
                    {errors.coordinator_email && (
                      <p className="text-sm text-red-600 mt-1">{errors.coordinator_email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="additional_info">Additional Information (Optional)</Label>
                  <Textarea
                    id="additional_info"
                    {...register('additional_info')}
                    placeholder="Any other information that would be helpful..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevSection}
                disabled={currentSection === 1}
              >
                Previous
              </Button>

              {currentSection < 6 ? (
                <Button type="button" onClick={nextSection}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Referral
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}