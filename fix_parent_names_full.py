#!/usr/bin/env python3
"""
Fix ALL parent names from CSV with enrollment_status filter.
Processes in chunks with progress reporting.
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

    print("FULL PARENT NAME UPDATE")
    print("=" * 60)
    print(f"CSV file: {csv_path}")
    print("Filter: Only swimmers with enrollment_status = 'pending_enrollment'")
    print()

    # Initialize Supabase
    supabase = create_client(
        os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        os.getenv('SUPABASE_SECRET_KEY')
    )

    # Statistics
    stats = {
        'total_processed': 0,
        'with_uuid': 0,
        'with_parent_name': 0,
        'updates_applied': 0,
        'skipped_not_pending': 0,
        'skipped_no_match': 0,
        'errors': 0,
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
                return

            # Process all rows
            for row in reader:
                stats['total_processed'] += 1

                if not row:
                    continue

                # Get parent name
                if len(row) > parent_name_idx:
                    parent_name = row[parent_name_idx].strip()
                else:
                    parent_name = ""

                # Find UUID
                uuid_value = None
                for cell in row:
                    uuid_candidate = find_uuid(cell)
                    if uuid_candidate:
                        uuid_value = uuid_candidate
                        break

                if uuid_value:
                    stats['with_uuid'] += 1

                    if parent_name:
                        stats['with_parent_name'] += 1

                        # Clean name
                        if parent_name.startswith('"') and parent_name.endswith('"'):
                            parent_name = parent_name[1:-1]

                        # Check and update swimmer
                        try:
                            response = supabase.table('swimmers').select('id, first_name, last_name, parent_name, enrollment_status').eq('id', uuid_value).execute()

                            if response.data:
                                swimmer = response.data[0]

                                if swimmer.get('enrollment_status') == 'pending_enrollment':
                                    # Only update if name is different
                                    current_name = swimmer.get('parent_name', '')
                                    if current_name != parent_name:
                                        update_response = supabase.table('swimmers').update({
                                            'parent_name': parent_name
                                        }).eq('id', uuid_value).execute()

                                        if update_response.data:
                                            stats['updates_applied'] += 1

                                            # Store sample (first 20)
                                            if len(stats['sample_updates']) < 20:
                                                stats['sample_updates'].append({
                                                    'id': uuid_value,
                                                    'swimmer': f"{swimmer.get('first_name', '')} {swimmer.get('last_name', '')}",
                                                    'old_name': current_name,
                                                    'new_name': parent_name
                                                })

                                            if stats['updates_applied'] <= 10 or stats['updates_applied'] % 50 == 0:
                                                print(f"✓ Updated {stats['updates_applied']}: {swimmer.get('first_name', '')} {swimmer.get('last_name', '')}")
                                        else:
                                            stats['errors'] += 1
                                            print(f"✗ Failed to update: {uuid_value}")
                                    else:
                                        # Name already correct, count as skipped but not pending
                                        stats['skipped_not_pending'] += 1
                                else:
                                    stats['skipped_not_pending'] += 1
                            else:
                                stats['skipped_no_match'] += 1

                        except Exception as e:
                            stats['errors'] += 1
                            print(f"! Error processing {uuid_value}: {e}")

                        # Small delay to avoid rate limiting
                        time.sleep(0.05)

                # Progress reporting
                if stats['total_processed'] % 100 == 0:
                    print(f"Processed {stats['total_processed']} records...")
                    print(f"  Updates: {stats['updates_applied']}, Skipped: {stats['skipped_not_pending']}")

    except Exception as e:
        print(f"Fatal error reading CSV: {e}")
        return

    print(f"\n{'='*60}")
    print("UPDATE COMPLETE - FINAL STATISTICS")
    print(f"{'='*60}")
    print(f"Total CSV records processed: {stats['total_processed']}")
    print(f"Records with UUID: {stats['with_uuid']}")
    print(f"Records with Parent Name: {stats['with_parent_name']}")
    print(f"Updates applied: {stats['updates_applied']}")
    print(f"Skipped (not pending_enrollment or already correct): {stats['skipped_not_pending']}")
    print(f"Skipped (no matching swimmer): {stats['skipped_no_match']}")
    print(f"Errors: {stats['errors']}")
    print(f"\nUpdate rate: {stats['updates_applied'] / max(1, stats['total_processed']):.1%}")

    if stats['sample_updates']:
        print(f"\nSample of updated records (first {len(stats['sample_updates'])}):")
        for i, update in enumerate(stats['sample_updates']):
            print(f"  {i+1}. {update['swimmer']}")
            print(f"     From: '{update['old_name']}'")
            print(f"     To:   '{update['new_name']}'")

    # Final verification
    print(f"\n{'='*60}")
    print("FINAL VERIFICATION")
    print(f"{'='*60}")
    try:
        # Count pending_enrollment swimmers
        count_response = supabase.table('swimmers').select('id', count='exact').eq('enrollment_status', 'pending_enrollment').execute()
        print(f"Total pending_enrollment swimmers in database: {count_response.count}")

        # Get a few samples
        sample_response = supabase.table('swimmers').select('id, first_name, last_name, parent_name, enrollment_status').eq('enrollment_status', 'pending_enrollment').limit(5).execute()

        if sample_response.data:
            print("\nSample of pending_enrollment swimmers:")
            for swimmer in sample_response.data:
                print(f"  • {swimmer['first_name']} {swimmer['last_name']}: '{swimmer['parent_name']}'")
    except Exception as e:
        print(f"Error during verification: {e}")

    print(f"\n{'='*60}")
    print("NEXT STEPS")
    print(f"{'='*60}")
    print("1. Test parent invitations to ensure correct names appear")
    print("2. Verify that enrolled/waitlist families were not modified")
    print("3. Check the parent portal for any issues")

if __name__ == "__main__":
    main()