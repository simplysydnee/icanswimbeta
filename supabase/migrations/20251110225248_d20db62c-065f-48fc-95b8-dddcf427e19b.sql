-- Add diagnosis enum type
CREATE TYPE diagnosis_type AS ENUM (
  'ADD/ADHD',
  'Autism',
  'Developmental Disability',
  'Learning Disability',
  'Sensory Processing',
  'Speech Delay'
);

-- Add new columns to vmrc_referral_requests table
ALTER TABLE vmrc_referral_requests
ADD COLUMN child_date_of_birth DATE,
ADD COLUMN diagnosis diagnosis_type,
ADD COLUMN non_ambulatory BOOLEAN DEFAULT false,
ADD COLUMN has_seizure_disorder BOOLEAN DEFAULT false,
ADD COLUMN child_height TEXT,
ADD COLUMN child_weight TEXT,
ADD COLUMN toilet_trained BOOLEAN,
ADD COLUMN has_medical_conditions BOOLEAN DEFAULT false,
ADD COLUMN medical_conditions_description TEXT,
ADD COLUMN has_allergies BOOLEAN DEFAULT false,
ADD COLUMN allergies_description TEXT,
ADD COLUMN has_other_therapies BOOLEAN DEFAULT false,
ADD COLUMN other_therapies_description TEXT,
ADD COLUMN comfortable_in_water BOOLEAN,
ADD COLUMN self_injurious_behavior BOOLEAN DEFAULT false,
ADD COLUMN self_injurious_description TEXT,
ADD COLUMN aggressive_behavior BOOLEAN DEFAULT false,
ADD COLUMN aggressive_behavior_description TEXT,
ADD COLUMN elopement_behavior BOOLEAN DEFAULT false,
ADD COLUMN elopement_description TEXT,
ADD COLUMN has_safety_plan BOOLEAN DEFAULT false,
ADD COLUMN safety_plan_description TEXT;

-- Remove child_age column since we now have date_of_birth
ALTER TABLE vmrc_referral_requests DROP COLUMN IF EXISTS child_age;