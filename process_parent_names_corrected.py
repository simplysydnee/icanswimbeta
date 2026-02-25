#!/usr/bin/env python3
"""
Process CSV file from Airtable and generate SQL migration for parent names.
Corrected version that properly handles the CSV structure.
"""

import csv
import sys
import os
import re
from pathlib import Path

def find_uuid(value):
    """Check if a value is a valid UUID."""
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if value and uuid_pattern.match(value.strip()):
        return value.strip()
    return None

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
    records_with_uuid = 0
    records_with_parent_name = 0
    records_to_update = 0

    # Read CSV and collect updates
    updates = []

    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            # Use reader to handle the CSV
            reader = csv.reader(csvfile)

            # Read header
            header = next(reader)
            print(f"CSV has {len(header)} columns")

            # Find Parent Name column index
            parent_name_idx = -1
            for i, col in enumerate(header):
                if 'Parent Name' in col:
                    parent_name_idx = i
                    print(f"Parent Name column found at index {i}")
                    break

            if parent_name_idx == -1:
                print("Error: Could not find 'Parent Name' column in CSV")
                sys.exit(1)

            for row in reader:
                total_records += 1

                # Skip empty rows
                if not row:
                    continue

                # Get parent name
                if len(row) > parent_name_idx:
                    parent_name = row[parent_name_idx].strip()
                else:
                    parent_name = ""

                # Look for UUID in any column
                uuid_value = None
                for cell in row:
                    uuid_candidate = find_uuid(cell)
                    if uuid_candidate:
                        uuid_value = uuid_candidate
                        break

                if uuid_value:
                    records_with_uuid += 1

                    if parent_name:
                        records_with_parent_name += 1

                        # Clean up the parent name
                        if parent_name.startswith('"') and parent_name.endswith('"'):
                            parent_name = parent_name[1:-1]

                        updates.append({
                            'supabase_id': uuid_value,
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
    print(f"Records with UUID: {records_with_uuid}")
    print(f"Records with Parent Name: {records_with_parent_name}")
    print(f"Records to update: {records_to_update}")

    if records_to_update == 0:
        print("No records to update. Exiting.")
        return

    # Generate SQL migration
    print(f"\nGenerating SQL migration...")

    sql_content = """-- Migration: Fix parent names from Airtable - Bulk Update
-- This migration updates the parent_name field in swimmers table with correct names from Airtable
-- Generated from CSV export on 2026-02-20 (corrected version)

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
"""

    # Add VALUES clauses
    for i, update in enumerate(updates):
        # Add comma unless it's the last record
        if i > 0:
            sql_content += ",\n"

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
        print(f"Total records to update: {records_to_update}")

    except Exception as e:
        print(f"Error writing SQL file: {e}")
        sys.exit(1)

def main():
    # Configuration
    csv_path = "/Users/sydnee/Documents/Clients-Grid view.csv"
    output_sql_path = "/Users/sydnee/icanswimbeta/supabase/migrations/20260220000003_fix_parent_names_corrected.sql"

    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_sql_path), exist_ok=True)

    # Process CSV and generate SQL
    process_csv(csv_path, output_sql_path, batch_size=100)

    print("\n=== Next Steps ===")
    print("1. Review the generated SQL file")
    print("2. Run the migration in Supabase")
    print("3. Verify updates by checking sample records")

if __name__ == "__main__":
    main()