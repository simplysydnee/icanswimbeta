-- Add photo moderation columns to profiles table
-- Migration: 005_add_photo_moderation_columns.sql
-- Description: Adds columns for photo moderation workflow

-- Add photo_status column with default 'approved' for existing photos
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS photo_status TEXT DEFAULT 'approved'
CHECK (photo_status IN ('pending', 'approved', 'rejected'));

-- Add photo_uploaded_at column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ;

-- Set photo_uploaded_at for existing photos (use updated_at as approximation)
UPDATE public.profiles
SET photo_uploaded_at = updated_at
WHERE avatar_url IS NOT NULL AND photo_uploaded_at IS NULL;

-- Set photo_status to 'pending' for new uploads via trigger
CREATE OR REPLACE FUNCTION set_photo_moderation_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- If avatar_url is being set and it's different from before
  IF NEW.avatar_url IS NOT NULL AND (OLD.avatar_url IS NULL OR NEW.avatar_url != OLD.avatar_url) THEN
    NEW.photo_status := 'pending';
    NEW.photo_uploaded_at := NOW();
  END IF;

  -- If avatar_url is being cleared, also clear moderation status
  IF NEW.avatar_url IS NULL AND OLD.avatar_url IS NOT NULL THEN
    NEW.photo_status := NULL;
    NEW.photo_uploaded_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for photo moderation
DROP TRIGGER IF EXISTS set_photo_moderation_defaults_trigger ON public.profiles;
CREATE TRIGGER set_photo_moderation_defaults_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_photo_moderation_defaults();

-- Note: Existing photos will have status 'approved' by default
-- New uploads will automatically get status 'pending'