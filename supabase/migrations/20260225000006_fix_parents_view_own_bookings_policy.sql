-- Migration: 20260225000006_fix_parents_view_own_bookings_policy.sql
-- Description: Fix RLS policy for parents to view bookings for swimmers they own
--              This addresses the "Error fetching bookings" error on parent/swimmers page

-- Drop the existing "Parents can view own bookings" policy
DROP POLICY IF EXISTS "Parents can view own bookings" ON public.bookings;

-- Recreate the policy with additional condition for swimmer ownership
CREATE POLICY "Parents can view own bookings" ON public.bookings
  FOR SELECT USING (
    -- Allow if parent_id matches auth.uid()
    auth.uid() = parent_id
    OR
    -- Allow if parent owns the swimmer associated with the booking
    auth.uid() IN (SELECT parent_id FROM swimmers WHERE swimmers.id = bookings.swimmer_id)
  );

-- Note: This fixes an issue where parents couldn't view bookings when parent_id was NULL
-- in the bookings table. Now parents can view bookings for swimmers they own,
-- even if the booking.parent_id field is not populated.