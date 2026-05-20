-- Fix RLS on cancellations table
-- The table was created with RLS enabled, but it was later disabled.
-- This migration re-enables it and adds missing UPDATE/DELETE policies.
-- NOTE: Remote schema differs from original migration — no parent_id column,
-- so parent SELECT policy joins through swimmers instead.

-- Re-enable RLS (in case it was disabled)
ALTER TABLE cancellations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid duplicates on re-run
DROP POLICY IF EXISTS "Parents can view own cancellations" ON cancellations;
DROP POLICY IF EXISTS "Admins can view all cancellations" ON cancellations;
DROP POLICY IF EXISTS "Authenticated users can insert cancellations" ON cancellations;
DROP POLICY IF EXISTS "Admins can update cancellations" ON cancellations;
DROP POLICY IF EXISTS "Admins can delete cancellations" ON cancellations;

-- SELECT policies
CREATE POLICY "Parents can view own cancellations"
ON cancellations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM swimmers
    WHERE swimmers.id = cancellations.swimmer_id
    AND swimmers.parent_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all cancellations"
ON cancellations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- INSERT policy
CREATE POLICY "Authenticated users can insert cancellations"
ON cancellations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE policy (admin only)
CREATE POLICY "Admins can update cancellations"
ON cancellations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- DELETE policy (admin only)
CREATE POLICY "Admins can delete cancellations"
ON cancellations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
