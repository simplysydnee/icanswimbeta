-- Add parent_email support to waiver_update_tokens and waiver_update_log
-- Migration: 20260204_add_parent_email_to_waiver_tokens.sql
-- Description: Makes parent_id nullable and adds parent_email for parents without accounts

-- Disable triggers to avoid issues during schema changes
DROP TRIGGER IF EXISTS update_waiver_tokens_updated_at ON public.waiver_update_tokens;
DROP TRIGGER IF EXISTS update_waiver_log_updated_at ON public.waiver_update_log;

-- Step 1: Add parent_email column to waiver_update_tokens
ALTER TABLE public.waiver_update_tokens
ADD COLUMN IF NOT EXISTS parent_email TEXT;

-- Step 2: Make parent_id nullable (was required before)
ALTER TABLE public.waiver_update_tokens
ALTER COLUMN parent_id DROP NOT NULL;

-- Step 3: Remove foreign key constraint to allow null parent_id
ALTER TABLE public.waiver_update_tokens
DROP CONSTRAINT IF EXISTS waiver_update_tokens_parent_id_fkey;

-- Re-add foreign key but allow null
ALTER TABLE public.waiver_update_tokens
ADD CONSTRAINT waiver_update_tokens_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 4: Ensure at least one identifier exists
ALTER TABLE public.waiver_update_tokens
ADD CONSTRAINT tokens_must_have_parent
CHECK (parent_id IS NOT NULL OR parent_email IS NOT NULL);

-- Step 5: Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_waiver_tokens_parent_email
ON public.waiver_update_tokens(parent_email);

-- Step 6: Add parent_email to audit log for parents without accounts
ALTER TABLE public.waiver_update_log
ADD COLUMN IF NOT EXISTS parent_email TEXT;

-- Step 7: Make parent_id nullable in waiver_update_log
ALTER TABLE public.waiver_update_log
ALTER COLUMN parent_id DROP NOT NULL;

-- Step 8: Remove foreign key constraint from waiver_update_log
ALTER TABLE public.waiver_update_log
DROP CONSTRAINT IF EXISTS waiver_update_log_parent_id_fkey;

-- Re-add foreign key but allow null
ALTER TABLE public.waiver_update_log
ADD CONSTRAINT waiver_update_log_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES public.profiles(id);

-- Step 9: Backfill parent_email in waiver_update_tokens from profiles table
UPDATE public.waiver_update_tokens wut
SET parent_email = (
  SELECT email
  FROM public.profiles p
  WHERE p.id = wut.parent_id
)
WHERE parent_email IS NULL AND parent_id IS NOT NULL;

-- Step 10: Backfill parent_email in waiver_update_log from profiles table
UPDATE public.waiver_update_log wul
SET parent_email = (
  SELECT email
  FROM public.profiles p
  WHERE p.id = wul.parent_id
)
WHERE parent_email IS NULL AND parent_id IS NOT NULL;

-- Recreate trigger only for waiver_update_tokens (waiver_update_log doesn't have updated_at)
CREATE TRIGGER update_waiver_tokens_updated_at
  BEFORE UPDATE ON public.waiver_update_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Note: waiver_update_log doesn't have updated_at column, so trigger is not recreated

-- Step 11: Add comments for documentation
COMMENT ON COLUMN public.waiver_update_tokens.parent_email IS
'Email address for parents without user accounts. Use this OR parent_id.';

COMMENT ON COLUMN public.waiver_update_log.parent_email IS
'Email address captured for audit trail when parent has no account.';