-- =============================================
-- PUBLIC WEBSITE DATABASE UPDATES
-- =============================================
-- Migration: 20241222_public_website_updates.sql
-- Date: 2024-12-22
-- Description: Adds fields for Team page and Regional Center page functionality

-- PROFILES: Add fields for Team page
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_on_team BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credentials TEXT[];

-- FUNDING_SOURCES: Add fields for Regional Center page
ALTER TABLE funding_sources ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE funding_sources ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE funding_sources ADD COLUMN IF NOT EXISTS service_area TEXT;
ALTER TABLE funding_sources ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set initial data for Sutton
UPDATE profiles
SET
  display_on_team = true,
  display_order = 1,
  title = 'Owner & Lead Instructor',
  bio = 'Sutton has been teaching individuals with special needs for more than 14 years. She holds a Bachelor of Arts in Liberal Studies from Cal Poly San Luis Obispo, a Master''s in Education, and three teaching credentials in Special Education. She is Level 2 Adaptive Swim Whisper certified from Swim Angelfish.',
  credentials = ARRAY['BA Liberal Studies, Cal Poly SLO', 'MA Education', '3 Special Education Credentials', 'Level 2 Adaptive Swim Whisper']
WHERE email ILIKE '%sutton%' OR full_name ILIKE '%sutton%';