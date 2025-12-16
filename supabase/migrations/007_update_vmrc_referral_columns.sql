-- Migration: Update vmrc_referral_requests table for admin referrals page
-- This adds missing columns and updates data types for the new admin referrals system

-- Add missing columns
ALTER TABLE vmrc_referral_requests
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS coordinator_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS history_of_seizures BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_behavior_plan BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS behavior_plan_description TEXT;

-- Update diagnosis from TEXT to TEXT[] if needed
-- First check if we need to convert
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vmrc_referral_requests'
        AND column_name = 'diagnosis'
        AND data_type = 'text'
    ) THEN
        -- Create a temporary column
        ALTER TABLE vmrc_referral_requests ADD COLUMN diagnosis_array TEXT[];

        -- Convert comma-separated values to array
        UPDATE vmrc_referral_requests
        SET diagnosis_array = string_to_array(TRIM(diagnosis), ',');

        -- Drop old column
        ALTER TABLE vmrc_referral_requests DROP COLUMN diagnosis;

        -- Rename new column
        ALTER TABLE vmrc_referral_requests RENAME COLUMN diagnosis_array TO diagnosis;
    END IF;
END $$;

-- Update boolean columns from TEXT to BOOLEAN
-- has_medical_conditions
ALTER TABLE vmrc_referral_requests
ALTER COLUMN has_medical_conditions TYPE BOOLEAN
USING CASE
    WHEN has_medical_conditions = 'yes' THEN TRUE
    WHEN has_medical_conditions = 'no' THEN FALSE
    ELSE NULL
END;

-- has_allergies
ALTER TABLE vmrc_referral_requests
ALTER COLUMN has_allergies TYPE BOOLEAN
USING CASE
    WHEN has_allergies = 'yes' THEN TRUE
    WHEN has_allergies = 'no' THEN FALSE
    ELSE NULL
END;

-- comfortable_in_water
ALTER TABLE vmrc_referral_requests
ALTER COLUMN comfortable_in_water TYPE BOOLEAN
USING CASE
    WHEN comfortable_in_water = 'yes' THEN TRUE
    WHEN comfortable_in_water = 'no' THEN FALSE
    ELSE NULL
END;

-- self_injurious_behavior
ALTER TABLE vmrc_referral_requests
ALTER COLUMN self_injurious_behavior TYPE BOOLEAN
USING CASE
    WHEN self_injurious_behavior = 'yes' THEN TRUE
    WHEN self_injurious_behavior = 'no' THEN FALSE
    ELSE NULL
END;

-- aggressive_behavior
ALTER TABLE vmrc_referral_requests
ALTER COLUMN aggressive_behavior TYPE BOOLEAN
USING CASE
    WHEN aggressive_behavior = 'yes' THEN TRUE
    WHEN aggressive_behavior = 'no' THEN FALSE
    ELSE NULL
END;

-- elopement_behavior
ALTER TABLE vmrc_referral_requests
ALTER COLUMN elopement_behavior TYPE BOOLEAN
USING CASE
    WHEN elopement_behavior = 'yes' THEN TRUE
    WHEN elopement_behavior = 'no' THEN FALSE
    ELSE NULL
END;

-- non_ambulatory
ALTER TABLE vmrc_referral_requests
ALTER COLUMN non_ambulatory TYPE BOOLEAN
USING CASE
    WHEN non_ambulatory = 'yes' THEN TRUE
    WHEN non_ambulatory = 'no' THEN FALSE
    ELSE NULL
END;

-- Map has_safety_plan to has_behavior_plan
UPDATE vmrc_referral_requests
SET has_behavior_plan = CASE
    WHEN has_safety_plan = 'yes' THEN TRUE
    WHEN has_safety_plan = 'no' THEN FALSE
    ELSE FALSE
END,
behavior_plan_description = safety_plan_description;

-- Map has_seizure_disorder to history_of_seizures
UPDATE vmrc_referral_requests
SET history_of_seizures = CASE
    WHEN has_seizure_disorder = 'yes' THEN TRUE
    WHEN has_seizure_disorder = 'no' THEN FALSE
    ELSE FALSE
END;

-- Update column names for consistency
ALTER TABLE vmrc_referral_requests
RENAME COLUMN self_injurious_description TO self_injurious_behavior_description;

ALTER TABLE vmrc_referral_requests
RENAME COLUMN elopement_description TO elopement_behavior_description;

-- Add default values for new boolean columns
ALTER TABLE vmrc_referral_requests
ALTER COLUMN has_medical_conditions SET DEFAULT FALSE,
ALTER COLUMN has_allergies SET DEFAULT FALSE,
ALTER COLUMN comfortable_in_water SET DEFAULT FALSE,
ALTER COLUMN self_injurious_behavior SET DEFAULT FALSE,
ALTER COLUMN aggressive_behavior SET DEFAULT FALSE,
ALTER COLUMN elopement_behavior SET DEFAULT FALSE,
ALTER COLUMN non_ambulatory SET DEFAULT FALSE;

-- Update existing NULL values
UPDATE vmrc_referral_requests
SET
    has_medical_conditions = COALESCE(has_medical_conditions, FALSE),
    has_allergies = COALESCE(has_allergies, FALSE),
    comfortable_in_water = COALESCE(comfortable_in_water, FALSE),
    self_injurious_behavior = COALESCE(self_injurious_behavior, FALSE),
    aggressive_behavior = COALESCE(aggressive_behavior, FALSE),
    elopement_behavior = COALESCE(elopement_behavior, FALSE),
    non_ambulatory = COALESCE(non_ambulatory, FALSE),
    history_of_seizures = COALESCE(history_of_seizures, FALSE),
    has_behavior_plan = COALESCE(has_behavior_plan, FALSE);

-- Add comment for documentation
COMMENT ON TABLE vmrc_referral_requests IS 'VMRC referral requests with parent completion flow for admin review';