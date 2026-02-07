-- Fix waiver token reuse issue
-- Migration: 20260206190000_fix_waiver_token_reuse.sql
-- Description: Updates waiver_update_tokens to allow reuse for multiple swimmers
--              by removing the "used" check and updating existing tokens

-- Update all existing tokens to be reusable (set used = false)
UPDATE public.waiver_update_tokens
SET used = false
WHERE used = true;

-- Add comment explaining the change
COMMENT ON COLUMN public.waiver_update_tokens.used IS
'Legacy field - tokens are no longer marked as used to allow completing multiple swimmers.
 Tokens are validated by expiration date only.';