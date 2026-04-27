import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface UseEnrollmentSubmitOptions {
  onSuccess?: (swimmerId: string) => void;
  redirectTo?: string;
}

export function useEnrollmentSubmit(options?: UseEnrollmentSubmitOptions) {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const supabase = createClient();

  return useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      const paymentType = data.payment_type === 'private_pay' ? 'private_pay' : 'funding_source';

      // Transform form data to API format
      const swimmerData = {
        // Child Information
        first_name: data.child_first_name,
        last_name: data.child_last_name,
        date_of_birth: data.child_date_of_birth,
        gender: data.child_gender,

        // Payment Information
        payment_type: paymentType,
        funding_source_id: data.funding_source_id || null,
        coordinator_id: data.funding_coordinator_id || null,

        // Medical Information
        has_allergies: data.has_allergies,
        allergies_description: data.allergies_description || null,
        has_medical_conditions: data.has_medical_conditions,
        medical_conditions_description: data.medical_conditions_description || null,
        diagnosis: data.diagnosis || [],
        history_of_seizures: data.history_of_seizures,
        toilet_trained: data.toilet_trained,
        non_ambulatory: data.non_ambulatory,

        // Behavioral Information
        self_injurious_behavior: data.self_injurious_behavior,
        self_injurious_description: data.self_injurious_description || null,
        aggressive_behavior: data.aggressive_behavior,
        aggressive_behavior_description: data.aggressive_behavior_description || null,
        elopement_history: data.elopement_history,
        elopement_description: data.elopement_description || null,
        has_behavior_plan: data.has_behavior_plan,

        // Fundamental Information (new)
        communication_type: data.communication_type ?? null,
        strengths_interests: data.strengths_interests || null,
        motivators: data.motivators || null,
        // keep 'other_therapies' as the same shape the form provides (zod default is 'no')
        other_therapies: typeof data.other_therapies === 'boolean' ? data.other_therapies : (data.other_therapies ?? 'no'),
        therapies_description: data.therapies_description || null,

        // Swimming Background
        previous_swim_lessons: data.previous_swim_lessons,
        previous_swim_experience: data.previous_swim_experience || null,
        comfortable_in_water: data.comfortable_in_water,
        swim_goals: data.swim_goals,

        // Scheduling
        availability: data.availability,
        other_availability: data.other_availability || null,
        flexible_swimmer: data.flexible_swimmer,

        // Consent & Agreements
        electronic_consent: data.electronic_consent,
        signature_timestamp: data.signature_timestamp || null,
        signature_ip: data.signature_ip || null,
        signature_user_agent: data.signature_user_agent || null,
        signed_waiver: data.signed_waiver,
        liability_waiver_signature: data.liability_waiver_signature || null,
        photo_release: data.photo_release,
        photo_release_signature: data.photo_release_signature || null,
        cancellation_policy_agreement: data.cancellation_policy_agreement,
        cancellation_policy_signature: data.cancellation_policy_signature || null,

        // New consent fields
        terms_of_service_agreed: data.terms_of_service_agreed,
        terms_of_service_signature: data.terms_of_service_signature || null,
        cancellation_quiz_passed: data.cancellation_quiz_passed,
        cancellation_acknowledged_24hr: data.cancellation_acknowledged_24hr,
        cancellation_acknowledged_consequences: data.cancellation_acknowledged_consequences,
        privacy_policy_agreed: data.privacy_policy_agreed,
        privacy_policy_signature: data.privacy_policy_signature || null,
        sms_consent_given: data.sms_consent_given,
        guardian_relationship: data.guardian_relationship,

        // Enrollment status
        enrollment_status: 'pending_enrollment',
      };
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      // return apiClient.createSwimmer(swimmerData);
      const res = await fetch('/api/swimmers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`,
        },
    
        body: JSON.stringify(swimmerData),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          payload?.error || payload?.message || 'Failed to create swimmer';
        throw new Error(message);
      }

      // endpoint returns { swimmer: inserted } — normalize to swimmer object
      const created = payload?.swimmer ?? payload;
      return created;
    },
    onSuccess: (newSwimmer) => {
      toast({
        title: 'Success!',
        description: `${newSwimmer.first_name} has been enrolled successfully.`,
      });

      // Invalidate swimmers query to refresh list
      queryClient.invalidateQueries({ queryKey: ['swimmers'] });
      queryClient.invalidateQueries({ queryKey: ['parent-swimmers'] });

      if (options?.onSuccess) {
        options.onSuccess(newSwimmer.id);
      } else {
        router.push(options?.redirectTo || `/parent/swimmers/${newSwimmer.id}`);
      }
    },
    onError: (error: Error) => {
      console.error('Enrollment submission error:', error);
      toast({
        title: 'Enrollment Failed',
        description: error.message || 'Please check your information and try again.',
        variant: 'destructive',
      });
    },
  });
}