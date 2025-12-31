-- Instructor Access Control Functions
-- Migration: 20251231_instructor_access_functions.sql
-- Description: Creates functions for instructor access control to swimmers

-- Function to get swimmers an instructor has access to
-- Access based on: Future sessions OR recent past sessions (last 7 days for progress notes)
-- Also includes swimmers from swimmer_instructor_assignments table
CREATE OR REPLACE FUNCTION get_instructor_swimmers(p_instructor_id UUID)
RETURNS SETOF swimmers
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT s.*
  FROM swimmers s
  WHERE EXISTS (
    -- Access via sessions (bookings)
    SELECT 1
    FROM bookings b
    INNER JOIN sessions sess ON b.session_id = sess.id
    WHERE sess.instructor_id = p_instructor_id
      AND b.swimmer_id = s.id
      AND b.status NOT IN ('cancelled')
      AND (
        -- Future sessions (including today)
        sess.start_time >= CURRENT_DATE
        OR
        -- Recent past sessions (7-day grace period for progress notes)
        sess.start_time >= CURRENT_DATE - INTERVAL '7 days'
      )
  )
  OR EXISTS (
    -- Access via instructor assignments (priority booking)
    SELECT 1
    FROM swimmer_instructor_assignments sia
    WHERE sia.instructor_id = p_instructor_id
      AND sia.swimmer_id = s.id
  )
  ORDER BY s.last_name, s.first_name;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_instructor_swimmers(UUID) TO authenticated;

-- Function to check if instructor has access to a specific swimmer
CREATE OR REPLACE FUNCTION instructor_has_swimmer_access(
  p_instructor_id UUID,
  p_swimmer_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    -- Access via sessions (bookings)
    SELECT 1
    FROM bookings b
    INNER JOIN sessions sess ON b.session_id = sess.id
    WHERE sess.instructor_id = p_instructor_id
      AND b.swimmer_id = p_swimmer_id
      AND b.status NOT IN ('cancelled')
      AND (
        sess.start_time >= CURRENT_DATE
        OR
        sess.start_time >= CURRENT_DATE - INTERVAL '7 days'
      )
  )
  OR EXISTS (
    -- Access via instructor assignments (priority booking)
    SELECT 1
    FROM swimmer_instructor_assignments sia
    WHERE sia.instructor_id = p_instructor_id
      AND sia.swimmer_id = p_swimmer_id
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION instructor_has_swimmer_access(UUID, UUID) TO authenticated;

-- Add RLS policy for instructors to view swimmers they have access to
-- This policy allows instructors to query swimmers table directly for swimmers they have access to
CREATE POLICY "Instructors can view swimmers they have access to" ON swimmers
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all swimmers
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
    OR
    -- Parents can see their own swimmers
    parent_id = auth.uid()
    OR
    -- Instructors can see swimmers they have access to
    (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'instructor'
      )
      AND instructor_has_swimmer_access(auth.uid(), id)
    )
  );

-- Add comment for documentation
COMMENT ON FUNCTION get_instructor_swimmers(UUID) IS 'Returns swimmers an instructor has access to via sessions (future or recent past 7 days) or instructor assignments';
COMMENT ON FUNCTION instructor_has_swimmer_access(UUID, UUID) IS 'Checks if an instructor has access to a specific swimmer via sessions or assignments';
COMMENT ON POLICY "Instructors can view swimmers they have access to" ON swimmers IS 'Allows instructors to view swimmers they have access to via sessions or assignments';