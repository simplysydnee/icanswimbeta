import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enrollmentSchema, stepSchemas, EnrollmentFormData } from '../schemas/enrollmentSchema';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      // Child Information
      child_first_name: options?.queryParams?.firstName || '',
      child_last_name: options?.queryParams?.lastName || '',
      child_date_of_birth: options?.queryParams?.dob || '',
      child_gender: '',

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
      availability: [],
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
      terms_of_service_agreed: false,
      terms_of_service_signature: '',
      cancellation_quiz_passed: false,
      cancellation_acknowledged_24hr: false,
      cancellation_acknowledged_consequences: false,
      privacy_policy_agreed: false,
      privacy_policy_signature: '',
      sms_consent_given: false,
      guardian_relationship: '',
    },
    mode: 'onSubmit', // Validate on blur for better UX

  });

  // Parent info is resolved server-side from the authed user's profile; the
  // enrollment schema no longer includes parent fields so there's nothing to
  // auto-fill here.

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