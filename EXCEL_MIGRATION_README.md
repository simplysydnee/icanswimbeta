# Excel Skill Tracker Migration Guide

## Overview
This guide explains how to migrate skill data from ~381 Excel skill tracker files to Supabase. The migration script updates existing records and avoids creating duplicates.

## Prerequisites

### 1. Python Environment
Ensure you have Python 3.7+ installed. Install required packages:
```bash
pip install pandas openpyxl supabase python-dotenv
```

### 2. Supabase Access
You need:
- Supabase project URL (`NEXT_PUBLIC_SUPABASE_URL`)
- Service role key (`SUPABASE_SECRET_KEY`) from Supabase Dashboard > Settings > API

### 3. Excel Files
Place all Excel files in a directory. Files should follow naming pattern:
- `FirstName_LastName_Red_White_Skill_Tracker.xlsx`
- `FirstName_LastName_Yellow_Green_Blue_Master_Skill_Tracker.xlsx`

## File Structure
Excel files should have the following structure in the "RedWhite" sheet (or similar):

| Section | Rows | Columns |
|---------|------|---------|
| Safety Skills | 3-4 | Level, Skill, Status, DateStarted, DateMet, Notes |
| Swim Skills | 8-17 | Level, Skill, Status, DateStarted, DateMet, Notes |
| I Can Swim Targets | 21-30 | Target, Status, DateStarted, DateMet |
| Strategies Used | 34-44 | Strategy, Used/NotUsed |
| Additional Notes | 48+ | Date, Notes, InstructorInitials |

## Database Schema

### Tables Used
1. **swimmers** - Central swimmer data
2. **swim_levels** - 5-level progression system (White, Red, Yellow, Green, Blue)
3. **skills** - Skills per level with sequence ordering
4. **swimmer_skills** - Individual progress tracking (status: 'not_started', 'in_progress', 'mastered')

### Required Columns
The `swimmer_skills` table already has all required columns:
- `id` (uuid)
- `swimmer_id` (uuid)
- `skill_id` (uuid)
- `status` (text)
- `date_started` (date)
- `date_met` (timestamp)
- `instructor_notes` (text)
- `is_safety_skill` (boolean)

## Migration Scripts

### 1. Main Migration Script: `excel_skill_migration.py`
```bash
python3 excel_skill_migration.py
```

**Features:**
- Parses Excel files directly
- Maps Excel skill names to database skill names
- Uses UPSERT pattern (update if exists, insert if not)
- Handles duplicate records
- Supports test mode for validation
- Processes in batches for performance

**Interactive Prompts:**
1. Directory path containing Excel files
2. Test mode (recommended: yes for first run)
3. Process all files or sample (recommended: sample for first run)

### 2. Test Script: `test_excel_migration.py`
```bash
python3 test_excel_migration.py
```

**Purpose:** Simulates migration using existing CSV data to verify skill mapping.

## Skill Name Mapping

### Current Mapping (in `excel_skill_migration.py`)
The script includes a comprehensive mapping of Excel skill names to database skill names:

```python
SKILL_NAME_MAP = {
    "Asking permission to get in the wat": "Asking permission to get in the water",
    "Relaxed Submersion": "Relaxed body position",
    "Starfish float on front and back": "Front float with assistance",
    "Bobbing 5 times": "Blow bubbles",
    "Tuck and stand on back": "Back float with assistance",
    "Kicking on front and back 10 feet": "Kicking with board",
    "Jump or roll in, roll to back and b": "Jump or roll in, roll to back and breath",
    "Wearing lifejacket and jump in and ": "Wearing lifejacket and jump in and kick on back 10 feet",
    # ... more mappings
}
```

### Adding New Mappings
If you encounter unmapped skills:
1. Run test mode first to identify unmapped skills
2. Add new mappings to `SKILL_NAME_MAP` dictionary
3. Test again before full migration

## Migration Steps

### Step 1: Preparation
1. **Backup database** before migration
2. **Verify Excel files** are in correct format
3. **Check environment variables** in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SECRET_KEY=your-service-role-key
   ```

### Step 2: Test Migration
```bash
# Run test with sample files
python3 excel_skill_migration.py

# When prompted:
# 1. Enter directory path with Excel files
# 2. Test mode: y (yes)
# 3. Process: sample (first 7 files)
```

**Expected Output:**
- Lists files found
- Shows skill mappings
- Indicates records that would be upserted
- **NO database changes made**

### Step 3: Verify Test Results
Check:
- All swimmers found in database
- All skills mapped correctly
- No critical errors
- Reasonable record counts

### Step 4: Full Migration (Test Mode)
```bash
# Process all files in test mode
python3 excel_skill_migration.py

# When prompted:
# 1. Enter directory path
# 2. Test mode: y (yes)
# 3. Process: all (all files)
```

Review the summary to ensure:
- High success rate (>90% skill mapping)
- Minimal unmapped skills
- Reasonable total record count

### Step 5: Actual Migration
```bash
# Run actual migration
python3 excel_skill_migration.py

# When prompted:
# 1. Enter directory path
# 2. Test mode: n (no)
# 3. Process: all (all files)
```

**Monitor:**
- Progress indicators
- Batch insert counts
- Any errors (will continue on individual errors)

## Error Handling

### Common Issues & Solutions

#### 1. "Swimmer not found in database"
**Cause:** Name mismatch between Excel filename and database
**Solution:**
- Check swimmer name extraction logic
- Verify swimmer exists in database
- Update filename pattern if needed

#### 2. "Skill not found in database"
**Cause:** Skill name not mapped or doesn't exist
**Solution:**
- Add mapping to `SKILL_NAME_MAP`
- Create missing skill in database if needed

#### 3. "Date parsing error"
**Cause:** Unrecognized date format in Excel
**Solution:**
- Script handles multiple formats
- Check Excel date formatting
- Null dates are accepted

#### 4. "Duplicate record error"
**Cause:** Same swimmer+skill combination exists
**Solution:**
- Script uses UPSERT (update existing)
- This is expected behavior

## Verification

### Post-Migration Checks

#### 1. Record Counts
```sql
-- Check total records
SELECT COUNT(*) as total_skills FROM swimmer_skills;
SELECT COUNT(DISTINCT swimmer_id) as unique_swimmers FROM swimmer_skills;
```

#### 2. Sample Data Verification
```sql
-- Check sample records with details
SELECT
  s.first_name,
  s.last_name,
  sk.status,
  skills.name as skill_name,
  sk.date_started,
  sk.date_met,
  sk.instructor_notes
FROM swimmer_skills sk
JOIN swimmers s ON sk.swimmer_id = s.id
JOIN skills ON sk.skill_id = skills.id
LIMIT 10;
```

#### 3. Status Distribution
```sql
-- Check status distribution
SELECT status, COUNT(*) as count
FROM swimmer_skills
GROUP BY status
ORDER BY count DESC;
```

#### 4. Safety Skills Flag
```sql
-- Verify safety skills flag
SELECT is_safety_skill, COUNT(*) as count
FROM swimmer_skills
GROUP BY is_safety_skill;
```

## Performance Considerations

### Batch Processing
- Script processes in batches of 50 records
- Adjust `batch_size` in script if needed
- Larger batches = faster but more memory
- Smaller batches = slower but more reliable

### Memory Usage
- Each Excel file loaded individually
- No all-files-in-memory approach
- Suitable for 381 files

### Error Recovery
- Continues on individual record failures
- Logs errors but doesn't stop
- Failed records can be retried

## Additional Features

### 1. Swimmer Name Extraction
Script extracts names from filenames:
- `FirstName_LastName_Red_White_Skill_Tracker.xlsx` → "FirstName LastName"
- Handles various level indicators (Red_White, Master, etc.)

### 2. Date Parsing
Supports multiple date formats:
- `YYYY-MM-DD`
- `MM/DD/YYYY`
- `DD/MM/YYYY`
- Excel serial dates
- Null/empty dates

### 3. Status Mapping
Excel → Database:
- "Not Started" → "not_started"
- "Emerging" → "in_progress"
- "Met" → "mastered"

### 4. Case-Insensitive Matching
- Handles "JUmp" vs "Jump"
- "asking permission" vs "Asking Permission"
- "swim-roll-swim" vs "Swim-roll-swim"

## Troubleshooting

### Script Won't Start
**Check:**
- Python version (`python3 --version`)
- Required packages installed
- `.env.local` file exists with correct keys
- Directory path exists

### No Excel Files Found
**Check:**
- Directory path is correct
- Files have `.xlsx` or `.xls` extension
- File permissions allow reading

### Database Connection Failed
**Check:**
- Supabase URL is correct
- Service role key has proper permissions
- Network connectivity to Supabase

### Low Mapping Success Rate
**Check:**
- Skill name mapping dictionary
- Excel skill names vs database names
- Run test script to identify unmapped skills

## Support

### Log Files
Script outputs detailed logs to console. For persistent logging, redirect output:
```bash
python3 excel_skill_migration.py > migration_log.txt 2>&1
```

### Getting Help
If issues persist:
1. Check error messages in log
2. Verify Excel file structure
3. Confirm database schema matches
4. Review skill name mappings

## Next Steps After Migration

1. **Update frontend components** to display skill data
2. **Test application functionality** with migrated data
3. **Consider data cleanup** for any unmapped skills
4. **Schedule regular backups** of skill data

## Notes

- Migration is idempotent (can be run multiple times)
- Uses UPSERT to avoid duplicates
- Test mode recommended before full migration
- Script designed for ~381 files but scalable

---

**Last Updated:** 2026-01-27
**Script Version:** 1.0
**Tested With:** Python 3.9+, Supabase PostgreSQL 15