import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface UseEnrollmentSubmitOptions {
  onSuccess?: (swimmerId: string) => void;
  redirectTo?: string;
}

export function useEnrollmentSubmit(options?: UseEnrollmentSubmitOptions) {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      // Transform form data to API format
      const swimmerData = {
        // Child Information
        first_name: data.child_first_name,
        last_name: data.child_last_name,
        date_of_birth: data.child_date_of_birth,
        gender: data.child_gender,

        // Parent Information
        parent_name: data.parent_name,
        parent_email: data.parent_email,
        parent_phone: data.parent_phone,
        parent_address: data.parent_address,
        parent_city: data.parent_city,
        parent_state: data.parent_state,
        parent_zip: data.parent_zip,

        // Payment Information
        payment_type: data.payment_type === 'private_pay' ? 'private_pay' : 'funding_source',
        funding_source_id: data.funding_source_id || null,

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

        // Swimming Background
        previous_swim_lessons: data.previous_swim_lessons,
        previous_swim_experience: data.previous_swim_experience || null,
        comfortable_in_water: data.comfortable_in_water,
        swim_goals: data.swim_goals,

        // Scheduling
        availability_slots: data.availability_slots,
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
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        emergency_contact_relationship: data.emergency_contact_relationship,

        // Enrollment status
        enrollment_status: 'pending_enrollment',
      };

      return apiClient.createSwimmer(swimmerData);
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