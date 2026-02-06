-- Add closed session status and tracking columns
-- Migration: 20260206000000_add_closed_session_status.sql
-- Description: Adds 'closed' status to sessions table along with close reason tracking columns

-- Add new columns to sessions table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS close_reason TEXT CHECK (close_reason IN ('pool_closed', 'instructor_unavailable', 'other')),
ADD COLUMN IF NOT EXISTS close_reason_notes TEXT,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES public.profiles(id);

-- Add check constraint for session status (including new 'closed' status)
-- First, drop existing constraint if it exists (by name)
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_status_check;

-- Add new constraint with all valid status values
ALTER TABLE public.sessions ADD CONSTRAINT sessions_status_check
CHECK (status IN ('draft', 'available', 'open', 'booked', 'cancelled', 'completed', 'closed'));

-- Add comments for new columns
COMMENT ON COLUMN public.sessions.close_reason IS 'Reason for closing session: pool_closed, instructor_unavailable, or other';
COMMENT ON COLUMN public.sessions.close_reason_notes IS 'Additional notes about why session was closed';
COMMENT ON COLUMN public.sessions.closed_at IS 'Timestamp when session was closed';
COMMENT ON COLUMN public.sessions.closed_by IS 'Admin user who closed the session (references profiles.id)';

-- Update comment on status column to include 'closed'
COMMENT ON COLUMN public.sessions.status IS 'Session status: draft, available, open, booked, cancelled, completed, closed';