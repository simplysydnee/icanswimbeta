import { z } from 'zod';

// Child Information Schema
export const childInfoSchema = z.object({
  child_first_name: z.string().min(1, "Child's first name is required"),
  child_last_name: z.string().min(1, "Child's last name is required"),
  child_date_of_birth: z.string().min(1, "Date of birth is required"),
  child_gender: z.string().min(1, 'Gender is required'),
  funding_source_id: z.string().optional(),
  funding_coordinator_name: z.string().optional(),
  funding_coordinator_email: z.string().optional(),
  funding_coordinator_phone: z.string().optional(),
});

// Parent Information Schema
export const parentInfoSchema = z.object({
  parent_name: z.string().min(1, 'Your name is required'),
  parent_email: z.string().email('Valid email is required'),
  parent_phone: z.string().min(10, 'Phone number is required'),
  parent_address: z.string().min(1, 'Address is required'),
  parent_city: z.string().min(1, 'City is required'),
  parent_state: z.string().min(2, 'State is required'),
  parent_zip: z.string().min(5, 'ZIP code is required'),
});

// Payment Information Schema - Base schema without refinements
const paymentInfoBaseSchema = z.object({
  payment_type: z.enum(['private_pay', 'funding_source'], {
    required_error: 'Please select payment type'
  }),
  funding_source_id: z.string().optional(),
});

export const paymentInfoSchema = paymentInfoBaseSchema.refine(
  (data) => data.payment_type !== 'funding_source' || !!data.funding_source_id,
  { message: 'Please select a funding source', path: ['funding_source_id'] }
);

// Medical Information Schema - Base schema without refinements
const medicalInfoBaseSchema = z.object({
  has_allergies: z.enum(['yes', 'no']).optional(),
  allergies_description: z.string().optional(),
  has_medical_conditions: z.enum(['yes', 'no']).optional(),
  medical_conditions_description: z.string().optional(),
  diagnosis: z.array(z.string()).optional(),
  history_of_seizures: z.enum(['yes', 'no']).optional(),
  toilet_trained: z.enum(['yes', 'no', 'sometimes']).optional(),
  non_ambulatory: z.enum(['yes', 'no']).optional(),
});

export const medicalInfoSchema = medicalInfoBaseSchema.refine(
  (data) => data.has_allergies !== 'yes' || !!data.allergies_description?.trim(),
  { message: 'Please describe the allergies', path: ['allergies_description'] }
).refine(
  (data) => data.has_medical_conditions !== 'yes' || !!data.medical_conditions_description?.trim(),
  { message: 'Please describe the conditions', path: ['medical_conditions_description'] }
);

// Behavioral Information Schema - Base schema without refinements
const behavioralInfoBaseSchema = z.object({
  self_injurious_behavior: z.enum(['yes', 'no']).optional(),
  self_injurious_description: z.string().optional(),
  aggressive_behavior: z.enum(['yes', 'no']).optional(),
  aggressive_behavior_description: z.string().optional(),
  elopement_history: z.enum(['yes', 'no']).optional(),
  elopement_description: z.string().optional(),
  has_behavior_plan: z.enum(['yes', 'no']).optional(),
});

export const behavioralInfoSchema = behavioralInfoBaseSchema.refine(
  (data) => data.self_injurious_behavior !== 'yes' || !!data.self_injurious_description?.trim(),
  { message: 'Please describe the self-injurious behavior', path: ['self_injurious_description'] }
).refine(
  (data) => data.aggressive_behavior !== 'yes' || !!data.aggressive_behavior_description?.trim(),
  { message: 'Please describe the aggressive behavior', path: ['aggressive_behavior_description'] }
).refine(
  (data) => data.elopement_history !== 'yes' || !!data.elopement_description?.trim(),
  { message: 'Please describe the elopement history', path: ['elopement_description'] }
);

// Swimming Background Schema
export const swimmingBackgroundSchema = z.object({
  previous_swim_lessons: z.enum(['yes', 'no']).optional(),
  previous_swim_experience: z.string().optional(),
  comfortable_in_water: z.enum(['very', 'somewhat', 'not_at_all']).optional(),
  swim_goals: z.array(z.string()).min(1, 'At least one swim goal is required'),
});

// Scheduling Schema
export const schedulingSchema = z.object({
  availability: z.array(z.string()).min(1, 'At least one availability slot is required'),
  other_availability: z.string().optional(),
  flexible_swimmer: z.boolean(),
});

// Consent & Agreements Schema
 const consentBaseSchema = z.object({
  // Electronic Signature Consent (ESIGN Act Compliance)
  electronic_consent: z.boolean().refine(val => val === true, {
    message: 'You must consent to electronic signatures to continue',
  }),
  signature_timestamp: z.string().optional(),
  signature_ip: z.string().optional(),
  signature_user_agent: z.string().optional(),

  // Section 7: Consent & Agreement
  signed_waiver: z.boolean().refine(val => val === true, {
    message: 'You must agree to the liability waiver',
  }),
  liability_waiver_signature: z.string(),
  photo_release: z.boolean(),
  photo_release_signature: z.string().optional(),
  cancellation_policy_agreement: z.boolean().refine(val => val === true, {
    message: 'You must agree to the cancellation policy',
  }),
  cancellation_policy_signature: z.string().optional(),
  // emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  // emergency_contact_phone: z.string().min(10, 'Emergency contact phone is required'),
  // emergency_contact_relationship: z.string().min(1, 'Relationship is required'),
})
export const consentSchema = consentBaseSchema.superRefine((data, ctx) => {

  if (data.signed_waiver && !data.liability_waiver_signature?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['liability_waiver_signature'],
      message: 'Liability waiver signature is required',
    });
  }

  if (data.cancellation_policy_agreement && !data.cancellation_policy_signature?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cancellation_policy_signature'],
      message: 'Cancellation policy signature is required',
    });
  }

  if (data.photo_release && !data.photo_release_signature?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['photo_release_signature'],
      message: 'Photo release signature is required',
    });
  }

});

const fundamentalInfoBaseSchema = z.object({
  communication_type: z.enum(['verbal', 'non_verbal', 'other'], {
    required_error: 'Please select a communication type'
  }),
  strengths_interests: z.string().min(1, 'Please describe strengths & interests'),
  motivators: z.string().min(1, 'Please provide motivators'),
  other_therapies: z.enum(['yes', 'no']),
  therapies_description: z.string().optional().nullable(),
});

export const fundamentalInfoSchema = fundamentalInfoBaseSchema.refine(
  (data) => data.other_therapies !== 'yes' || !!data.therapies_description?.trim(),
  { message: 'Please describe other therapies', path: ['therapies_description'] }
);


// Full enrollment schema combining all sections
export const enrollmentSchema = z.object({
  ...childInfoSchema.shape,
  // ...parentInfoSchema.shape,
  ...paymentInfoBaseSchema.shape,
  ...medicalInfoBaseSchema.shape,
  ...behavioralInfoBaseSchema.shape,
  ...fundamentalInfoBaseSchema.shape,
  ...swimmingBackgroundSchema.shape,
  ...schedulingSchema.shape,
  ...consentBaseSchema.shape,
}).superRefine((data, ctx) => {
  consentSchema.parse(data); // reuse validation
});

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

// Step-specific schemas for validation
export const stepSchemas = {
  1: childInfoSchema.merge(paymentInfoBaseSchema),
  // 2: parentInfoSchema,
  2: medicalInfoBaseSchema,
  3: behavioralInfoBaseSchema,
  4: fundamentalInfoBaseSchema, 
  5: swimmingBackgroundSchema,
  6: schedulingSchema,
  7: consentSchema,
};

