import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enrollmentSchema, stepSchemas, EnrollmentFormData } from '../schemas/enrollmentSchema';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseEnrollmentFormOptions {
  preSelectedPaymentType?: 'private_pay' | 'funding_source';
  preSelectedFundingSourceId?: string;
  queryParams?: {
    firstName?: string;
    lastName?: string;
    dob?: string;
  };
}

export function useEnrollmentForm(options?: UseEnrollmentFormOptions) {
  const { user, loading: authLoading, profile } = useAuth();
  const router = useRouter();

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      // Child Information
      child_first_name: options?.queryParams?.firstName || '',
      child_last_name: options?.queryParams?.lastName || '',
      child_date_of_birth: options?.queryParams?.dob || '',
      child_gender: '',

      // Parent Information
      parent_name: '',
      parent_email: '',
      parent_phone: '',
      parent_address: '',
      parent_city: '',
      parent_state: 'CA',
      parent_zip: '',

      // Payment Information
      payment_type: options?.preSelectedPaymentType || undefined,
      funding_source_id: options?.preSelectedFundingSourceId || undefined,

      // Medical Information
      has_allergies: undefined,
      allergies_description: '',
      has_medical_conditions: undefined,
      medical_conditions_description: '',
      diagnosis: [],
      history_of_seizures: undefined,
      toilet_trained: undefined,
      non_ambulatory: undefined,

      // Behavioral Information
      self_injurious_behavior: undefined,
      self_injurious_description: '',
      aggressive_behavior: undefined,
      aggressive_behavior_description: '',
      elopement_history: undefined,
      elopement_description: '',
      has_behavior_plan: undefined,

      // Swimming Background
      previous_swim_lessons: undefined,
      previous_swim_experience: '',
      comfortable_in_water: undefined,
      swim_goals: [],

      // Scheduling
      availability_slots: [],
      other_availability: '',
      flexible_swimmer: false,

      // Consent & Agreements
      electronic_consent: false,
      signature_timestamp: '',
      signature_ip: '',
      signature_user_agent: '',
      signed_waiver: false,
      liability_waiver_signature: '',
      photo_release: false,
      photo_release_signature: '',
      cancellation_policy_agreement: false,
      cancellation_policy_signature: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Auto-fill parent info when user is authenticated
  useEffect(() => {
    if (profile && !authLoading) {
      const currentValues = form.getValues();

      // Only set values if they're currently empty to avoid overwriting user edits
      if (!currentValues.parent_name && profile.full_name) {
        form.setValue('parent_name', profile.full_name);
      }
      if (!currentValues.parent_email && (profile.email || user?.email)) {
        form.setValue('parent_email', profile.email || user?.email || '');
      }
      if (!currentValues.parent_phone && profile.phone) {
        form.setValue('parent_phone', profile.phone);
      }
      // Note: Address fields might not be in the profile table yet
      // We can add them later if needed
    }
  }, [profile, authLoading, user, form]);

  // Validate specific step
  const validateStep = async (step: number): Promise<boolean> => {
    const schema = stepSchemas[step as keyof typeof stepSchemas];
    if (!schema) return true;

    // Get field names from the schema - need to handle Zod types properly
    const shape = schema._def.shape();
    const fields = Object.keys(shape) as (keyof EnrollmentFormData)[];
    const result = await form.trigger(fields);
    return result;
  };

  // Function to format name fields on blur
  const handleNameBlur = (fieldName: keyof EnrollmentFormData) => {
    return (event: React.FocusEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value && value.trim()) {
        // Import formatNameField from name-utils
        import('@/lib/name-utils').then(({ formatNameField }) => {
          const formatted = formatNameField(value);
          if (formatted !== value) {
            form.setValue(fieldName, formatted, { shouldValidate: true });
          }
        });
      }
    };
  };

  // Capture signature metadata for audit trail
  const captureSignatureMetadata = () => {
    form.setValue('signature_timestamp', new Date().toISOString());
    form.setValue('signature_user_agent', navigator.userAgent);
    // IP address will be captured server-side via API
  };

  // Check if user needs to authenticate
  const checkAuthentication = (currentStep: number): boolean => {
    if (currentStep === 1 && !user) {
      // Save form state and redirect to signup
      const formData = form.getValues();
      localStorage.setItem('pendingEnrollment', JSON.stringify(formData));

      const searchParams = new URLSearchParams({
        redirect: '/enroll/private'
      });

      const childFirstName = formData.child_first_name;
      const childLastName = formData.child_last_name;
      if (childFirstName && childLastName) {
        searchParams.append('child', `${childFirstName} ${childLastName}`);
      }

      router.push(`/signup?${searchParams.toString()}`);
      return false;
    }
    return true;
  };

  return {
    form,
    validateStep,
    handleNameBlur,
    captureSignatureMetadata,
    checkAuthentication,
    isAuthenticated: !!user,
    authLoading,
  };
}