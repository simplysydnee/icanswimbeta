#!/usr/bin/env python3
"""
Fix parent names - small batch test.
"""

import csv
import sys
import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv
import time

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env.local')
load_dotenv(env_path)

def find_uuid(value):
    """Check if a value is a valid UUID."""
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if value and uuid_pattern.match(value.strip()):
        return value.strip()
    return None

def main():
    csv_path = "/Users/sydnee/Desktop/Clients-All data all fields  (3).csv"

    print("SMALL BATCH PARENT NAME UPDATE")
    print("=" * 50)

    # Initialize Supabase
    supabase = create_client(
        os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        os.getenv('SUPABASE_SECRET_KEY')
    )

    updates = []
    skipped = []

    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            header = next(reader)

            # Find Parent Name column
            parent_name_idx = -1
            for i, col in enumerate(header):
                if 'Parent Name' in col:
                    parent_name_idx = i
                    break

            # Process first 50 rows
            for i, row in enumerate(reader):
                if i >= 50:
                    break

                if not row or len(row) <= parent_name_idx:
                    continue

                parent_name = row[parent_name_idx].strip()

                # Find UUID
                uuid_value = None
                for cell in row:
                    uuid_candidate = find_uuid(cell)
                    if uuid_candidate:
                        uuid_value = uuid_candidate
                        break

                if uuid_value and parent_name:
                    # Clean name
                    if parent_name.startswith('"') and parent_name.endswith('"'):
                        parent_name = parent_name[1:-1]

                    # Check swimmer
                    try:
                        response = supabase.table('swimmers').select('id, first_name, last_name, parent_name, enrollment_status').eq('id', uuid_value).execute()

                        if response.data:
                            swimmer = response.data[0]

                            if swimmer.get('enrollment_status') == 'pending_enrollment':
                                # Update
                                update_response = supabase.table('swimmers').update({
                                    'parent_name': parent_name
                                }).eq('id', uuid_value).execute()

                                if update_response.data:
                                    updates.append({
                                        'id': uuid_value,
                                        'old_name': swimmer.get('parent_name', ''),
                                        'new_name': parent_name,
                                        'swimmer': f"{swimmer.get('first_name', '')} {swimmer.get('last_name', '')}"
                                    })
                                    print(f"✓ Updated: {swimmer.get('first_name', '')} {swimmer.get('last_name', '')}")
                                else:
                                    print(f"✗ Failed: {uuid_value}")
                            else:
                                skipped.append({
                                    'id': uuid_value,
                                    'status': swimmer.get('enrollment_status', 'unknown'),
                                    'swimmer': f"{swimmer.get('first_name', '')} {swimmer.get('last_name', '')}"
                                })
                        else:
                            print(f"- No match: {uuid_value}")

                    except Exception as e:
                        print(f"! Error: {uuid_value} - {e}")

                    time.sleep(0.1)

    except Exception as e:
        print(f"Fatal error: {e}")
        return

    print(f"\n{'='*50}")
    print("RESULTS")
    print(f"{'='*50}")
    print(f"Updates applied: {len(updates)}")
    print(f"Skipped (wrong status): {len(skipped)}")

    if updates:
        print("\nUpdated records:")
        for i, update in enumerate(updates[:10]):  # Show first 10
            print(f"  {i+1}. {update['swimmer']}")
            print(f"     From: '{update['old_name']}'")
            print(f"     To:   '{update['new_name']}'")

    if skipped:
        print(f"\nSkipped records (status not 'pending_enrollment'):")
        status_counts = {}
        for s in skipped:
            status = s['status']
            status_counts[status] = status_counts.get(status, 0) + 1

        for status, count in status_counts.items():
            print(f"  {status}: {count}")

if __name__ == "__main__":
    main()