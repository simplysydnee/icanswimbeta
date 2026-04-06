-- Migration: Fix tasks created_by NOT NULL constraint issue
-- Date: 2026-03-07
-- Description: Fix issue where cleanup scripts try to set created_by = NULL
--              but column has NOT NULL constraint

-- Option 1: Temporarily remove NOT NULL constraint, update data, restore constraint
-- This is the safest approach if we need to preserve data

-- Step 1: Remove NOT NULL constraint temporarily
ALTER TABLE public.tasks
  ALTER COLUMN created_by DROP NOT NULL;

-- Step 2: Run the cleanup script that was failing
-- The script should update created_by = NULL for invalid references
-- Note: We need to see the actual cleanup script to know what it's doing
-- If we don't have the script, we can identify orphaned references:

-- Find tasks where created_by doesn't reference a valid profile
-- SELECT t.id, t.title, t.created_by
-- FROM tasks t
-- LEFT JOIN profiles p ON t.created_by = p.id
-- WHERE p.id IS NULL;

-- Step 3: Update orphaned references to a valid admin user
-- Choose an admin user ID to use as default
-- UPDATE tasks t
-- SET created_by = 'admin-user-id-here'  -- Replace with actual admin user ID
-- WHERE created_by IS NULL
--    OR created_by NOT IN (SELECT id FROM profiles);

-- Step 4: Restore NOT NULL constraint
ALTER TABLE public.tasks
  ALTER COLUMN created_by SET NOT NULL;

-- Option 2: Delete tasks with invalid created_by references instead of setting to NULL
-- This is simpler but loses data

-- DELETE FROM tasks
-- WHERE created_by NOT IN (SELECT id FROM profiles);

-- Option 3: Update foreign key to allow NULL and handle orphaned references gracefully
-- This changes the data model but might be more flexible

-- ALTER TABLE public.tasks
--   DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
--
-- ALTER TABLE public.tasks
--   ADD CONSTRAINT tasks_created_by_fkey
--   FOREIGN KEY (created_by)
--   REFERENCES public.profiles(id)
--   ON DELETE SET NULL;  -- Or ON DELETE CASCADE

-- Recommendation: Use Option 1 (temporarily remove constraint, fix data, restore)
-- This preserves data integrity while allowing cleanup

-- Important: Before running this, identify which admin user ID to use as default
-- for orphaned task references. Could use Sutton's user ID or another admin.