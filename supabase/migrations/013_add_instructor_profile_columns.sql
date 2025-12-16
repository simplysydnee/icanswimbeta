-- Add instructor-specific columns to profiles table
-- Migration: 013_add_instructor_profile_columns.sql
-- Description: Adds title, bio, and is_active columns to profiles table for instructor profiles

-- Add columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for is_active for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Update existing profiles to have is_active = true
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;