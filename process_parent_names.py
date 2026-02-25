#!/usr/bin/env python3
"""
Process CSV file from Airtable and generate SQL migration for parent names.
This script reads the CSV file, extracts Supabase ID and Parent Name,
and generates SQL UPDATE statements to fix parent names in the swimmers table.
"""

import csv
import sys
import os
from pathlib import Path

def process_csv(csv_path, output_sql_path, batch_size=100):
    """
    Process CSV file and generate SQL migration.

    Args:
        csv_path: Path to the CSV file
        output_sql_path: Path to output SQL file
        batch_size: Number of records per batch (to avoid timeouts)
    """

    print(f"Processing CSV file: {csv_path}")
    print(f"Output SQL file: {output_sql_path}")
    print(f"Batch size: {batch_size}")

    # Track statistics
    total_records = 0
    records_with_supabase_id = 0
    records_with_parent_name = 0
    records_to_update = 0

    # Read CSV and collect updates
    updates = []

    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            # Use DictReader to handle columns by name
            reader = csv.DictReader(csvfile)

            for row in reader:
                total_records += 1

                # Get Supabase ID (column 93, index 92 in 0-based)
                supabase_id = row.get('Supabase ID', '').strip()

                if supabase_id:
                    records_with_supabase_id += 1

                    # Get Parent Name (column 4, index 3 in 0-based)
                    parent_name = row.get('Parent Name', '').strip()

                    if parent_name:
                        records_with_parent_name += 1

                        # Clean up the parent name - remove extra quotes if present
                        if parent_name.startswith('"') and parent_name.endswith('"'):
                            parent_name = parent_name[1:-1]

                        # Only add if we have both values
                        updates.append({
                            'supabase_id': supabase_id,
                            'parent_name': parent_name
                        })
                        records_to_update += 1

                    # Progress indicator
                    if total_records % 100 == 0:
                        print(f"Processed {total_records} records...")

    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)

    print(f"\n=== Statistics ===")
    print(f"Total records in CSV: {total_records}")
    print(f"Records with Supabase ID: {records_with_supabase_id}")
    print(f"Records with Parent Name: {records_with_parent_name}")
    print(f"Records to update: {records_to_update}")

    if records_to_update == 0:
        print("No records to update. Exiting.")
        return

    # Generate SQL migration
    print(f"\nGenerating SQL migration...")

    sql_content = """-- Migration: Fix parent names from Airtable - Bulk Update
-- This migration updates the parent_name field in swimmers table with correct names from Airtable
-- Generated from CSV export on 2026-02-20

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
"""

    # Add VALUES clauses in batches
    batch_count = 0
    for i, update in enumerate(updates):
        # Add comma unless it's the last record in a batch
        if i > 0 and i % batch_size != 0:
            sql_content += ",\n"

        # Start new batch if needed
        if i % batch_size == 0:
            if i > 0:
                sql_content += ";\n\n-- Continue with next batch\nINSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES\n"
            batch_count += 1

        # Escape single quotes in parent name
        escaped_parent_name = update['parent_name'].replace("'", "''")
        sql_content += f"  ('{update['supabase_id']}', '{escaped_parent_name}')"

    sql_content += """;

-- Update swimmers with correct parent names
UPDATE swimmers s
SET parent_name = pnu.correct_parent_name
FROM parent_name_updates pnu
WHERE s.id = pnu.supabase_id
  AND s.parent_name IS DISTINCT FROM pnu.correct_parent_name;

-- Count how many records were updated
SELECT
  COUNT(*) as total_updates_applied,
  (SELECT COUNT(*) FROM parent_name_updates) as total_updates_available
FROM swimmers s
JOIN parent_name_updates pnu ON s.id = pnu.supabase_id
WHERE s.parent_name = pnu.correct_parent_name;

-- Show sample of updated records (first 20)
SELECT
  s.id,
  s.first_name,
  s.last_name,
  s.parent_name as new_parent_name,
  pnu.correct_parent_name as expected_parent_name,
  s.parent_email
FROM swimmers s
JOIN parent_name_updates pnu ON s.id = pnu.supabase_id
WHERE s.parent_name = pnu.correct_parent_name
LIMIT 20;

-- Clean up temporary table
DROP TABLE IF EXISTS parent_name_updates;

-- Note: This migration updates parent names for all swimmers with data from Airtable.
-- The update is idempotent (won't update if parent_name already matches).
"""

    # Write SQL file
    try:
        with open(output_sql_path, 'w', encoding='utf-8') as sqlfile:
            sqlfile.write(sql_content)

        print(f"SQL migration generated successfully: {output_sql_path}")
        print(f"Total batches: {batch_count}")
        print(f"Records per batch: {batch_size}")

        # Also create a simple version for testing with first 10 records
        test_sql_path = output_sql_path.replace('.sql', '_test.sql')
        test_sql_content = """-- Test migration: Update first 10 parent names from Airtable

-- Test updates for specific swimmers
"""

        for i, update in enumerate(updates[:10]):
            escaped_parent_name = update['parent_name'].replace("'", "''")
            test_sql_content += f"UPDATE swimmers SET parent_name = '{escaped_parent_name}' WHERE id = '{update['supabase_id']}';\n"

        test_sql_content += """
-- Verify the updates
SELECT id, first_name, last_name, parent_name, parent_email
FROM swimmers
WHERE id IN (
"""

        for i, update in enumerate(updates[:10]):
            if i > 0:
                test_sql_content += ",\n"
            test_sql_content += f"  '{update['supabase_id']}'"

        test_sql_content += """
)
ORDER BY first_name;
"""

        with open(test_sql_path, 'w', encoding='utf-8') as testfile:
            testfile.write(test_sql_content)

        print(f"Test SQL file created: {test_sql_path}")

    except Exception as e:
        print(f"Error writing SQL file: {e}")
        sys.exit(1)

def main():
    # Configuration
    csv_path = "/Users/sydnee/Documents/Clients-Grid view.csv"
    output_sql_path = "/Users/sydnee/icanswimbeta/supabase/migrations/20260220000001_fix_all_parent_names_from_airtable.sql"
    batch_size = 100  # Update 100 records at a time to avoid timeouts

    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_sql_path), exist_ok=True)

    # Process CSV and generate SQL
    process_csv(csv_path, output_sql_path, batch_size)

    print("\n=== Next Steps ===")
    print("1. Review the generated SQL file for any issues")
    print("2. Run the test SQL file first to verify updates work")
    print("3. Run the full migration in Supabase")
    print("4. Verify updates by checking sample records")
    print("5. Test parent invitations to ensure correct names appear")

if __name__ == "__main__":
    main()