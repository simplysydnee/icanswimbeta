# Assessment Migration Instructions

This guide explains how to migrate ~962 Initial Assessment records from Airtable CSV to Supabase.

## Files Created

1. **`scripts/migrate_assessments.js`** - Main migration script
2. **`scripts/add_assessment_columns.sql`** - SQL to add missing columns to `assessment_reports` table
3. **`scripts/run_sql.js`** - SQL runner utility
4. **`.env.migrate_assessments.example`** - Environment template
5. **`scripts/ASSESSMENT_MIGRATION_README.md`** - This file

## Prerequisites

1. Node.js 18 or higher
2. CSV file: `Initial_Assessment_Reports-Grid_view.csv` (from Airtable)
3. Supabase project with service role key
4. Swimmer data already migrated (swimmers must exist in Supabase with `airtable_record_id`)

## Step 1: Prepare Environment

1. Copy the environment template:
   ```bash
   cp .env.migrate_assessments.example .env.migrate_assessments
   ```

2. Edit `.env.migrate_assessments` with your values:
   ```bash
   # Supabase Configuration
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # CSV File Path
   CSV_FILE_PATH=/path/to/Initial_Assessment_Reports-Grid_view.csv

   # Admin User ID (for created_by/approved_by fields)
   ADMIN_USER_ID=9307a07c-1dd4-4c32-8b17-324b0910b3c3
   ```

## Step 2: Check Current Table Structure

First, check the current `assessment_reports` table structure in Supabase SQL Editor:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assessment_reports'
ORDER BY ordinal_position;
```

**Expected columns in `assessment_reports`:**
- `id` (UUID, primary key)
- `assessment_id` (UUID, references assessments)
- `swimmer_id` (UUID, references swimmers, NOT NULL)
- `instructor_id` (UUID, references profiles, NOT NULL)
- `assessment_date` (DATE, NOT NULL)
- `strengths` (TEXT, NOT NULL)
- `challenges` (TEXT, NOT NULL)
- `swim_skills` (JSONB, NOT NULL DEFAULT '{}')
- `roadblocks` (JSONB, NOT NULL DEFAULT '{}')
- `swim_skills_goals` (TEXT)
- `safety_goals` (TEXT)
- `approval_status` (TEXT, CHECK IN ('approved', 'dropped'), NOT NULL)
- `created_at` (TIMESTAMPTZ DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ DEFAULT NOW())
- `created_by` (UUID, references profiles)

## Step 3: Add Missing Columns

The migration requires these additional columns:

1. **Option A: Run SQL script** (recommended):
   ```bash
   node scripts/run_sql.js scripts/add_assessment_columns.sql
   ```

2. **Option B: Manual SQL in Supabase SQL Editor**:
   ```sql
   -- Add missing columns to assessment_reports table
   ALTER TABLE assessment_reports
   ADD COLUMN IF NOT EXISTS instructor_name TEXT,
   ADD COLUMN IF NOT EXISTS goals JSONB,
   ADD COLUMN IF NOT EXISTS pos_data JSONB,
   ADD COLUMN IF NOT EXISTS airtable_record_id TEXT UNIQUE;

   -- Create index on airtable_record_id for faster lookups
   CREATE INDEX IF NOT EXISTS idx_assessment_reports_airtable_id ON assessment_reports(airtable_record_id);
   ```

## Step 4: Verify Swimmer Data

Ensure swimmers exist in Supabase with `airtable_record_id` populated. Check with:

```sql
-- Check if swimmers have airtable_record_id
SELECT COUNT(*) as total_swimmers,
       COUNT(airtable_record_id) as with_airtable_id,
       COUNT(*) - COUNT(airtable_record_id) as missing_airtable_id
FROM swimmers;

-- Sample of swimmers without airtable_record_id
SELECT id, first_name, last_name
FROM swimmers
WHERE airtable_record_id IS NULL
LIMIT 10;
```

## Step 5: Run Migration

1. **Dry run (test with first 10 records):**
   ```bash
   node -e "
   require('./scripts/migrate_assessments.js').migrateAssessments().then(() => {
     console.log('Test completed');
   }).catch(err => {
     console.error('Test failed:', err);
   });
   "
   ```

2. **Full migration:**
   ```bash
   node scripts/migrate_assessments.js
   ```

## Step 6: Verify Migration

Check migration results:

```sql
-- Count migrated assessments
SELECT COUNT(*) as total_assessments FROM assessment_reports;

-- Check by date
SELECT assessment_date, COUNT(*)
FROM assessment_reports
GROUP BY assessment_date
ORDER BY assessment_date DESC
LIMIT 10;

-- Check swimmers with assessments
SELECT s.first_name, s.last_name, s.assessment_status, COUNT(ar.id) as assessment_count
FROM swimmers s
LEFT JOIN assessment_reports ar ON s.id = ar.swimmer_id
GROUP BY s.id, s.first_name, s.last_name, s.assessment_status
HAVING COUNT(ar.id) > 0
LIMIT 10;
```

## Data Mapping

### Swim Skills Mapping
CSV values are mapped to these categories:
- "Emerging Skill" → "Emerging Skill"
- "Yes" or "Y" → "Yes"
- "No" or "N" → "No"
- "NA" or "N/A" → "N/A"
- (default) → "No"

### Roadblocks Mapping
CSV values are mapped to these statuses:
- Contains "needs" or "address" → "Needs to be addressed"
- Contains "not" or "focus" → "Not a current area of focus"
- (default) → "Not a current area of focus"

### JSON Structure

**`swim_skills` JSONB:**
```json
{
  "walks_in_water": "Emerging Skill",
  "swims_with_equipment": "No",
  "swims_with_approved_pdf": "No",
  "swims_with_floaties": "No",
  "front_float": "No",
  "back_float": "No",
  "changing_directions": "No",
  "rollovers": "No",
  "blowing_bubbles": "Emerging Skill",
  "submerging": "No",
  "jumping_in": "No",
  "side_breathing": "No",
  "streamline": "No",
  "front_crawl": "No",
  "back_crawl": "No",
  "elementary_backstroke": "No",
  "breaststroke": "No",
  "butterfly": "No",
  "side_stroke": "No",
  "sculling": "No",
  "treading_water": "No",
  "survival_float": "No",
  "enters_safely": "Emerging Skill",
  "exits_safely": "No"
}
```

**`roadblocks` JSONB:**
```json
{
  "safety": {
    "status": "Needs to be addressed",
    "intervention": "Asking to get in the water with routine..."
  },
  "water_properties": {
    "status": "Needs to be addressed",
    "intervention": "Front and Back float..."
  }
  // ... other roadblocks
}
```

**`goals` JSONB:**
```json
{
  "swim_skills": "Goal(s) for Swim Skills value",
  "safety": "Goal(s) for Safety value"
}
```

**`pos_data` JSONB:**
```json
{
  "pos_date_submitted": "2024-01-15",
  "pos_auth_number": "AUTH12345",
  "pos_date_for_lessons": "2024-02-01",
  "pos_request": "Request details",
  "pos_tracking": "Tracking info",
  "pos_notes": "Additional notes"
}
```

## Troubleshooting

### Common Issues

1. **"CSV file not found"**
   - Verify `CSV_FILE_PATH` in `.env.migrate_assessments`
   - Ensure file exists at the specified path

2. **"Swimmer not found for Airtable ID"**
   - Check if swimmers have `airtable_record_id` populated
   - Verify Airtable record IDs match between CSV and Supabase

3. **"Missing columns in assessment_reports"**
   - Run `scripts/add_assessment_columns.sql`
   - Or manually add the missing columns

4. **"Duplicate assessment date"**
   - Assessment already exists for that swimmer on that date
   - Script will skip duplicates automatically

### Error Logs

The script creates a detailed report:
- `scripts/migration_report_assessments.json` - Full migration report
- Console output shows progress and errors

### Performance Tips

1. **Batch processing**: The script processes records one by one to avoid timeouts
2. **Indexes**: Ensure `airtable_record_id` has an index on `swimmers` table
3. **Network**: Run from a location with good connection to Supabase
4. **Memory**: Processing ~962 records requires minimal memory

## Rollback

If migration fails or needs to be undone:

```sql
-- Delete migrated assessments (CAREFUL!)
DELETE FROM assessment_reports
WHERE created_by = '9307a07c-1dd4-4c32-8b17-324b0910b3c3'
  AND created_at > '2024-01-01';

-- Reset swimmer assessment status
UPDATE swimmers
SET assessment_status = 'not_scheduled'
WHERE assessment_status = 'completed'
  AND id IN (
    SELECT swimmer_id
    FROM assessment_reports
    WHERE created_by = '9307a07c-1dd4-4c32-8b17-324b0910b3c3'
  );
```

## Support

For issues:
1. Check the error logs in console and `migration_report_assessments.json`
2. Verify database structure matches expected schema
3. Ensure CSV file format matches Airtable export
4. Check network connectivity to Supabase