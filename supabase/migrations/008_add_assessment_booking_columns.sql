-- Migration: 008_add_assessment_booking_columns.sql
-- Description: Adds booking_type to bookings table and booking_id to assessments table

-- Add booking_type column to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'lesson'
CHECK (booking_type IN ('lesson', 'assessment'));

-- Add booking_id column to assessments table
ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id);

-- Update existing assessments to link to bookings if possible
-- This is a best-effort migration - some assessments may not have corresponding bookings
UPDATE public.assessments a
SET booking_id = b.id
FROM public.bookings b
WHERE a.session_id = b.session_id
  AND a.swimmer_id = b.swimmer_id
  AND a.booking_id IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON public.bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_assessments_booking_id ON public.assessments(booking_id);