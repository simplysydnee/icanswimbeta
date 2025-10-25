-- Add scheduling fields to sessions table
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS session_type_detail text CHECK (session_type_detail IN ('weekly_recurring_month', 'single_lesson', 'initial_assessment', 'single_initial_assessment')),
  ADD COLUMN IF NOT EXISTS open_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS booking_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_full boolean GENERATED ALWAYS AS (booking_count >= max_capacity) STORED,
  ADD COLUMN IF NOT EXISTS weekday text,
  ADD COLUMN IF NOT EXISTS batch_id uuid,
  ADD COLUMN IF NOT EXISTS notes_tags text,
  ADD COLUMN IF NOT EXISTS blackout_flag boolean DEFAULT false;

-- Create breaks table for pool maintenance/breaks
CREATE TABLE IF NOT EXISTS public.breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  break_start time NOT NULL,
  break_end time NOT NULL,
  label text,
  days_of_week integer[], -- 0=Sun, 1=Mon, etc.
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on breaks
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;

-- Drop and recreate break policies
DROP POLICY IF EXISTS "Admins can manage breaks" ON public.breaks;
CREATE POLICY "Admins can manage breaks"
ON public.breaks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create blackout dates table
CREATE TABLE IF NOT EXISTS public.blackout_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blackout_date date NOT NULL UNIQUE,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on blackout dates
ALTER TABLE public.blackout_dates ENABLE ROW LEVEL SECURITY;

-- Drop and recreate blackout policies
DROP POLICY IF EXISTS "Admins can manage blackout dates" ON public.blackout_dates;
CREATE POLICY "Admins can manage blackout dates"
ON public.blackout_dates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_batch_id ON public.sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status_date ON public.sessions(status, start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_instructor_time ON public.sessions(instructor_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_breaks_location ON public.breaks(location) WHERE active = true;

-- Function to get last Sunday of month
CREATE OR REPLACE FUNCTION get_last_sunday_of_month(year integer, month integer)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_day date;
  day_of_week integer;
BEGIN
  last_day := make_date(year, month, 1) + interval '1 month' - interval '1 day';
  day_of_week := EXTRACT(DOW FROM last_day);
  RETURN last_day - (day_of_week || ' days')::interval;
END;
$$;

-- Function to check if sessions should open
CREATE OR REPLACE FUNCTION should_sessions_open()
RETURNS table(session_id uuid, session_start_time timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  now_pt timestamp with time zone;
  current_year integer;
  current_month integer;
  next_month_start date;
  next_month_end date;
  last_sunday date;
  opening_time timestamp with time zone;
BEGIN
  now_pt := now() AT TIME ZONE 'America/Los_Angeles';
  current_year := EXTRACT(YEAR FROM now_pt);
  current_month := EXTRACT(MONTH FROM now_pt);
  next_month_start := make_date(current_year, current_month, 1) + interval '1 month';
  next_month_end := make_date(current_year, current_month, 1) + interval '2 months' - interval '1 day';
  last_sunday := get_last_sunday_of_month(current_year, current_month);
  opening_time := (last_sunday || ' 18:00:00')::timestamp AT TIME ZONE 'America/Los_Angeles';
  
  RETURN QUERY
  SELECT s.id, s.start_time
  FROM sessions s
  WHERE s.status = 'draft'
    AND s.start_time::date BETWEEN next_month_start AND next_month_end
    AND now_pt >= opening_time;
END;
$$;