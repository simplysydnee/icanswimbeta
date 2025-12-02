'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

// Form validation schema
const referralFormSchema = z.object({
  // Section 1: Client Information
  child_name: z.string().min(1, 'Child name is required'),
  child_date_of_birth: z.string().min(1, 'Date of birth is required'),
  diagnosis: z.array(z.string()).min(1, 'At least one diagnosis is required'),
  parent_name: z.string().min(1, 'Parent name is required'),
  parent_email: z.string().email('Valid email is required'),
  parent_phone: z.string().min(1, 'Phone number is required'),

  // Section 2: Client Medical and Physical Profile
  non_ambulatory: z.enum(['yes', 'no']),
  has_seizure_disorder: z.enum(['yes', 'no']),
  height: z.string().optional(),
  weight: z.string().optional(),
  toilet_trained: z.enum(['yes', 'no']),
  has_medical_conditions: z.enum(['yes', 'no']),
  medical_conditions_description: z.string().optional(),
  has_allergies: z.enum(['yes', 'no']),
  allergies_description: z.string().optional(),
  has_other_therapies: z.enum(['yes', 'no']),
  other_therapies_description: z.string().optional(),

  // Section 3: Behavioral & Safety Information
  comfortable_in_water: z.enum(['yes', 'no']),
  self_injurious_behavior: z.enum(['yes', 'no']),
  self_injurious_description: z.string().optional(),
  aggressive_behavior: z.enum(['yes', 'no']),
  aggressive_behavior_description: z.string().optional(),
  elopement_behavior: z.enum(['yes', 'no']),
  elopement_description: z.string().optional(),
  has_safety_plan: z.enum(['yes', 'no']),
  safety_plan_description: z.string().optional(),

  // Section 4: Referral Information
  referral_type: z.enum(['vmrc_client', 'scholarship_applicant', 'coordinator_referral', 'other']),
  coordinator_name: z.string().min(1, 'Coordinator name is required'),
  coordinator_email: z.string().email('Valid coordinator email is required'),

  // Section 5: Consent & Optional Info
  photo_release: z.enum(['yes', 'no']),
  liability_agreement: z.boolean().refine(val => val === true, {
    message: 'Liability agreement must be accepted',
  }),
  swimmer_photo_url: z.string().optional(),
  additional_info: z.string().optional(),
});

type ReferralFormData = z.infer<typeof referralFormSchema>;

// Type for API data (diagnosis is already array)
type ApiReferralData = ReferralFormData;

export default function ReferralPage() {
  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

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
      non_ambulatory: 'no',
      has_seizure_disorder: 'no',
      toilet_trained: 'no',
      has_medical_conditions: 'no',
      has_allergies: 'no',
      has_other_therapies: 'no',
      comfortable_in_water: 'no',
      self_injurious_behavior: 'no',
      aggressive_behavior: 'no',
      elopement_behavior: 'no',
      has_safety_plan: 'no',
      photo_release: 'no',
      liability_agreement: false,
    },
  });

  // Watch conditional fields
  const hasMedicalConditions = watch('has_medical_conditions');
  const hasAllergies = watch('has_allergies');
  const hasOtherTherapies = watch('has_other_therapies');
  const hasSelfInjuriousBehavior = watch('self_injurious_behavior');
  const hasAggressiveBehavior = watch('aggressive_behavior');
  const hasElopementBehavior = watch('elopement_behavior');
  const hasSafetyPlan = watch('has_safety_plan');

  const onSubmit = async (data: ReferralFormData) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Convert diagnosis array to comma-separated string for API compatibility
      const apiData: ApiReferralData = {
        ...data,
        diagnosis: data.diagnosis.join([]),
      };
      await apiClient.createVmrcReferralRequest(apiData);
      setSubmitResult({
        success: true,
        message: 'Referral submitted successfully! We will review it and contact you soon.',
      });
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
    setCurrentSection(Math.min(currentSection + 1, 5));
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
          <CardTitle className="text-2xl">VMRC Coordinator Referral Form</CardTitle>
          <CardDescription>
            Complete this form to refer a client for adaptive swim lessons at I Can Swim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5].map((section) => (
                <div
                  key={section}
                  className={`flex-1 h-2 mx-1 rounded-full ${
                    section <= currentSection ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Client Info</span>
              <span>Medical Profile</span>
              <span>Behavioral</span>
              <span>Referral</span>
              <span>Consent</span>
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
                    <Label htmlFor="child_name">Child's Full Name *</Label>
                    <Input
                      id="child_name"
                      {...register('child_name')}
                      placeholder="Enter child's full name"
                    />
                    {errors.child_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.child_name.message}</p>
                    )}
                  </div>
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

            {/* Section 2: Medical Profile */}
            {currentSection === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Medical & Physical Profile</h3>

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
                    <Label>History of Seizure Disorder? *</Label>
                    <div className="flex space-x-4 mt-2">
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="yes" {...register('has_seizure_disorder')} />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="no" {...register('has_seizure_disorder')} />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      {...register('height')}
                      placeholder="e.g., 4'2&quot;"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight</Label>
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
                  </div>
                </div>

                <div>
                  <Label>Medical Conditions? *</Label>
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
                  {hasMedicalConditions === 'yes' && (
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
                  <Label>Allergies? *</Label>
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
                  {hasAllergies === 'yes' && (
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

                <div>
                  <Label>Other Therapies? *</Label>
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
                  {hasOtherTherapies === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="other_therapies_description">Describe Other Therapies</Label>
                      <Textarea
                        id="other_therapies_description"
                        {...register('other_therapies_description')}
                        placeholder="Please describe other therapies..."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 3: Behavioral Information */}
            {currentSection === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Behavioral & Safety Information</h3>

                <div>
                  <Label>Comfortable in Water? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('comfortable_in_water')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('comfortable_in_water')} />
                      <span>No</span>
                    </label>
                  </div>
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
                  {hasSelfInjuriousBehavior === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="self_injurious_description">Describe Self-Injurious Behavior</Label>
                      <Textarea
                        id="self_injurious_description"
                        {...register('self_injurious_description')}
                        placeholder="Please describe self-injurious behavior..."
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
                  {hasAggressiveBehavior === 'yes' && (
                    <div className="mt-2">
                      <Label htmlFor="aggressive_behavior_description">Describe Aggressive Behavior</Label>
                      <Textarea
                        id="aggressive_behavior_description"
                        {...register('aggressive_behavior_description')}
                        placeholder="Please describe aggressive behavior..."
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Elopement Behavior? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('elopement_behavior')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('elopement_behavior')} />
                      <span>No</span>
                    </label>
                  </div>
                  {hasElopementBehavior === 'yes' && (
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
              </div>
            )}

            {/* Section 4: Referral Information */}
            {currentSection === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Referral Information</h3>

                <div>
                  <Label htmlFor="referral_type">Referral Type *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="vmrc_client" {...register('referral_type')} />
                      <span>VMRC Client</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="scholarship_applicant" {...register('referral_type')} />
                      <span>Scholarship Applicant</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="coordinator_referral" {...register('referral_type')} />
                      <span>Coordinator Referral</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="other" {...register('referral_type')} />
                      <span>Other</span>
                    </label>
                  </div>
                  {errors.referral_type && (
                    <p className="text-sm text-red-600 mt-1">{errors.referral_type.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coordinator_name">Coordinator Name *</Label>
                    <Input
                      id="coordinator_name"
                      {...register('coordinator_name')}
                      placeholder="Your full name"
                    />
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
                    />
                    {errors.coordinator_email && (
                      <p className="text-sm text-red-600 mt-1">{errors.coordinator_email.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Consent */}
            {currentSection === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Consent & Additional Information</h3>

                <div>
                  <Label>Photo/Video Release? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="yes" {...register('photo_release')} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" value="no" {...register('photo_release')} />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="swimmer_photo_url">Swimmer Photo URL (Optional)</Label>
                  <Input
                    id="swimmer_photo_url"
                    {...register('swimmer_photo_url')}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="additional_info">Additional Information</Label>
                  <Textarea
                    id="additional_info"
                    {...register('additional_info')}
                    placeholder="Any other information that would be helpful..."
                    rows={4}
                  />
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="liability_agreement"
                      {...register('liability_agreement')}
                    />
                    <div>
                      <Label htmlFor="liability_agreement" className="font-semibold">
                        Liability Agreement *
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        I confirm that the parent/guardian has agreed to the liability waiver and understands the risks associated with swim lessons.
                      </p>
                      {errors.liability_agreement && (
                        <p className="text-sm text-red-600 mt-1">{errors.liability_agreement.message}</p>
                      )}
                    </div>
                  </div>
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

              {currentSection < 5 ? (
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