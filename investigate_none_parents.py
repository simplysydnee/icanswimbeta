#!/usr/bin/env python3
"""
Investigate swimmers with 'None' parent names.
Check if they exist in CSV and what their correct parent names should be.
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

def main():
    csv_path = "/Users/sydnee/Desktop/Clients-All data all fields  (3).csv"

    print("INVESTIGATING 'None' PARENT NAMES")
    print("=" * 60)

    # Initialize Supabase
    supabase = create_client(
        os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        os.getenv('SUPABASE_SECRET_KEY')
    )

    # Get swimmers with 'None' or null parent names and pending_enrollment status
    print("\n1. Finding swimmers with 'None' parent names in database...")

    try:
        # Query for swimmers with None/null parent names
        response = supabase.table('swimmers').select(
            'id, first_name, last_name, parent_name, enrollment_status, parent_email'
        ).eq('enrollment_status', 'pending_enrollment').execute()

        none_parents = []
        for swimmer in response.data:
            parent_name = swimmer.get('parent_name')
            if parent_name in [None, 'None', 'none', '']:
                none_parents.append(swimmer)

        print(f"Found {len(none_parents)} pending_enrollment swimmers with None/null parent names")

        if not none_parents:
            print("No swimmers with None parent names found.")
            return

        # Load CSV data
        print("\n2. Loading CSV data...")
        csv_data = {}

        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            header = next(reader)

            # Find columns
            parent_name_idx = -1
            for i, col in enumerate(header):
                if 'Parent Name' in col:
                    parent_name_idx = i
                    break

            if parent_name_idx == -1:
                print("Error: Parent Name column not found")
                return

            # Build mapping of UUID to parent name from CSV
            for row in reader:
                if not row:
                    continue

                # Find UUID in row
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

        print(f"Loaded {len(csv_data)} UUID->ParentName mappings from CSV")

        # Check each swimmer with None parent name
        print("\n3. Checking each swimmer...")
        print("-" * 60)

        matches = 0
        no_csv_match = 0
        csv_but_none = 0

        for swimmer in none_parents[:20]:  # Check first 20
            swimmer_id = swimmer['id']
            swimmer_name = f"{swimmer['first_name']} {swimmer['last_name']}"

            if swimmer_id in csv_data:
                csv_parent_name = csv_data[swimmer_id]
                print(f"✓ {swimmer_name} (ID: {swimmer_id[:8]}...)")
                print(f"  CSV has parent name: '{csv_parent_name}'")
                print(f"  Database has: '{swimmer.get('parent_name')}'")
                print(f"  Parent email: {swimmer.get('parent_email', 'No email')}")
                matches += 1
            else:
                print(f"✗ {swimmer_name} (ID: {swimmer_id[:8]}...)")
                print(f"  NOT FOUND in CSV")
                print(f"  Parent email: {swimmer.get('parent_email', 'No email')}")
                no_csv_match += 1

            print()

        print(f"\n4. Summary for first {len(none_parents[:20])} swimmers:")
        print(f"   Found in CSV with parent name: {matches}")
        print(f"   Not found in CSV: {no_csv_match}")

        if matches > 0:
            print(f"\n5. ISSUE IDENTIFIED:")
            print(f"   {matches} swimmers have parent names in CSV but 'None' in database")
            print(f"   These should have been updated but weren't!")

            # Check why updates didn't happen
            print(f"\n6. Testing update for first match...")
            test_swimmer = none_parents[0]
            test_id = test_swimmer['id']

            if test_id in csv_data:
                print(f"   Test swimmer: {test_swimmer['first_name']} {test_swimmer['last_name']}")
                print(f"   CSV parent name: '{csv_data[test_id]}'")
                print(f"   DB parent name: '{test_swimmer.get('parent_name')}'")

                # Try to update
                try:
                    update_response = supabase.table('swimmers').update({
                        'parent_name': csv_data[test_id]
                    }).eq('id', test_id).execute()

                    if update_response.data:
                        print(f"   ✓ UPDATE SUCCESSFUL")
                        print(f"   Updated to: '{csv_data[test_id]}'")
                    else:
                        print(f"   ✗ UPDATE FAILED")
                except Exception as e:
                    print(f"   ✗ ERROR: {e}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()