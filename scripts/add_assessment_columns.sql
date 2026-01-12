-- Add missing columns to assessment_reports table for migration
-- Run this before executing the assessment migration script

-- Create exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Add missing columns to assessment_reports table
ALTER TABLE assessment_reports
ADD COLUMN IF NOT EXISTS instructor_name TEXT,
ADD COLUMN IF NOT EXISTS goals JSONB,
ADD COLUMN IF NOT EXISTS pos_data JSONB,
ADD COLUMN IF NOT EXISTS airtable_record_id TEXT UNIQUE;

-- Create index on airtable_record_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_assessment_reports_airtable_id ON assessment_reports(airtable_record_id);

-- Update table comment
COMMENT ON TABLE assessment_reports IS 'Detailed assessment reports for swimmer evaluations, including migrated Airtable data';

-- Show the updated table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'assessment_reports'
  AND table_schema = 'public'
ORDER BY ordinal_position;