#!/usr/bin/env python3
"""
Quick check of parent names in CSV and database.
Counts how many records would be updated.
"""

import csv
import sys
import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.local in project root
env_path = os.path.join(os.path.dirname(__file__), '.env.local')
load_dotenv(env_path)

def find_uuid(value):
    """Check if a value is a valid UUID."""
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if value and uuid_pattern.match(value.strip()):
        return value.strip()
    return None

def get_supabase_client() -> Client:
    """Initialize and return Supabase client."""
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SECRET_KEY')

    if not supabase_url or not supabase_key:
        print("Error: Supabase URL or secret key not found in environment variables")
        sys.exit(1)

    return create_client(supabase_url, supabase_key)

def main():
    csv_path = "/Users/sydnee/Desktop/Clients-All data all fields  (3).csv"

    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)

    print("QUICK PARENT NAME CHECK")
    print("=" * 50)
    print(f"CSV file: {csv_path}")
    print("Checking for parent name updates...")
    print()

    # Initialize Supabase client
    supabase = get_supabase_client()

    # Statistics
    stats = {
        'total_csv_records': 0,
        'records_with_uuid': 0,
        'records_with_parent_name': 0,
        'pending_enrollment_updates': 0,
        'other_status_skipped': 0,
        'no_match_skipped': 0,
        'sample_updates': []
    }

    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            header = next(reader)

            # Find Parent Name column
            parent_name_idx = -1
            for i, col in enumerate(header):
                if 'Parent Name' in col:
                    parent_name_idx = i
                    print(f"Found 'Parent Name' column at index {i}")
                    break

            if parent_name_idx == -1:
                print("Error: Could not find 'Parent Name' column")
                sys.exit(1)

            # Process first 200 records for quick check
            max_records = 200
            for row in reader:
                stats['total_csv_records'] += 1

                if stats['total_csv_records'] > max_records:
                    break

                if not row:
                    continue

                # Get parent name
                if len(row) > parent_name_idx:
                    parent_name = row[parent_name_idx].strip()
                else:
                    parent_name = ""

                # Look for UUID
                uuid_value = None
                for cell in row:
                    uuid_candidate = find_uuid(cell)
                    if uuid_candidate:
                        uuid_value = uuid_candidate
                        break

                if uuid_value:
                    stats['records_with_uuid'] += 1

                    if parent_name:
                        stats['records_with_parent_name'] += 1

                        # Clean parent name
                        if parent_name.startswith('"') and parent_name.endswith('"'):
                            parent_name = parent_name[1:-1]

                        # Check swimmer in database
                        try:
                            response = supabase.table('swimmers').select('id, first_name, last_name, parent_name, enrollment_status').eq('id', uuid_value).execute()

                            if response.data and len(response.data) > 0:
                                swimmer = response.data[0]

                                if swimmer.get('enrollment_status') == 'pending_enrollment':
                                    stats['pending_enrollment_updates'] += 1

                                    # Store sample (first 10)
                                    if len(stats['sample_updates']) < 10:
                                        stats['sample_updates'].append({
                                            'id': uuid_value,
                                            'current_name': swimmer.get('parent_name', ''),
                                            'new_name': parent_name,
                                            'swimmer_name': f"{swimmer.get('first_name', '')} {swimmer.get('last_name', '')}"
                                        })
                                else:
                                    stats['other_status_skipped'] += 1
                            else:
                                stats['no_match_skipped'] += 1

                        except Exception as e:
                            print(f"Error checking {uuid_value}: {e}")

                # Progress
                if stats['total_csv_records'] % 50 == 0:
                    print(f"Processed {stats['total_csv_records']} records...")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    print(f"\n{'='*50}")
    print("QUICK CHECK RESULTS")
    print(f"{'='*50}")
    print(f"CSV records checked: {stats['total_csv_records']}")
    print(f"Records with UUID: {stats['records_with_uuid']}")
    print(f"Records with Parent Name: {stats['records_with_parent_name']}")
    print(f"Would update (pending_enrollment): {stats['pending_enrollment_updates']}")
    print(f"Would skip (other status): {stats['other_status_skipped']}")
    print(f"Would skip (no match in DB): {stats['no_match_skipped']}")
    print(f"\nSample updates (first 10):")

    for i, update in enumerate(stats['sample_updates']):
        print(f"  {i+1}. {update['swimmer_name']}")
        print(f"     Current: '{update['current_name']}'")
        print(f"     New:     '{update['new_name']}'")

    print(f"\n{'='*50}")
    print("ESTIMATE FOR FULL DATASET:")
    print(f"Based on sample of {stats['total_csv_records']} records:")

    if stats['total_csv_records'] > 0:
        update_rate = stats['pending_enrollment_updates'] / stats['total_csv_records']
        print(f"  • Update rate: {update_rate:.1%}")
        print(f"  • Estimated total updates: ~{int(update_rate * 1430)} of 1430 records")

    print(f"\nNext: Run the full update with fix_parent_names_auto.py")
    print("Set dry_run = False to apply changes")

if __name__ == "__main__":
    main()