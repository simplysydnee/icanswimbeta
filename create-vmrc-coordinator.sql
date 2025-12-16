-- SQL script to create VMRC coordinator test user for I Can Swim testing
-- Run this in your Supabase SQL Editor

-- Note: This creates a user with password: TestPassword123!
-- You need to adjust the encrypted_password if using a different hashing method

-- Create VMRC coordinator user
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'vmrc-coordinator@test.com',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  now(),
  now(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'vmrc-coordinator@test.com'
);

-- Create profile for VMRC coordinator user
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  phone,
  avatar_url,
  role,
  created_at,
  updated_at
)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  'vmrc-coordinator@test.com',
  'Test VMRC Coordinator',
  '555-987-6543',
  NULL,
  'vmrc_coordinator',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222'::uuid
);

-- Assign vmrc_coordinator role in user_roles table (if exists)
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at
)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  'vmrc_coordinator',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = '22222222-2222-2222-2222-222222222222'::uuid
);

-- Verify created user
SELECT
  u.email,
  p.full_name,
  p.role as profile_role,
  ur.role as user_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'vmrc-coordinator@test.com';