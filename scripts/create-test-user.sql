-- SQL script to create test users for I Can Swim testing
-- Run this in your Supabase SQL Editor

-- Note: This creates users with password: TestPassword123!
-- You need to adjust the encrypted_password if using a different hashing method

-- Create test parent user
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
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'test-free@example.com',
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
  SELECT 1 FROM auth.users WHERE email = 'test-free@example.com'
);

-- Create profile for test user
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
  '11111111-1111-1111-1111-111111111111'::uuid,
  'test-free@example.com',
  'Test Parent',
  '555-123-4567',
  NULL,
  'parent',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
);

-- Assign parent role in user_roles table (if exists)
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at
)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  'parent',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
);

-- Create additional test users from auth-helpers.ts
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
SELECT
  uuid_generate_v4(),
  email,
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now()
FROM (VALUES
  ('test-subscribed@example.com'),
  ('test-pro@example.com'),
  ('test-enterprise@example.com')
) AS test_emails(email)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.email = test_emails.email
);

-- Create profiles for additional test users
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  'Test User',
  'parent',
  now(),
  now()
FROM auth.users u
WHERE u.email IN ('test-subscribed@example.com', 'test-pro@example.com', 'test-enterprise@example.com')
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Assign parent roles to additional test users
INSERT INTO public.user_roles (
  user_id,
  role,
  created_at
)
SELECT
  u.id,
  'parent',
  now()
FROM auth.users u
WHERE u.email IN ('test-subscribed@example.com', 'test-pro@example.com', 'test-enterprise@example.com')
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

-- Verify created users
SELECT
  u.email,
  p.full_name,
  p.role as profile_role,
  ur.role as user_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email LIKE 'test-%@example.com'
ORDER BY u.email;