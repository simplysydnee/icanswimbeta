#!/usr/bin/env python3
"""
Find swimmers where CSV parent name doesn't match database parent name.
"""

import csv
import sys
import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env.local')
load_dotenv(env_path)

def find_uuid(value):
    """Check if a value is a valid UUID."""
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if value and uuid_pattern.match(value.strip()):
        return value.strip()
    return None

def normalize_name(name):
    """Normalize name for comparison."""
    if not name:
        return ''
    # Convert to lowercase, strip, remove extra spaces
    return ' '.join(str(name).strip().lower().split())

def main():
    csv_path = "/Users/sydnee/Desktop/Clients-All data all fields  (3).csv"

    print("FINDING MISMATCHED PARENT NAMES")
    print("=" * 60)
    print("Looking for swimmers where CSV parent name ≠ Database parent name")
    print()

    # Initialize Supabase
    supabase = create_client(
        os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        os.getenv('SUPABASE_SECRET_KEY')
    )

    # Load CSV data
    print("1. Loading CSV data...")
    csv_data = {}  # uuid -> parent_name

    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            header = next(reader)

            # Find columns
            parent_name_idx = -1
            for i, col in enumerate(header):
                if 'Parent Name' in col:
                    parent_name_idx = i
                    print(f"   Parent Name column at index {i}")
                    break

            if parent_name_idx == -1:
                print("Error: Parent Name column not found")
                return

            # Process CSV
            row_count = 0
            for row in reader:
                row_count += 1
                if not row:
                    continue

                # Find UUID
                uuid_value = None
                for cell in row:
                    uuid_candidate = find_uuid(cell)
                    if uuid_candidate:
                        uuid_value = uuid_candidate
                        break

                if uuid_value and len(row) > parent_name_idx:
                    parent_name = row[parent_name_idx].strip()
                    if parent_name:
                        # Clean name
                        if parent_name.startswith('"') and parent_name.endswith('"'):
                            parent_name = parent_name[1:-1]
                        csv_data[uuid_value] = parent_name

                # Progress
                if row_count % 500 == 0:
                    print(f"   Processed {row_count} rows...")

        print(f"   Total CSV rows: {row_count}")
        print(f"   UUID-ParentName pairs in CSV: {len(csv_data)}")

    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    # Check for mismatches
    print("\n2. Checking for mismatches with database...")

    mismatches = []
    matches = 0
    not_in_db = 0

    # Check in batches to avoid too many queries
    batch_size = 100
    uuids = list(csv_data.keys())

    for i in range(0, len(uuids), batch_size):
        batch = uuids[i:i+batch_size]

        try:
            # Query swimmers in this batch
            response = supabase.table('swimmers').select(
                'id, first_name, last_name, parent_name, enrollment_status'
            ).in_('id', batch).execute()

            swimmers_by_id = {s['id']: s for s in response.data}

            for uuid in batch:
                if uuid in swimmers_by_id:
                    swimmer = swimmers_by_id[uuid]
                    db_parent_name = swimmer.get('parent_name', '')
                    csv_parent_name = csv_data[uuid]

                    # Normalize for comparison
                    db_normalized = normalize_name(db_parent_name)
                    csv_normalized = normalize_name(csv_parent_name)

                    if db_normalized != csv_normalized:
                        mismatches.append({
                            'id': uuid,
                            'swimmer': f"{swimmer['first_name']} {swimmer['last_name']}",
                            'db_name': db_parent_name,
                            'csv_name': csv_parent_name,
                            'status': swimmer.get('enrollment_status', 'unknown')
                        })
                    else:
                        matches += 1
                else:
                    not_in_db += 1

            # Progress
            processed = min(i + batch_size, len(uuids))
            print(f"   Checked {processed}/{len(uuids)} UUIDs...")

        except Exception as e:
            print(f"   Error checking batch: {e}")

    print(f"\n3. RESULTS:")
    print(f"   Total UUIDs in CSV: {len(uuids)}")
    print(f"   Found in database: {len(uuids) - not_in_db}")
    print(f"   Not in database: {not_in_db}")
    print(f"   Parent names match: {matches}")
    print(f"   Parent names MISMATCH: {len(mismatches)}")

    if mismatches:
        print(f"\n4. MISMATCHES FOUND (showing first 20):")
        print("-" * 60)

        # Filter for pending_enrollment only
        pending_mismatches = [m for m in mismatches if m['status'] == 'pending_enrollment']
        other_mismatches = [m for m in mismatches if m['status'] != 'pending_enrollment']

        print(f"   Pending enrollment mismatches: {len(pending_mismatches)}")
        print(f"   Other status mismatches: {len(other_mismatches)}")

        if pending_mismatches:
            print(f"\n   PENDING ENROLLMENT swimmers needing updates:")
            for i, mismatch in enumerate(pending_mismatches[:20]):
                print(f"   {i+1}. {mismatch['swimmer']}")
                print(f"      DB: '{mismatch['db_name']}'")
                print(f"      CSV: '{mismatch['csv_name']}'")
                print()

        if other_mismatches:
            print(f"\n   Other status swimmers (would be skipped):")
            status_counts = {}
            for m in other_mismatches:
                status = m['status']
                status_counts[status] = status_counts.get(status, 0) + 1

            for status, count in status_counts.items():
                print(f"      {status}: {count}")

        # Estimate total bad parent names
        print(f"\n5. ESTIMATE OF '213 bad parent names':")
        print(f"   Based on {len(mismatches)} total mismatches")
        print(f"   {len(pending_mismatches)} are pending_enrollment (would be updated)")
        print(f"   {len(other_mismatches)} are other status (would be skipped)")

    else:
        print(f"\n4. NO MISMATCHES FOUND!")
        print(f"   All parent names in database match CSV data.")

if __name__ == "__main__":
    main()