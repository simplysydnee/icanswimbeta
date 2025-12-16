-- Migration: 014_rename_to_referral_requests.sql
-- Description: Renames referral table to generic name for multiple funding sources
-- This migration handles both cases: if table is still vmrc_referral_requests or funding_source_referral_requests

-- Step 1: Check which table exists and rename to referral_requests
DO $$
BEGIN
    -- Check if vmrc_referral_requests exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'vmrc_referral_requests'
        AND table_schema = 'public'
    ) THEN
        -- Rename vmrc_referral_requests to referral_requests
        ALTER TABLE public.vmrc_referral_requests RENAME TO referral_requests;
        RAISE NOTICE 'Renamed vmrc_referral_requests to referral_requests';

    -- Check if funding_source_referral_requests exists (from migration 012)
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'funding_source_referral_requests'
        AND table_schema = 'public'
    ) THEN
        -- Rename funding_source_referral_requests to referral_requests
        ALTER TABLE public.funding_source_referral_requests RENAME TO referral_requests;
        RAISE NOTICE 'Renamed funding_source_referral_requests to referral_requests';

    -- Check if referral_requests already exists
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'referral_requests'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'referral_requests table already exists';

    ELSE
        RAISE NOTICE 'No referral table found to rename';
    END IF;
END $$;

-- Step 2: Update table comment
COMMENT ON TABLE public.referral_requests IS 'Referral requests from all funding sources for swimmer enrollment';

-- Step 3: Ensure funding_source_id column exists (for backward compatibility with migration 012)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'referral_requests'
        AND column_name = 'funding_source_id'
    ) THEN
        ALTER TABLE public.referral_requests
        ADD COLUMN funding_source_id UUID REFERENCES public.funding_sources(id);
        RAISE NOTICE 'Added funding_source_id column to referral_requests';
    END IF;
END $$;

-- Step 4: Update referral_type to be more generic if needed
-- Note: referral_type already exists in the original table definition
-- We'll keep it as is since it can store 'vmrc_client', 'scholarship_applicant', 'coordinator_referral', 'other'

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_requests_status ON public.referral_requests(status);
CREATE INDEX IF NOT EXISTS idx_referral_requests_parent_token ON public.referral_requests(parent_token);
CREATE INDEX IF NOT EXISTS idx_referral_requests_parent_email ON public.referral_requests(parent_email);
CREATE INDEX IF NOT EXISTS idx_referral_requests_created_at ON public.referral_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_referral_requests_funding_source_id ON public.referral_requests(funding_source_id);

-- Step 6: Update RLS policies if they reference old table name
-- Note: Original policies allow anyone to create/view/update, which is fine for now
-- We'll keep existing policies since they apply to the renamed table