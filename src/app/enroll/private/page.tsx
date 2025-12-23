'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Loader2 } from 'lucide-react';
import { SWIM_GOALS, AVAILABILITY_SLOTS, DIAGNOSIS_OPTIONS } from '@/lib/constants';
import { LiabilityWaiverModal, CancellationPolicyModal } from '@/components/enrollment';
import { getAllFundingSources } from '@/lib/funding-utils';

// Form validation schema
const privateEnrollmentSchema = z.object({
  // Section 1: Parent Information
  parent_name: z.string().min(1, 'Your name is required'),
  parent_email: z.string().email('Valid email is required'),
  parent_phone: z.string().min(10, 'Phone number is required'),
  parent_address: z.string().min(1, 'Address is required'),
  parent_city: z.string().min(1, 'City is required'),
  parent_state: z.string().min(2, 'State is required'),
  parent_zip: z.string().min(5, 'ZIP code is required'),

  // Section 2: Child Information
  child_first_name: z.string().min(1, "Child's first name is required"),
  child_last_name: z.string().min(1, "Child's last name is required"),
  child_date_of_birth: z.string().min(1, "Date of birth is required"),
  child_gender: z.string().min(1, 'Gender is required'),

  // Section 3: Medical & Safety Information
  has_allergies: z.enum(['yes', 'no']),
  allergies_description: z.string().optional(),
  has_medical_conditions: z.enum(['yes', 'no']),
  medical_conditions_description: z.string().optional(),
  diagnosis: z.array(z.string()).optional(),
  history_of_seizures: z.enum(['yes', 'no']),
  toilet_trained: z.enum(['yes', 'no', 'sometimes']),
  non_ambulatory: z.enum(['yes', 'no']),

  // Section 4: Behavioral Information
  self_injurious_behavior: z.enum(['yes', 'no']),
  self_injurious_description: z.string().optional(),
  aggressive_behavior: z.enum(['yes', 'no']),
  aggressive_behavior_description: z.string().optional(),
  elopement_history: z.enum(['yes', 'no']),
  elopement_description: z.string().optional(),
  has_behavior_plan: z.enum(['yes', 'no']),
  // Note: behavior_plan_description field doesn't exist in database
  // behavior_plan_description: z.string().optional(),

  // Section 5: Swimming Background
  previous_swim_lessons: z.enum(['yes', 'no']),
  previous_swim_experience: z.string().optional(),
  comfortable_in_water: z.enum(['very', 'somewhat', 'not_at_all']),
  swim_goals: z.array(z.string()).min(1, 'At least one swim goal is required'),

  // Section 6: Scheduling & Availability
  availability_slots: z.array(z.string()).min(1, 'At least one availability slot is required'),
  other_availability: z.string().optional(),
  flexible_swimmer: z.boolean(),

  // Section 7: Consent & Agreement
  signed_waiver: z.boolean().refine(val => val === true, {
    message: 'You must agree to the liability waiver',
  }),
  liability_waiver_signature: z.string().optional(),
  photo_release: z.boolean(),
  photo_release_signature: z.string().optional(),
  cancellation_policy_agreement: z.boolean().refine(val => val === true, {
    message: 'You must agree to the cancellation policy',
  }),
  cancellation_policy_signature: z.string().optional(),
  emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(10, 'Emergency contact phone is required'),
  emergency_contact_relationship: z.string().min(1, 'Relationship is required'),
}).refine(
  (data) => {
    // Signature required only when waiver is signed
    if (data.signed_waiver && (!data.liability_waiver_signature || data.liability_waiver_signature.trim() === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'Liability waiver signature is required when agreeing to the waiver',
    path: ['liability_waiver_signature'],
  }
).refine(
  (data) => {
    // Signature required only when cancellation policy is agreed to
    if (data.cancellation_policy_agreement && (!data.cancellation_policy_signature || data.cancellation_policy_signature.trim() === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'Cancellation policy signature is required when agreeing to the policy',
    path: ['cancellation_policy_signature'],
  }
).refine(
  (data) => {
    // Signature required only when photo release is agreed to
    if (data.photo_release && (!data.photo_release_signature || data.photo_release_signature.trim() === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'Photo release signature is required when agreeing to the photo release',
    path: ['photo_release_signature'],
  }
);

type PrivateEnrollmentFormData = z.infer<typeof privateEnrollmentSchema>;

export default function PrivatePayEnrollmentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [privatePayFundingSourceId, setPrivatePayFundingSourceId] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [queryParams, setQueryParams] = useState<{ firstName?: string; lastName?: string; dob?: string }>({});

  // Read query parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params = {
      firstName: searchParams.get('firstName') || undefined,
      lastName: searchParams.get('lastName') || undefined,
      dob: searchParams.get('dob') || undefined,
    };
    setQueryParams(params);
    console.log('Query parameters:', params);
  }, []);

  // Load private pay funding source
  useEffect(() => {
    const loadPrivatePayFundingSource = async () => {
      try {
        const fundingSources = await getAllFundingSources();
        const privatePaySource = fundingSources.find(source => source.type === 'private_pay');
        if (privatePaySource) {
          setPrivatePayFundingSourceId(privatePaySource.id);
        } else {
          console.error('Private pay funding source not found');
        }
      } catch (error) {
        console.error('Error loading funding sources:', error);
      }
    };

    loadPrivatePayFundingSource();
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/enroll/private');
    }
  }, [user, authLoading, router]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PrivateEnrollmentFormData>({
    resolver: zodResolver(privateEnrollmentSchema),
    defaultValues: {
      child_first_name: queryParams.firstName || '',
      child_last_name: queryParams.lastName || '',
      child_date_of_birth: queryParams.dob || '',
      has_allergies: 'no',
      has_medical_conditions: 'no',
      history_of_seizures: 'no',
      toilet_trained: 'yes',
      non_ambulatory: 'no',
      self_injurious_behavior: 'no',
      aggressive_behavior: 'no',
      elopement_history: 'no',
      has_behavior_plan: 'no',
      previous_swim_lessons: 'no',
      comfortable_in_water: 'somewhat',
      flexible_swimmer: false,
      signed_waiver: false,
      liability_waiver_signature: '',
      photo_release: false,
      photo_release_signature: '',
      cancellation_policy_agreement: false,
      cancellation_policy_signature: '',
    },
  });

  // Update form values when query params are loaded
  useEffect(() => {
    if (queryParams.firstName || queryParams.lastName || queryParams.dob) {
      reset({
        child_first_name: queryParams.firstName || '',
        child_last_name: queryParams.lastName || '',
        child_date_of_birth: queryParams.dob || '',
      });
    }
  }, [queryParams, reset]);

  // Watch values for conditional fields
  const hasAllergies = watch('has_allergies');
  const hasMedicalConditions = watch('has_medical_conditions');
  const hasSelfInjuriousBehavior = watch('self_injurious_behavior');
  const hasAggressiveBehavior = watch('aggressive_behavior');
  const hasElopementHistory = watch('elopement_history');
  const otherAvailability = watch('availability_slots')?.includes('Other (please specify)');

  const onSubmit = async (data: PrivateEnrollmentFormData) => {
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('signed_waiver:', data.signed_waiver);
    console.log('liability_waiver_signature:', data.liability_waiver_signature);
    console.log('photo_release:', data.photo_release);
    console.log('photo_release_signature:', data.photo_release_signature);
    console.log('cancellation_policy_agreement:', data.cancellation_policy_agreement);
    console.log('cancellation_policy_signature:', data.cancellation_policy_signature);
    console.log('Full formData:', data);

    if (!user) {
      setSubmitResult({
        success: false,
        message: 'You must be logged in to submit this form.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Generate a unique client number (format: ICS-YYYYMMDD-XXXX)
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const clientNumber = `ICS-${dateStr}-${randomNum}`;

      // Prepare swimmer data - mapping form fields to database columns
      const swimmerData = {
        parent_id: user.id,
        first_name: data.child_first_name,
        last_name: data.child_last_name,
        date_of_birth: data.child_date_of_birth,
        gender: data.child_gender,
        client_number: clientNumber,

        // Medical/Safety
        has_allergies: data.has_allergies === 'yes',
        allergies_description: data.allergies_description,
        has_medical_conditions: data.has_medical_conditions === 'yes',
        medical_conditions_description: data.medical_conditions_description,
        diagnosis: data.diagnosis || [],
        history_of_seizures: data.history_of_seizures === 'yes',
        toilet_trained: data.toilet_trained === 'sometimes' ? 'in_progress' : data.toilet_trained,
        non_ambulatory: data.non_ambulatory === 'yes',

        // Behavioral
        self_injurious_behavior: data.self_injurious_behavior === 'yes',
        self_injurious_description: data.self_injurious_description,
        aggressive_behavior: data.aggressive_behavior === 'yes',
        aggressive_behavior_description: data.aggressive_behavior_description,
        elopement_history: data.elopement_history === 'yes',
        elopement_description: data.elopement_description,
        has_behavior_plan: data.has_behavior_plan === 'yes',
        // Note: behavior_plan_description field doesn't exist in database

        // Swimming
        previous_swim_lessons: data.previous_swim_lessons === 'yes',
        // Note: previous_swim_experience field doesn't exist in database
        comfortable_in_water: data.comfortable_in_water,
        swim_goals: data.swim_goals,

        // Scheduling
        // Note: availability field doesn't exist in database
        flexible_swimmer: data.flexible_swimmer,

        // Payment & Status
        payment_type: 'private_pay',
        funding_source_id: privatePayFundingSourceId,

        // Legal - mapping to correct database column names
        signed_waiver: data.signed_waiver,
        signed_liability: data.signed_waiver, // Map to both fields
        photo_video_permission: data.photo_release,
        photo_video_signature: data.photo_release_signature || null,
        liability_waiver_signature: data.liability_waiver_signature,
        cancellation_policy_signature: data.cancellation_policy_signature,

        // Status
        enrollment_status: 'pending_enrollment',
        assessment_status: 'not_started',
        approval_status: 'pending',
      };

      console.log('Swimmer data being submitted:', swimmerData);

      // Update parent profile information
      const profileData = {
        full_name: data.parent_name,
        phone: data.parent_phone,
        // Note: email is already in auth.users, but we can update it in profiles too
      };

      console.log('Profile data being submitted:', profileData);

      // Update profile first, then create swimmer
      await apiClient.updateProfile(user.id, profileData);
      await apiClient.createSwimmer(swimmerData);

      setSubmitResult({
        success: true,
        message: 'Enrollment submitted successfully! Our team will review your application and contact you within 2-3 business days.',
      });
    } catch (error) {
      console.error('Error submitting enrollment:', {
        error,
        errorString: String(error),
        errorJSON: JSON.stringify(error, null, 2),
        user: user?.id
      });
      setSubmitResult({
        success: false,
        message: 'Failed to submit enrollment. Please try again or contact support.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextSection = () => {
    if (currentSection < 7) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  // Show loading while checking auth, but with a timeout
  const [showAuthTimeout, setShowAuthTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        setShowAuthTimeout(true);
        console.warn('Auth loading is taking too long, showing timeout message');
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-gray-600">Checking authentication...</p>
          {showAuthTimeout && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md max-w-md">
              <p className="text-yellow-800 text-sm">
                Authentication is taking longer than expected. You may need to refresh the page or check your connection.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-yellow-700 underline"
              >
                Refresh page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success message
  if (submitResult?.success) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Enrollment Submitted!</CardTitle>
            <CardDescription>
              Thank you for your interest in I Can Swim adaptive swim lessons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {submitResult.message}
              </AlertDescription>
            </Alert>
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">What happens next?</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Our team reviews all applications within 2-3 business days</li>
                <li>You&apos;ll receive an email with next steps</li>
                <li>Once approved, you&apos;ll be invited to schedule an assessment session</li>
                <li>Assessment sessions are 30 minutes and help determine appropriate swim level</li>
                <li>After assessment, you can book regular weekly lessons</li>
              </ul>
              <div className="pt-4">
                <Button onClick={() => router.push('/dashboard')}>
                  Return to Dashboard
                </Button>
              </div>
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
          <CardTitle className="text-2xl">Private Pay Enrollment</CardTitle>
          <CardDescription>
            Complete this form to enroll your child in I Can Swim adaptive swim lessons.
          </CardDescription>
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500">
              Section {currentSection} of 7
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5, 6, 7].map((section) => (
                <div
                  key={section}
                  className={`h-2 w-8 rounded-full ${
                    section === currentSection
                      ? 'bg-primary'
                      : section < currentSection
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {submitResult && !submitResult.success && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {submitResult.message}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Parent Information */}
            {currentSection === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">1. Parent/Guardian Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="parent_name">Full Name *</Label>
                    <Input
                      id="parent_name"
                      {...register('parent_name')}
                      placeholder="Your full name"
                    />
                    {errors.parent_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.parent_name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="parent_email">Email *</Label>
                    <Input
                      id="parent_email"
                      type="email"
                      {...register('parent_email')}
                      placeholder="your@email.com"
                    />
                    {errors.parent_email && (
                      <p className="text-sm text-red-600 mt-1">{errors.parent_email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="parent_phone">Phone *</Label>
                    <Input
                      id="parent_phone"
                      {...register('parent_phone')}
                      placeholder="(209) 555-1234"
                    />
                    {errors.parent_phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.parent_phone.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="parent_address">Address *</Label>
                    <Input
                      id="parent_address"
                      {...register('parent_address')}
                      placeholder="Street address"
                    />
                    {errors.parent_address && (
                      <p className="text-sm text-red-600 mt-1">{errors.parent_address.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="parent_city">City *</Label>
                    <Input
                      id="parent_city"
                      {...register('parent_city')}
                      placeholder="City"
                    />
                    {errors.parent_city && (
                      <p className="text-sm text-red-600 mt-1">{errors.parent_city.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="parent_state">State *</Label>
                    <Input
                      id="parent_state"
                      {...register('parent_state')}
                      placeholder="CA"
                      maxLength={2}
                    />
                    {errors.parent_state && (
                      <p className="text-sm text-red-600 mt-1">{errors.parent_state.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="parent_zip">ZIP Code *</Label>
                    <Input
                      id="parent_zip"
                      {...register('parent_zip')}
                      placeholder="95382"
                      maxLength={10}
                    />
                    {errors.parent_zip && (
                      <p className="text-sm text-red-600 mt-1">{errors.parent_zip.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Child Information */}
            {currentSection === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">2. Child Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="child_first_name">First Name *</Label>
                    <Input
                      id="child_first_name"
                      {...register('child_first_name')}
                      placeholder="Child's first name"
                    />
                    {errors.child_first_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.child_first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="child_last_name">Last Name *</Label>
                    <Input
                      id="child_last_name"
                      {...register('child_last_name')}
                      placeholder="Child's last name"
                    />
                    {errors.child_last_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.child_last_name.message}</p>
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

                  <div>
                    <Label htmlFor="child_gender">Gender *</Label>
                    <Input
                      id="child_gender"
                      {...register('child_gender')}
                      placeholder="Male, Female, Other, or Prefer not to say"
                    />
                    {errors.child_gender && (
                      <p className="text-sm text-red-600 mt-1">{errors.child_gender.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Medical & Safety Information */}
            {currentSection === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">3. Medical & Safety Information</h3>

                <div className="space-y-4">
                  <div>
                    <Label>Does your child have any allergies? *</Label>
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
                        <Label htmlFor="allergies_description">Please describe allergies</Label>
                        <Textarea
                          id="allergies_description"
                          {...register('allergies_description')}
                          placeholder="Please describe any allergies..."
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Does your child have any medical conditions? *</Label>
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
                        <Label htmlFor="medical_conditions_description">Please describe medical conditions</Label>
                        <Textarea
                          id="medical_conditions_description"
                          {...register('medical_conditions_description')}
                          placeholder="Please describe any medical conditions..."
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="diagnosis">Diagnosis (Optional)</Label>
                    <div className="text-sm text-gray-500 mb-2">
                      Select all that apply from the list below
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {DIAGNOSIS_OPTIONS.map((diagnosis) => (
                        <label key={diagnosis} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            value={diagnosis}
                            {...register('diagnosis')}
                          />
                          <span>{diagnosis}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      History of seizures?
                      <HelpTooltip content="Has your child ever had a seizure or been diagnosed with epilepsy? This helps our instructors provide appropriate supervision and respond effectively if needed." />
                    </Label>
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

                  <div>
                    <Label>Is your child toilet trained? *</Label>
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

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Is your child non-ambulatory?
                      <HelpTooltip content="Non-ambulatory means your child cannot walk independently or has limited mobility. This includes children who use wheelchairs, walkers, or need physical assistance to move around." />
                    </Label>
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
                </div>
              </div>
            )}

            {/* Section 4: Behavioral Information */}
            {currentSection === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">4. Behavioral Information</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Does your child exhibit self-injurious behavior?
                      <HelpTooltip content="Self-injurious behavior includes head-banging, biting self, scratching, or other behaviors that may cause self-harm. Helps us implement appropriate safety measures and support strategies." />
                    </Label>
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
                        <Label htmlFor="self_injurious_description">Please describe self-injurious behavior</Label>
                        <Textarea
                          id="self_injurious_description"
                          {...register('self_injurious_description')}
                          placeholder="Please describe self-injurious behavior..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Does your child exhibit aggressive behavior toward others?
                      <HelpTooltip content="Aggressive behavior includes hitting, biting, kicking, throwing objects, or other behaviors that may pose risk to others. Helps create a safe environment for all swimmers." />
                    </Label>
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
                        <Label htmlFor="aggressive_behavior_description">Please describe aggressive behavior</Label>
                        <Textarea
                          id="aggressive_behavior_description"
                          {...register('aggressive_behavior_description')}
                          placeholder="Please describe aggressive behavior..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Does your child have a history of elopement (wandering/running away)?
                      <HelpTooltip content="Elopement means a tendency to wander or run away, especially in unfamiliar environments or near water. Critical for water safety and helps us implement appropriate supervision strategies." />
                    </Label>
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
                    {hasElopementHistory === 'yes' && (
                      <div className="mt-2">
                        <Label htmlFor="elopement_description">Please describe elopement history</Label>
                        <Textarea
                          id="elopement_description"
                          {...register('elopement_description')}
                          placeholder="Please describe elopement history..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Does your child have a behavior plan?
                      <HelpTooltip content="A behavior plan is a formal document from professionals (therapists, school teams) outlining strategies to address challenging behaviors. Share relevant info to help us provide consistent support." />
                    </Label>
                    <div className="flex space-x-4 mt-2">
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="yes" {...register('has_behavior_plan')} />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" value="no" {...register('has_behavior_plan')} />
                        <span>No</span>
                      </label>
                    </div>
                    {/* Note: behavior_plan_description field doesn't exist in database
                    {hasBehaviorPlan === 'yes' && (
                      <div className="mt-2">
                        <Label htmlFor="behavior_plan_description">Please describe behavior plan</Label>
                        <Textarea
                          id="behavior_plan_description"
                          {...register('behavior_plan_description')}
                          placeholder="Please describe behavior plan..."
                        />
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Swimming Background */}
            {currentSection === 5 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">5. Swimming Background</h3>

                <div className="space-y-4">
                  <div>
                    <Label>Has your child had previous swim lessons? *</Label>
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
                  </div>

                  <div>
                    <Label htmlFor="previous_swim_experience">Previous Swim Experience (Optional)</Label>
                    <Textarea
                      id="previous_swim_experience"
                      {...register('previous_swim_experience')}
                      placeholder="Please describe any previous swim experience..."
                    />
                  </div>

                  <div>
                    <Label>How comfortable is your child in the water? *</Label>
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
                    <Label htmlFor="swim_goals">Swim Goals *</Label>
                    <div className="text-sm text-gray-500 mb-2">
                      Select all that apply
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {SWIM_GOALS.map((goal) => (
                        <label key={goal} className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            value={goal}
                            {...register('swim_goals')}
                          />
                          <span className="text-sm">{goal}</span>
                        </label>
                      ))}
                    </div>
                    {errors.swim_goals && (
                      <p className="text-sm text-red-600 mt-1">{errors.swim_goals.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 6: Scheduling & Availability */}
            {currentSection === 6 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">6. Scheduling & Availability</h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="availability_slots">Availability Slots *</Label>
                    <div className="text-sm text-gray-500 mb-2">
                      Select all that apply
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {AVAILABILITY_SLOTS.map((slot) => (
                        <label key={slot} className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            value={slot}
                            {...register('availability_slots')}
                          />
                          <span className="text-sm">{slot}</span>
                        </label>
                      ))}
                    </div>
                    {errors.availability_slots && (
                      <p className="text-sm text-red-600 mt-1">{errors.availability_slots.message}</p>
                    )}
                  </div>

                  {otherAvailability && (
                    <div>
                      <Label htmlFor="other_availability">Please specify other availability</Label>
                      <Textarea
                        id="other_availability"
                        {...register('other_availability')}
                        placeholder="Please specify other availability..."
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="flexible_swimmer"
                      checked={watch('flexible_swimmer')}
                      onCheckedChange={(checked) => setValue('flexible_swimmer', checked === true, { shouldValidate: true })}
                    />
                    <Label htmlFor="flexible_swimmer" className="font-normal">
                      I understand that I may need to be flexible with my schedule to secure a spot
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Section 7: Consent & Agreement */}
            {currentSection === 7 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">7. Consent & Agreement</h3>

                {/* Liability Waiver */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="signed_waiver"
                        checked={watch('signed_waiver')}
                        onCheckedChange={(checked) => setValue('signed_waiver', checked === true, { shouldValidate: true })}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="signed_waiver" className="font-semibold">
                          Liability Waiver Agreement *
                        </Label>
                        <p className="text-sm text-gray-600">
                          I have read and agree to the{' '}
                          <LiabilityWaiverModal />
                          . I understand the risks associated with swim lessons and release I Can Swim from liability.
                        </p>
                        {errors.signed_waiver && (
                          <p className="text-sm text-red-600 mt-1">{errors.signed_waiver.message}</p>
                        )}
                      </div>
                    </div>

                    {watch('signed_waiver') && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="liability_waiver_signature">
                          Parent/Guardian Signature *
                        </Label>
                        <Input
                          id="liability_waiver_signature"
                          {...register('liability_waiver_signature')}
                          placeholder="Type your full legal name as signature"
                          className="max-w-md"
                        />
                        {errors.liability_waiver_signature && (
                          <p className="text-sm text-red-600 mt-1">{errors.liability_waiver_signature.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          By typing your name, you are electronically signing this waiver.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo/Video Release */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="photo_release"
                        checked={watch('photo_release')}
                        onCheckedChange={(checked) => setValue('photo_release', checked === true, { shouldValidate: true })}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="photo_release" className="font-semibold">
                          Photo/Video Release (Optional)
                        </Label>
                        <p className="text-sm text-gray-600">
                          I grant permission for I Can Swim to use photos/videos of my child for promotional materials, website, and social media.
                        </p>
                      </div>
                    </div>

                    {watch('photo_release') && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="photo_release_signature">
                          Parent/Guardian Signature (Required if granting permission)
                        </Label>
                        <Input
                          id="photo_release_signature"
                          {...register('photo_release_signature')}
                          placeholder="Type your full legal name as signature"
                          className="max-w-md"
                        />
                        {errors.photo_release_signature && (
                          <p className="text-sm text-red-600 mt-1">{errors.photo_release_signature.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          By typing your name, you are electronically signing this release.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="cancellation_policy_agreement"
                        checked={watch('cancellation_policy_agreement')}
                        onCheckedChange={(checked) => setValue('cancellation_policy_agreement', checked === true, { shouldValidate: true })}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="cancellation_policy_agreement" className="font-semibold">
                          Cancellation Policy Agreement *
                        </Label>
                        <p className="text-sm text-gray-600">
                          I have read and agree to the{' '}
                          <CancellationPolicyModal />
                          . I understand that cancellations made less than 24 hours before a session may result in Flexible Swimmer status.
                        </p>
                        {errors.cancellation_policy_agreement && (
                          <p className="text-sm text-red-600 mt-1">{errors.cancellation_policy_agreement.message}</p>
                        )}
                      </div>
                    </div>

                    {watch('cancellation_policy_agreement') && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="cancellation_policy_signature">
                          Parent/Guardian Signature *
                        </Label>
                        <Input
                          id="cancellation_policy_signature"
                          {...register('cancellation_policy_signature')}
                          placeholder="Type your full legal name as signature"
                          className="max-w-md"
                        />
                        {errors.cancellation_policy_signature && (
                          <p className="text-sm text-red-600 mt-1">{errors.cancellation_policy_signature.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          By typing your name, you are electronically signing this agreement.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Emergency Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">Emergency Contact Name *</Label>
                      <Input
                        id="emergency_contact_name"
                        {...register('emergency_contact_name')}
                        placeholder="Full name"
                      />
                      {errors.emergency_contact_name && (
                        <p className="text-sm text-red-600 mt-1">{errors.emergency_contact_name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="emergency_contact_phone">Emergency Contact Phone *</Label>
                      <Input
                        id="emergency_contact_phone"
                        {...register('emergency_contact_phone')}
                        placeholder="(209) 555-1234"
                      />
                      {errors.emergency_contact_phone && (
                        <p className="text-sm text-red-600 mt-1">{errors.emergency_contact_phone.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="emergency_contact_relationship">Relationship to Child *</Label>
                      <Input
                        id="emergency_contact_relationship"
                        {...register('emergency_contact_relationship')}
                        placeholder="e.g., Mother, Father, Grandparent, etc."
                      />
                      {errors.emergency_contact_relationship && (
                        <p className="text-sm text-red-600 mt-1">{errors.emergency_contact_relationship.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevSection}
                disabled={currentSection === 1}
              >
                Previous
              </Button>

              {currentSection < 7 ? (
                <Button type="button" onClick={nextSection}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Enrollment
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}