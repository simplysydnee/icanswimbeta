# Migration Instructions: Rename VMRC Referrals to Generic Referrals

## Overview
This migration renames the `vmrc_referral_requests` table to `referral_requests` to support multiple funding sources (not just VMRC).

## Files Modified
The following code files have been updated to use the new table name `referral_requests`:
1. `src/app/admin/referrals/page.tsx` - Admin referrals page
2. `src/components/dashboard/PendingReferralsAlert.tsx` - Dashboard alert
3. `src/hooks/usePendingReferralsAdmin.ts` - Admin stats hook
4. `src/hooks/usePendingReferrals.ts` - Parent pending referrals hook
5. `src/app/enroll/complete/[token]/page.tsx` - Parent completion page

**Note**: `src/lib/api-client.ts` still needs to be updated (more complex due to type/method names).

## Migration Files Created
1. `supabase/migrations/014_rename_to_referral_requests.sql` - Full migration with error handling
2. `apply_referral_rename_manually.sql` - Manual SQL for Supabase SQL Editor
3. `backup_revert_referral_rename.sql` - Revert script if needed

## How to Apply the Migration

### Option 1: Using Supabase SQL Editor (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/jtqlamkrhdfwtmaubfrc/sql)
2. Open the SQL Editor
3. Copy and paste the contents of `apply_referral_rename_manually.sql`
4. Run the SQL statements one by one:
   - First run the SELECT statements to check current state
   - Then run the appropriate ALTER TABLE statement based on results
   - Finally run the CREATE INDEX statements

### Option 2: Using Supabase CLI (if configured)
```bash
# Set database password (get from Supabase Dashboard -> Settings -> Database)
export SUPABASE_DB_PASSWORD=your_database_password

# Push migrations
SUPABASE_ACCESS_TOKEN="sbp_6c39396d6950f8bb2a5e9e66901ec5cc7e4f0ab7" npx supabase db push
```

### Option 3: Manual Steps
1. **Check current table name:**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE '%referral%';
   ```

2. **Rename table (choose one):**
   ```sql
   -- If table is vmrc_referral_requests:
   ALTER TABLE public.vmrc_referral_requests RENAME TO referral_requests;

   -- If table is funding_source_referral_requests (from migration 012):
   ALTER TABLE public.funding_source_referral_requests RENAME TO referral_requests;
   ```

3. **Create indexes:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_referral_requests_status ON public.referral_requests(status);
   CREATE INDEX IF NOT EXISTS idx_referral_requests_parent_token ON public.referral_requests(parent_token);
   CREATE INDEX IF NOT EXISTS idx_referral_requests_parent_email ON public.referral_requests(parent_email);
   CREATE INDEX IF NOT EXISTS idx_referral_requests_created_at ON public.referral_requests(created_at);
   ```

4. **Update table comment:**
   ```sql
   COMMENT ON TABLE public.referral_requests IS 'Referral requests from all funding sources for swimmer enrollment';
   ```

## Verification
After applying the migration:

1. **Check table exists:**
   ```sql
   SELECT COUNT(*) FROM public.referral_requests;
   ```

2. **Verify application works:**
   - Log in as admin and go to `/admin/referrals`
   - Check that referrals load without errors
   - Test approving/declining a referral

3. **Check parent completion flow:**
   - Use a referral token to access `/enroll/complete/[token]`
   - Verify parent can complete enrollment

## Rollback Instructions
If something goes wrong, use `backup_revert_referral_rename.sql`:

1. Rename table back:
   ```sql
   ALTER TABLE public.referral_requests RENAME TO vmrc_referral_requests;
   ```

2. Revert code changes by replacing `referral_requests` with `vmrc_referral_requests` in all modified files.

## Performance Improvements
The migration includes performance optimizations:
- Removed artificial delays (300ms, 200ms) from data fetching hooks
- Reduced cache duration from 5 to 2 minutes for fresher data
- Added database indexes for faster queries

## Remaining Work
1. **Update API client** (`src/lib/api-client.ts`):
   - Change table references from `vmrc_referral_requests` to `referral_requests`
   - Consider updating method names (e.g., `createVmrcReferralRequest` → `createReferralRequest`)
   - Update type names (e.g., `VmrcReferralRequest` → `ReferralRequest`)

2. **Update test files** to use new table name

3. **Consider updating** `referral_type` field values from `'vmrc_client'` to more generic values like `'funding_source_client'`

## Notes
- The system now uses generic "referrals" terminology
- Same approval workflow works for all funding sources
- Parent compliance process remains unchanged
- Backward compatible with existing data