-- Server-side filtering & search for the admin Sessions page
-- Migration: 20260603000000_list_admin_sessions.sql
-- Description: Adds public.list_admin_sessions(), which applies every admin
--              Sessions-page filter (status, date range, day of week, time of
--              day, instructor, location) and the cross-table search
--              (instructor name / swimmer names / location) entirely in SQL,
--              returning rows in the exact shape the page already renders.
--
--              Previously the page fetched the whole month and filtered in the
--              browser over a list the server silently truncated (PostgREST
--              db-max-rows), which made the Drafts tab render empty even when
--              drafts existed. Filtering in the database returns matching rows
--              directly, so no status can be hidden by truncation.
--
--              All parameters are optional (NULL = "no filter"), so calling with
--              no args returns every session — matching the prior endpoint's
--              behavior when no filters are supplied.

CREATE OR REPLACE FUNCTION public.list_admin_sessions(
  p_start_date     timestamptz DEFAULT NULL,  -- inclusive lower bound on start_time
  p_end_date       timestamptz DEFAULT NULL,  -- EXCLUSIVE upper bound on start_time
  p_status         text        DEFAULT NULL,  -- DB status value (caller maps 'open' -> 'available')
  p_day_of_week    int         DEFAULT NULL,  -- 0=Sunday .. 6=Saturday (studio TZ)
  p_time_start_hour int        DEFAULT NULL,  -- inclusive hour bucket lower bound (studio TZ)
  p_time_end_hour  int         DEFAULT NULL,  -- inclusive hour bucket upper bound (studio TZ)
  p_instructor_id  uuid        DEFAULT NULL,
  p_location       text        DEFAULT NULL,  -- prefix match against location
  p_search         text        DEFAULT NULL   -- ILIKE across instructor/swimmer names + location
)
RETURNS TABLE (
  id            uuid,
  instructor_id uuid,
  instructor_name text,
  start_time    timestamptz,
  end_time      timestamptz,
  day_of_week   text,
  location      text,
  max_capacity  integer,
  booking_count integer,
  is_full       boolean,
  session_type  text,
  status        text,
  price_cents   integer,
  batch_id      uuid,
  open_at       timestamptz,
  created_at    timestamptz,
  updated_at    timestamptz,
  bookings      jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
BEGIN
  -- Admin-only. Defense in depth: the API route also enforces admin access
  -- before calling. Returning no rows for non-admins is safe because the
  -- function is SECURITY DEFINER (it would otherwise bypass RLS).
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.instructor_id,
    COALESCE(p.full_name, 'Unknown Instructor')::text AS instructor_name,
    s.start_time,
    s.end_time,
    s.day_of_week,
    s.location,
    s.max_capacity,
    s.booking_count,
    s.is_full,
    s.session_type,
    s.status,
    s.price_cents,
    s.batch_id,
    s.open_at,
    s.created_at,
    s.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', b.id,
            'status', b.status,
            'swimmer', CASE WHEN sw.id IS NULL THEN NULL ELSE jsonb_build_object(
              'id', sw.id,
              'first_name', sw.first_name,
              'last_name', sw.last_name
            ) END,
            'parent', CASE WHEN pr.id IS NULL THEN NULL ELSE jsonb_build_object(
              'id', pr.id,
              'full_name', pr.full_name,
              'email', pr.email,
              'phone', pr.phone
            ) END
          )
        )
        FROM public.bookings b
        LEFT JOIN public.swimmers sw ON sw.id = b.swimmer_id
        LEFT JOIN public.profiles pr ON pr.id = b.parent_id
        WHERE b.session_id = s.id
      ),
      '[]'::jsonb
    ) AS bookings
  FROM public.sessions s
  LEFT JOIN public.profiles p ON p.id = s.instructor_id
  WHERE
        (p_start_date IS NULL OR s.start_time >= p_start_date)
    AND (p_end_date   IS NULL OR s.start_time <  p_end_date)
    AND (p_status     IS NULL OR s.status = p_status)
    AND (p_day_of_week IS NULL
         OR EXTRACT(DOW FROM s.start_time AT TIME ZONE 'America/Los_Angeles')::int = p_day_of_week)
    AND (p_time_start_hour IS NULL
         OR EXTRACT(HOUR FROM s.start_time AT TIME ZONE 'America/Los_Angeles')::int
              BETWEEN p_time_start_hour AND p_time_end_hour)
    AND (p_instructor_id IS NULL OR s.instructor_id = p_instructor_id)
    AND (p_location IS NULL OR s.location ILIKE p_location || '%')
    AND (
          p_search IS NULL
       OR p.full_name ILIKE '%' || p_search || '%'
       OR s.location  ILIKE '%' || p_search || '%'
       OR EXISTS (
            SELECT 1
            FROM public.bookings b2
            JOIN public.swimmers sw2 ON sw2.id = b2.swimmer_id
            WHERE b2.session_id = s.id
              AND b2.status <> 'cancelled'
              AND (
                   sw2.first_name ILIKE '%' || p_search || '%'
                OR sw2.last_name  ILIKE '%' || p_search || '%'
                OR (sw2.first_name || ' ' || sw2.last_name) ILIKE '%' || p_search || '%'
              )
          )
    )
  ORDER BY s.start_time DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_admin_sessions(
  timestamptz, timestamptz, text, int, int, int, uuid, text, text
) TO authenticated;

-- Composite index backing the most common filter combo (status + time range).
CREATE INDEX IF NOT EXISTS idx_sessions_status_start_time
  ON public.sessions(status, start_time);
