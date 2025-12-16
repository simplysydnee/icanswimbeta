-- Backup/revert script for referral table rename
-- Use this if you need to revert back to vmrc_referral_requests

-- 1. First check current table name
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('referral_requests', 'vmrc_referral_requests', 'funding_source_referral_requests');

-- 2. If referral_requests exists and you want to revert to vmrc_referral_requests:
-- ALTER TABLE public.referral_requests RENAME TO vmrc_referral_requests;

-- 3. Drop indexes created for referral_requests (they'll be recreated if needed)
-- DROP INDEX IF EXISTS idx_referral_requests_status;
-- DROP INDEX IF EXISTS idx_referral_requests_parent_token;
-- DROP INDEX IF EXISTS idx_referral_requests_parent_email;
-- DROP INDEX IF EXISTS idx_referral_requests_created_at;

-- 4. Restore original table comment
-- COMMENT ON TABLE public.vmrc_referral_requests IS 'VMRC referral requests with parent completion flow for admin review';

-- 5. Update code references back to 'vmrc_referral_requests' in:
--    - src/app/admin/referrals/page.tsx
--    - src/hooks/usePendingReferralsAdmin.ts
--    - src/hooks/usePendingReferrals.ts
--    - src/app/enroll/complete/[token]/page.tsx
--    - src/lib/api-client.ts (multiple places)
--    - Any other files that reference 'referral_requests'