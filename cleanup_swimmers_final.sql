-- Final cleanup of swimmers, bookings, and sessions
-- Handles all foreign key constraints

BEGIN;

-- Step 1: Identify swimmers to delete
CREATE TEMPORARY TABLE swimmers_to_delete AS
SELECT s.id
FROM public.swimmers s
LEFT JOIN public.profiles p ON s.parent_id = p.id
LEFT JOIN auth.users u ON p.id = u.id
WHERE s.parent_id IS NULL  -- Orphaned swimmers
   OR (u.email IS NOT NULL
       AND u.email NOT IN (
         'anas.parent-vmrc@icanswim.com',
         'anas.parent@icanswim209.com',
         'anas.coordinator@icanswim.com',
         'anas.instructor@icanswim.com',
         'sydnee@icanswim209.com',
         'sydnee@simplysydnee.com',
         'admin@test.com',
         'coordinator-test@icanswim.local',
         'instructor-test@icanswim.local',
         'admin-test@icanswim.local',
         'parent-vmrc-test@icanswim.local',
         'parent-private-test@icanswim.local'
       )
       AND u.email NOT LIKE '%@icanswim209.com');  -- Non-test accounts

SELECT 'Swimmers marked for deletion:' as action, COUNT(*) as count FROM swimmers_to_delete;

-- Step 2: Handle tables with NO ACTION constraints on swimmer_id
-- billing_line_items
DELETE FROM public.billing_line_items
WHERE swimmer_id IN (SELECT id FROM swimmers_to_delete);

-- tasks
DELETE FROM public.tasks
WHERE swimmer_id IN (SELECT id FROM swimmers_to_delete);

-- waiver_update_log
DELETE FROM public.waiver_update_log
WHERE swimmer_id IN (SELECT id FROM swimmers_to_delete);

-- Step 3: Now delete swimmers (CASCADE will handle other tables)
DELETE FROM public.swimmers
WHERE id IN (SELECT id FROM swimmers_to_delete);

-- Step 4: Clean up orphaned sessions (no bookings)
DELETE FROM public.sessions
WHERE id NOT IN (SELECT session_id FROM public.bookings WHERE session_id IS NOT NULL);

-- Clean up temporary table
DROP TABLE swimmers_to_delete;

COMMIT;

SELECT 'Cleanup completed successfully!' as status;