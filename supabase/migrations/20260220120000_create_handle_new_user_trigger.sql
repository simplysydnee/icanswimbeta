-- Migration: 20260220120000_create_handle_new_user_trigger.sql
-- Description: Creates trigger to automatically create profile when new user signs up via Supabase Auth

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix the existing user who has no profile (t.ash5@yahoo.com, id: 50d87f75-d597-4e2c-b437-35bd9cc54bee)
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
VALUES ('50d87f75-d597-4e2c-b437-35bd9cc54bee', 't.ash5@yahoo.com', '', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;