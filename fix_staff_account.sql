-- Fix staff@icanswim209.com account setup
-- This script should be run with service role key to bypass RLS

-- First, get the user ID from auth.users
DO $$
DECLARE
  staff_user_id uuid;
BEGIN
  -- Get the user ID for staff@icanswim209.com
  SELECT id INTO staff_user_id
  FROM auth.users
  WHERE email = 'staff@icanswim209.com';

  IF staff_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found staff user with ID: %', staff_user_id;

    -- Insert profile if it doesn't exist
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      staff_user_id,
      'staff@icanswim209.com',
      'Staff User',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    RAISE NOTICE 'Profile created/updated for staff user';

    -- Insert admin role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (
      staff_user_id,
      'admin',
      NOW()
    )
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin role added for staff user';

  ELSE
    RAISE NOTICE 'User staff@icanswim209.com not found in auth.users. Please create the user first.';
  END IF;
END $$;