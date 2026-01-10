# Airtable to Supabase Migration

This script migrates "Actively Enrolled ✅" clients from Airtable to Supabase.

## Prerequisites

1. Node.js 18 or higher
2. Airtable API key with access to the base
3. Supabase project with service role key
4. Database schema must be set up (swimmers and profiles tables)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template:
   ```bash
   cp .env.migration.example .env.migration
   ```

3. Edit `.env.migration` with your credentials:
   - `AIRTABLE_API_KEY`: Your Airtable API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `ADMIN_USER_ID`: (Optional) UUID of admin user for created_by/approved_by fields

## Database Schema Requirements

The Supabase database must have the following tables:

### `profiles` table
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `swimmers` table
See `supabase/migrations/001_core_tables.sql` for full schema.

## Airtable Requirements

The Airtable base must have:
- Base ID: `appa5hlX697VP1FSo`
- Table: `Clients` (ID: `tblXfCVX2NaUuXbYm`)
- View: `All data all fields ` (ID: `viwKm0ev03MhrSyCc`)

The script will create the following tracking fields in Airtable:
- `Supabase Migrated` (Checkbox)
- `Supabase ID` (Single line text)
- `Supabase Parent ID` (Single line text)
- `Migration Date` (Date)
- `Migration Notes` (Long text)

## Running the Migration

1. **Test with a single record:**
   ```bash
   node -e "require('./airtable_migration.js').runMigration()"
   ```

2. **Run full migration:**
   ```bash
   npm run migrate
   ```

   Or:
   ```bash
   node airtable_migration.js
   ```

## Migration Process

For each "Actively Enrolled ✅" client:

1. **Parse client name:**
   - Extracts first and last name
   - Detects `(P)` or `[P]` markers for private pay

2. **Determine funding source:**
   - If name has `(P)` or `[P]` → `private_pay`
   - Else if "Email of VMRC Coordinator" contains "vmrc" → `vmrc`
   - Else if "Email of VMRC Coordinator" contains "cvrc" → `cvrc`
   - Else → `private_pay`

3. **Get or create parent profile:**
   - Checks if profile exists by email
   - Creates new profile if not found
   - Links to existing profile if found

4. **Create swimmer record:**
   - Maps all Airtable fields to Supabase schema
   - Sets enrollment status to "enrolled"
   - Sets approval status to "approved"

5. **Update Airtable:**
   - Marks record as migrated
   - Stores Supabase IDs
   - Adds migration date and notes

## Progress Reporting

The script reports progress every 50 records:
- Total processed
- Successfully migrated
- New parents created
- Linked to existing parents
- Errors encountered

## Error Handling

If an error occurs:
- Error is logged to console
- Record is skipped (migration continues)
- Error message is stored in Airtable "Migration Notes"
- Error details are included in final report

## Post-Migration

After migration completes:
1. Review the migration summary
2. Check error details for any issues
3. Verify data in Supabase
4. Update any missing fields manually if needed

## Notes

- The script processes ~350 "Actively Enrolled ✅" clients
- Migration runs in batches of 50 with 2-second delays
- Parent profiles are created without auth.users reference (for migration purposes)
- Created_by and approved_by fields are set to null (can be updated later)
- All migrated swimmers are set to "enrolled" status