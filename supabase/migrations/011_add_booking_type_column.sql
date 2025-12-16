-- Add booking_type column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'lesson';

-- Add comment for documentation
COMMENT ON COLUMN bookings.booking_type IS 'Type of booking: lesson, assessment, floating';

-- Update existing assessment bookings (join with sessions table)
UPDATE bookings b
SET booking_type = 'assessment'
FROM sessions s
WHERE b.session_id = s.id AND s.session_type = 'assessment';