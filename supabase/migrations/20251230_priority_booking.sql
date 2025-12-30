-- Priority Booking Feature
-- Allows admins to assign specific instructors to swimmers

-- Add priority columns to swimmers table
ALTER TABLE swimmers
ADD COLUMN IF NOT EXISTS is_priority_booking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority_booking_reason TEXT CHECK (priority_booking_reason IN ('manual', 'attendance', 'medical', 'behavioral')),
ADD COLUMN IF NOT EXISTS priority_booking_notes TEXT,
ADD COLUMN IF NOT EXISTS priority_booking_set_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS priority_booking_set_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS priority_booking_expires_at TIMESTAMPTZ;

-- Create swimmer-instructor assignments junction table
CREATE TABLE IF NOT EXISTS swimmer_instructor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID NOT NULL REFERENCES swimmers(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swimmer_id, instructor_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_swimmer_instructor_swimmer ON swimmer_instructor_assignments(swimmer_id);
CREATE INDEX IF NOT EXISTS idx_swimmer_instructor_instructor ON swimmer_instructor_assignments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_swimmers_priority ON swimmers(is_priority_booking) WHERE is_priority_booking = true;

-- RLS Policies for swimmer_instructor_assignments
ALTER TABLE swimmer_instructor_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to assignments" ON swimmer_instructor_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Instructors can view their own assignments
CREATE POLICY "Instructors view own assignments" ON swimmer_instructor_assignments
  FOR SELECT
  TO authenticated
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Parents can view assignments for their swimmers
CREATE POLICY "Parents view own swimmer assignments" ON swimmer_instructor_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM swimmers
      WHERE swimmers.id = swimmer_instructor_assignments.swimmer_id
      AND swimmers.parent_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE swimmer_instructor_assignments IS 'Links swimmers to their assigned instructors for priority booking';
COMMENT ON COLUMN swimmers.is_priority_booking IS 'Whether swimmer has priority booking (restricted to assigned instructors)';
COMMENT ON COLUMN swimmers.priority_booking_reason IS 'Why swimmer has priority: manual, attendance, medical, behavioral';