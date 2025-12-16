-- SQL to manually rename vmrc_referral_requests to referral_requests
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jtqlamkrhdfwtmaubfrc/sql

-- 1. First check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'vmrc_referral_requests'
) as vmrc_table_exists;

SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'funding_source_referral_requests'
) as funding_source_table_exists;

SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'referral_requests'
) as referral_table_exists;

-- 2. Based on results, run appropriate rename:
-- If vmrc_referral_requests exists and referral_requests doesn't:
-- ALTER TABLE public.vmrc_referral_requests RENAME TO referral_requests;

-- If funding_source_referral_requests exists and referral_requests doesn't:
-- ALTER TABLE public.funding_source_referral_requests RENAME TO referral_requests;

-- 3. Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_referral_requests_status ON public.referral_requests(status);
CREATE INDEX IF NOT EXISTS idx_referral_requests_parent_token ON public.referral_requests(parent_token);
CREATE INDEX IF NOT EXISTS idx_referral_requests_parent_email ON public.referral_requests(parent_email);
CREATE INDEX IF NOT EXISTS idx_referral_requests_created_at ON public.referral_requests(created_at);

-- 4. Update table comment
COMMENT ON TABLE public.referral_requests IS 'Referral requests from all funding sources for swimmer enrollment';

-- 5. Check if funding_source_id column exists (from migration 012)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'referral_requests'
AND column_name = 'funding_source_id';

-- If it doesn't exist, you may want to add it:
-- ALTER TABLE public.referral_requests
-- ADD COLUMN funding_source_id UUID REFERENCES public.funding_sources(id);

-- 6. Verify the rename worked
SELECT
    (SELECT COUNT(*) FROM public.referral_requests) as total_referrals,
    (SELECT COUNT(*) FROM public.referral_requests WHERE status = 'pending') as pending,
    (SELECT COUNT(*) FROM public.referral_requests WHERE status = 'pending_parent') as pending_parent,
    (SELECT COUNT(*) FROM public.referral_requests WHERE status = 'approved') as approved,
    (SELECT COUNT(*) FROM public.referral_requests WHERE status = 'declined') as declined;