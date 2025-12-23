-- Migration: 20241222_assessment_reports.sql
-- Description: Creates assessment_reports table for detailed assessment completion

-- Check if assessments table exists, create if not
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  swimmer_id UUID REFERENCES swimmers(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assessment_date DATE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessment_reports table
CREATE TABLE IF NOT EXISTS assessment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  swimmer_id UUID REFERENCES swimmers(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assessment_date DATE NOT NULL,

  -- Basic Info
  strengths TEXT NOT NULL,
  challenges TEXT NOT NULL,

  -- Swim Skills (JSONB for flexibility)
  swim_skills JSONB NOT NULL DEFAULT '{}',

  -- Roadblocks (JSONB)
  roadblocks JSONB NOT NULL DEFAULT '{}',

  -- Goals
  swim_skills_goals TEXT,
  safety_goals TEXT,

  -- Approval
  approval_status TEXT CHECK (approval_status IN ('approved', 'dropped')) NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessment_reports_swimmer ON assessment_reports(swimmer_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_date ON assessment_reports(assessment_date);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_instructor ON assessment_reports(instructor_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_status ON assessment_reports(approval_status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assessment_reports
DROP TRIGGER IF EXISTS update_assessment_reports_updated_at ON assessment_reports;
CREATE TRIGGER update_assessment_reports_updated_at
  BEFORE UPDATE ON assessment_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for assessments
DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO assessments (booking_id, swimmer_id, instructor_id, assessment_date, status)
-- SELECT
--   b.id as booking_id,
--   b.swimmer_id,
--   s.instructor_id,
--   DATE(s.start_time) as assessment_date,
--   'scheduled' as status
-- FROM bookings b
-- JOIN sessions s ON b.session_id = s.id
-- WHERE s.session_type = 'assessment'
--   AND b.status = 'confirmed'
--   AND NOT EXISTS (
--     SELECT 1 FROM assessments a WHERE a.booking_id = b.id
--   )
-- LIMIT 10;

-- Add comment to table
COMMENT ON TABLE assessment_reports IS 'Detailed assessment reports for swimmer evaluations';
COMMENT ON COLUMN assessment_reports.swim_skills IS 'JSONB object storing swim skill assessments with keys: skill_name -> rating (emerging, na, no, yes)';
COMMENT ON COLUMN assessment_reports.roadblocks IS 'JSONB object storing roadblock assessments with keys: roadblock_name -> {needs_addressing: boolean, intervention: text}';