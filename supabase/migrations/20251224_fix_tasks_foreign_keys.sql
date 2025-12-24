-- Migration: Fix tasks table foreign keys to reference profiles instead of auth.users
-- Description: Updates foreign key constraints to point to public.profiles.id instead of auth.users.id

-- Drop existing foreign key constraints
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

-- Recreate foreign key constraints pointing to profiles table
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_assigned_to_fkey
  FOREIGN KEY (assigned_to)
  REFERENCES public.profiles(id);

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id);

-- Update RLS policies to use profiles table
DROP POLICY IF EXISTS "Task visibility" ON public.tasks;
DROP POLICY IF EXISTS "Task creation" ON public.tasks;
DROP POLICY IF EXISTS "Task updates" ON public.tasks;
DROP POLICY IF EXISTS "Task deletion" ON public.tasks;

-- Policy: Users see tasks assigned to them, created by them, or all if owner (sutton@icanswim209.com)
CREATE POLICY "Task visibility" ON public.tasks
  FOR ALL USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.email = 'sutton@icanswim209.com'
    )
  );

-- Policy: Users can insert tasks (they will be created_by them)
CREATE POLICY "Task creation" ON public.tasks
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

-- Policy: Users can update tasks assigned to them or created by them, or all if owner
CREATE POLICY "Task updates" ON public.tasks
  FOR UPDATE USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.email = 'sutton@icanswim209.com'
    )
  );

-- Policy: Users can delete tasks they created, or all if owner
CREATE POLICY "Task deletion" ON public.tasks
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.email = 'sutton@icanswim209.com'
    )
  );