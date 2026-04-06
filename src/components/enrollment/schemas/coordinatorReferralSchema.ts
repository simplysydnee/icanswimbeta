import { z } from 'zod';

/** Fields sent to POST /api/coordinator/referral — all required */
export const coordinatorReferralSchema = z.object({
  child_first_name: z.string().trim().min(1, "Child's first name is required"),
  child_last_name: z.string().trim().min(1, "Child's last name is required"),
  child_date_of_birth: z.string().min(1, 'Date of birth is required'),
  child_gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Gender is required',
  }),

  parent_name: z.string().trim().min(1, 'Parent / guardian name is required'),
  parent_email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  parent_phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine(
      (v) => v.replace(/\D/g, '').length >= 10,
      'Enter a valid phone number (at least 10 digits)'
    ),
  parent_address: z.string().trim().min(1, 'Street address is required'),
  parent_city: z.string().trim().min(1, 'City is required'),
  parent_state: z
    .string()
    .trim()
    .min(2, 'State is required')
    .max(2, 'Use 2-letter state code'),
  parent_zip: z
    .string()
    .trim()
    .min(1, 'ZIP code is required')
    .refine((v) => /^\d{5}(-\d{4})?$/.test(v), 'Enter a valid ZIP code'),
});

export type CoordinatorReferralFormValues = z.infer<typeof coordinatorReferralSchema>;

export const coordinatorReferralStep1Fields: (keyof CoordinatorReferralFormValues)[] = [
  'child_first_name',
  'child_last_name',
  'child_date_of_birth',
  'child_gender',
];
