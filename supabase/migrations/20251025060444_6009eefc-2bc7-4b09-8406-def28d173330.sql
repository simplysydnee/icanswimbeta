-- Add allowed_swim_levels column to sessions table
ALTER TABLE public.sessions
ADD COLUMN allowed_swim_levels uuid[] DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX idx_sessions_allowed_swim_levels ON public.sessions USING GIN(allowed_swim_levels);

-- Add comment
COMMENT ON COLUMN public.sessions.allowed_swim_levels IS 'Array of swim level IDs that are allowed to book this session';