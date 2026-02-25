#!/usr/bin/env python3
"""
Run parent name migration in batches.
"""

import re
import sys

def read_sql_file(file_path):
    """Read SQL file and extract the INSERT statements."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the INSERT statement
    insert_match = re.search(r'INSERT INTO parent_name_updates.*?VALUES(.*?);', content, re.DOTALL | re.IGNORECASE)
    if not insert_match:
        print("Error: Could not find INSERT statement in SQL file")
        sys.exit(1)

    values_text = insert_match.group(1)

    # Parse the values
    values = []
    # Simple parsing - look for patterns like ('uuid', 'name')
    pattern = re.compile(r"\s*\('([^']+)',\s*'([^']+)'\)")

    for match in pattern.finditer(values_text):
        uuid_val = match.group(1)
        name_val = match.group(2)
        values.append((uuid_val, name_val))

    print(f"Found {len(values)} records in SQL file")
    return values

def create_batch_sql(batch_values, batch_num):
    """Create SQL for a batch."""
    sql = f"""-- Batch {batch_num}: Update {len(batch_values)} parent names from Airtable

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
"""

    for i, (uuid_val, name_val) in enumerate(batch_values):
        if i > 0:
            sql += ",\n"
        sql += f"  ('{uuid_val}', '{name_val}')"

    sql += """;

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

-- Clean up temporary table
DROP TABLE IF EXISTS parent_name_updates;
"""

    return sql

def main():
    sql_file = "/Users/sydnee/icanswimbeta/supabase/migrations/20260220000003_fix_parent_names_corrected.sql"
    batch_size = 100

    print(f"Reading SQL file: {sql_file}")
    values = read_sql_file(sql_file)

    # Create batches
    num_batches = (len(values) + batch_size - 1) // batch_size
    print(f"Creating {num_batches} batches of up to {batch_size} records each")

    for batch_num in range(num_batches):
        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, len(values))
        batch_values = values[start_idx:end_idx]

        batch_sql = create_batch_sql(batch_values, batch_num + 1)

        batch_file = f"/Users/sydnee/icanswimbeta/supabase/migrations/20260220000005_fix_parent_names_batch_{batch_num + 1}.sql"

        with open(batch_file, 'w', encoding='utf-8') as f:
            f.write(batch_sql)

        print(f"Created batch {batch_num + 1}: {len(batch_values)} records -> {batch_file}")

    print(f"\n=== Next Steps ===")
    print(f"1. Review the batch files in supabase/migrations/")
    print(f"2. Run each batch sequentially using Supabase MCP tools")
    print(f"3. Start with batch 1 and verify it works before proceeding")

if __name__ == "__main__":
    main()