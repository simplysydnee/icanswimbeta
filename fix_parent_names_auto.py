#!/usr/bin/env python3
"""
Fix parent names from Airtable CSV with enrollment_status filter.
Auto-run version without interactive prompts.
"""

import csv
import sys
import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv
import time

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
        print("Make sure .env.local file exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY")
        sys.exit(1)

    return create_client(supabase_url, supabase_key)

def process_csv_and_update(csv_path, dry_run=False):
    """
    Process CSV file and update parent names in Supabase.

    Args:
        csv_path: Path to the CSV file
        dry_run: If True, only show what would be updated without making changes
    """

    print(f"Processing CSV file: {csv_path}")
    print(f"Filter: Only updating swimmers with enrollment_status = 'pending_enrollment'")
    if dry_run:
        print("DRY RUN MODE: No changes will be made to the database")
    print()

    # Initialize Supabase client
    supabase = get_supabase_client()

    # Track statistics
    total_records = 0
    records_with_uuid = 0
    records_with_parent_name = 0
    updates_attempted = 0
    updates_successful = 0
    updates_skipped_not_pending = 0
    updates_skipped_no_match = 0
    errors = 0

    # Read CSV and process updates
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

            # Process each row
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

                        # Check if swimmer exists and has pending_enrollment status
                        try:
                            # First, check the swimmer's enrollment status
                            response = supabase.table('swimmers').select('id, enrollment_status, parent_name').eq('id', uuid_value).execute()

                            if response.data and len(response.data) > 0:
                                swimmer = response.data[0]

                                if swimmer.get('enrollment_status') == 'pending_enrollment':
                                    updates_attempted += 1

                                    if dry_run:
                                        print(f"[DRY RUN] Would update: {uuid_value} -> '{parent_name}' (current: '{swimmer.get('parent_name')}')")
                                        updates_successful += 1  # Count as successful for dry run
                                    else:
                                        # Update the parent name
                                        update_response = supabase.table('swimmers').update({
                                            'parent_name': parent_name
                                        }).eq('id', uuid_value).execute()

                                        if update_response.data:
                                            updates_successful += 1
                                            print(f"✓ Updated: {uuid_value} -> '{parent_name}'")
                                        else:
                                            errors += 1
                                            print(f"✗ Error updating: {uuid_value}")
                                else:
                                    updates_skipped_not_pending += 1
                                    if dry_run:
                                        print(f"[DRY RUN] Would skip (not pending_enrollment): {uuid_value} - status: {swimmer.get('enrollment_status')}")
                            else:
                                updates_skipped_no_match += 1
                                if dry_run:
                                    print(f"[DRY RUN] Would skip (no matching swimmer): {uuid_value}")

                        except Exception as e:
                            errors += 1
                            print(f"✗ Error processing {uuid_value}: {e}")

                        # Small delay to avoid rate limiting
                        if not dry_run:
                            time.sleep(0.1)

                # Progress indicator
                if total_records % 10 == 0:
                    print(f"Processed {total_records} records...")

    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)

    print(f"\n{'='*50}")
    if dry_run:
        print("DRY RUN COMPLETE - STATISTICS")
    else:
        print("UPDATE COMPLETE - STATISTICS")
    print(f"{'='*50}")
    print(f"Total records in CSV: {total_records}")
    print(f"Records with UUID: {records_with_uuid}")
    print(f"Records with Parent Name: {records_with_parent_name}")
    print(f"Updates attempted: {updates_attempted}")
    print(f"Updates successful: {updates_successful}")
    print(f"Skipped (not pending_enrollment): {updates_skipped_not_pending}")
    print(f"Skipped (no matching swimmer): {updates_skipped_no_match}")
    print(f"Errors: {errors}")
    print(f"{'='*50}")

    if not dry_run:
        # Verify updates by checking a sample
        print("\nVerifying updates (sample of 5 records)...")
        try:
            # Get a sample of updated records
            sample_query = supabase.table('swimmers').select('id, first_name, last_name, parent_name, enrollment_status').eq('enrollment_status', 'pending_enrollment').limit(5).execute()

            if sample_query.data:
                print("\nSample of pending_enrollment swimmers after update:")
                for swimmer in sample_query.data:
                    print(f"  {swimmer['first_name']} {swimmer['last_name']}: '{swimmer['parent_name']}'")
            else:
                print("No pending_enrollment swimmers found for verification.")

        except Exception as e:
            print(f"Error during verification: {e}")

def main():
    # Configuration
    csv_path = "/Users/sydnee/Desktop/Clients-All data all fields  (3).csv"
    dry_run = False  # Set to True for testing without making changes

    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        print("Please ensure the CSV file exists at the specified path.")
        sys.exit(1)

    print("PARENT NAME UPDATE SCRIPT")
    print("=" * 50)
    print(f"CSV file: {csv_path}")
    print(f"Filter: Only swimmers with enrollment_status = 'pending_enrollment'")
    if dry_run:
        print("MODE: DRY RUN (no changes will be made)")
    else:
        print("MODE: LIVE UPDATE (changes will be made to database)")
    print()

    # Process CSV and update
    process_csv_and_update(csv_path, dry_run=dry_run)

    print("\n" + "="*50)
    if dry_run:
        print("DRY RUN COMPLETE")
    else:
        print("UPDATE COMPLETE")
    print("="*50)
    print("\nNext steps:")
    print("1. Test parent invitations to ensure correct names appear")
    print("2. Verify that enrolled families were not modified")
    print("3. Check the parent portal for any issues")

if __name__ == "__main__":
    main()