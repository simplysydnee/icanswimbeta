#!/usr/bin/env python3
"""
Run parent name migration in chunks directly from corrected SQL file.
This avoids the buggy batch creation script.
"""

import re
import sys

def extract_records_from_sql(sql_file):
    """Extract UUID and parent name pairs from SQL file."""
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all UUID-parent name pairs
    pattern = re.compile(r"\s*\('([0-9a-f-]+)',\s*'([^']+)'\)")
    matches = pattern.findall(content)

    print(f"Found {len(matches)} records in SQL file")
    return matches

def create_chunk_sql(records, chunk_num, start_idx, end_idx):
    """Create SQL for a chunk of records."""
    chunk_records = records[start_idx:end_idx]

    sql = f"""-- Chunk {chunk_num}: Update {len(chunk_records)} parent names from Airtable
-- Records {start_idx + 1} to {end_idx} of {len(records)}

-- Create a temporary table to hold the updates
CREATE TEMPORARY TABLE IF NOT EXISTS parent_name_updates (
  supabase_id UUID PRIMARY KEY,
  correct_parent_name TEXT NOT NULL
);

-- Insert updates from CSV data
INSERT INTO parent_name_updates (supabase_id, correct_parent_name) VALUES
"""

    for i, (uuid_val, name_val) in enumerate(chunk_records):
        if i > 0:
            sql += ",\n"
        # Escape single quotes in parent name
        escaped_name = name_val.replace("'", "''")
        sql += f"  ('{uuid_val}', '{escaped_name}')"

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

    return sql, chunk_records

def main():
    sql_file = "/Users/sydnee/icanswimbeta/supabase/migrations/20260220000003_fix_parent_names_corrected.sql"
    chunk_size = 100  # Records per chunk

    print(f"Reading SQL file: {sql_file}")
    all_records = extract_records_from_sql(sql_file)

    # We've already processed the first 120 records (batch 1: 100, batch 2: 20)
    already_processed = 120
    start_index = already_processed

    if start_index >= len(all_records):
        print(f"All {len(all_records)} records have already been processed.")
        return

    remaining = len(all_records) - start_index
    num_chunks = (remaining + chunk_size - 1) // chunk_size

    print(f"\nAlready processed: {already_processed} records")
    print(f"Remaining to process: {remaining} records")
    print(f"Number of chunks needed: {num_chunks}")

    print(f"\n=== Next Steps ===")
    print(f"1. Chunk 1 will process records {start_index + 1} to {min(start_index + chunk_size, len(all_records))}")
    print(f"2. Each chunk SQL will be saved to a file")
    print(f"3. Run each chunk using Supabase MCP tools")
    print(f"4. Verify after each chunk")

    # Create first chunk
    chunk_num = 1
    end_idx = min(start_index + chunk_size, len(all_records))
    chunk_sql, chunk_records = create_chunk_sql(all_records, chunk_num, start_index, end_idx)

    chunk_file = f"/Users/sydnee/icanswimbeta/supabase/migrations/20260220000007_fix_parent_names_chunk_{chunk_num}.sql"

    with open(chunk_file, 'w', encoding='utf-8') as f:
        f.write(chunk_sql)

    print(f"\nCreated chunk {chunk_num}: {len(chunk_records)} records -> {chunk_file}")
    print(f"First few records in this chunk:")
    for i, (uuid_val, name_val) in enumerate(chunk_records[:3]):
        print(f"  {i+1}. {uuid_val[:8]}... -> {name_val[:30]}...")

    # Create remaining chunks
    for i in range(1, num_chunks):
        chunk_num = i + 1
        start_idx = start_index + (i * chunk_size)
        end_idx = min(start_idx + chunk_size, len(all_records))

        if start_idx >= len(all_records):
            break

        chunk_sql, chunk_records = create_chunk_sql(all_records, chunk_num, start_idx, end_idx)
        chunk_file = f"/Users/sydnee/icanswimbeta/supabase/migrations/20260220000007_fix_parent_names_chunk_{chunk_num}.sql"

        with open(chunk_file, 'w', encoding='utf-8') as f:
            f.write(chunk_sql)

        print(f"Created chunk {chunk_num}: {len(chunk_records)} records -> {chunk_file}")

    print(f"\nTotal chunks created: {num_chunks}")
    print(f"Run 'chunk_1.sql' first, then proceed sequentially.")

if __name__ == "__main__":
    main()