#!/usr/bin/env python3
"""
Find and fix pending_enrollment swimmers with 'None' parent names.
Try to find parent names from email or other sources.
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

def extract_name_from_email(email):
    """Try to extract a name from email address."""
    if not email:
        return None

    # Common patterns
    # first.last@domain.com -> First Last
    # firstlast@domain.com -> Firstlast (harder to parse)
    # f.last@domain.com -> F Last

    # Get the part before @
    local_part = email.split('@')[0].lower()

    # Try to split by common separators
    for sep in ['.', '_', '-']:
        if sep in local_part:
            parts = local_part.split(sep)
            # Take first part as first name, last part as last name
            if len(parts) >= 2:
                first = parts[0].capitalize()
                last = parts[-1].capitalize()
                return f"{first} {last}"

    # If no separator, try to capitalize
    if local_part and len(local_part) > 1:
        return local_part.capitalize()

    return None

def main():
    csv_path = "/Users/sydnee/Desktop/Clients-All data all fields  (3).csv"

    print("FIXING 'None' PARENT NAMES")
    print("=" * 60)
    print("Finding pending_enrollment swimmers with None/null parent names")
    print("and attempting to fix them using available data.")
    print()

    # Initialize Supabase
    supabase = create_client(
        os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        os.getenv('SUPABASE_SECRET_KEY')
    )

    # Step 1: Find swimmers with None parent names
    print("1. Finding swimmers with None parent names...")

    try:
        # Get all pending_enrollment swimmers
        response = supabase.table('swimmers').select(
            'id, first_name, last_name, parent_name, parent_email, enrollment_status, created_at'
        ).eq('enrollment_status', 'pending_enrollment').execute()

        none_parents = []
        for swimmer in response.data:
            parent_name = swimmer.get('parent_name')
            if parent_name in [None, 'None', 'none', '']:
                none_parents.append(swimmer)

        print(f"   Found {len(none_parents)} pending_enrollment swimmers with None/null parent names")
        print(f"   (Out of {len(response.data)} total pending_enrollment swimmers)")

        if not none_parents:
            print("\n   No swimmers with None parent names found. Database is clean!")
            return

        # Step 2: Load CSV data for cross-reference
        print("\n2. Loading CSV data for reference...")
        csv_parent_names = {}  # uuid -> parent_name from CSV

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

                if parent_name_idx != -1:
                    for row in reader:
                        if not row:
                            continue

                        # Find UUID
                        uuid_value = None
                        for cell in row:
                            if re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', cell.strip(), re.I):
                                uuid_value = cell.strip()
                                break

                        if uuid_value and len(row) > parent_name_idx:
                            parent_name = row[parent_name_idx].strip()
                            if parent_name:
                                if parent_name.startswith('"') and parent_name.endswith('"'):
                                    parent_name = parent_name[1:-1]
                                csv_parent_names[uuid_value] = parent_name

                    print(f"   Loaded {len(csv_parent_names)} parent names from CSV")
                else:
                    print("   Warning: Could not find Parent Name column in CSV")
        except Exception as e:
            print(f"   Warning: Could not read CSV: {e}")

        # Step 3: Analyze and fix
        print("\n3. Analyzing swimmers...")
        print("-" * 60)

        fixes_applied = 0
        fixes_failed = 0
        no_data = 0

        for i, swimmer in enumerate(none_parents[:50]):  # Process first 50
            swimmer_id = swimmer['id']
            swimmer_name = f"{swimmer['first_name']} {swimmer['last_name']}"
            parent_email = swimmer.get('parent_email')

            print(f"\n   {i+1}. {swimmer_name}")
            print(f"      ID: {swimmer_id[:8]}...")
            print(f"      Email: {parent_email or 'No email'}")

            # Try to find parent name
            suggested_name = None
            source = ""

            # Option 1: Check CSV
            if swimmer_id in csv_parent_names:
                suggested_name = csv_parent_names[swimmer_id]
                source = "CSV"

            # Option 2: Extract from email
            elif parent_email:
                suggested_name = extract_name_from_email(parent_email)
                if suggested_name:
                    source = "Email extraction"

            # Option 3: Use swimmer's last name
            elif swimmer.get('last_name'):
                suggested_name = f"Parent {swimmer['last_name']}"
                source = "Last name fallback"

            if suggested_name:
                print(f"      Suggested name: '{suggested_name}' (from {source})")

                # Ask for confirmation (in real use, would have user input)
                # For now, apply fixes for names from CSV, ask for others
                if source == "CSV":
                    # Apply fix automatically for CSV names
                    try:
                        update_response = supabase.table('swimmers').update({
                            'parent_name': suggested_name
                        }).eq('id', swimmer_id).execute()

                        if update_response.data:
                            print(f"      ✅ FIXED: Updated to '{suggested_name}'")
                            fixes_applied += 1
                        else:
                            print(f"      ❌ FAILED: Could not update")
                            fixes_failed += 1
                    except Exception as e:
                        print(f"      ❌ ERROR: {e}")
                        fixes_failed += 1
                else:
                    print(f"      ⚠️  REVIEW NEEDED: Suggested '{suggested_name}' from {source}")
                    no_data += 1
            else:
                print(f"      ❓ NO DATA: Cannot determine parent name")
                no_data += 1

        # Summary
        print(f"\n{'='*60}")
        print("SUMMARY")
        print(f"{'='*60}")
        print(f"Swimmers analyzed: {min(50, len(none_parents))}")
        print(f"Fixes applied: {fixes_applied}")
        print(f"Fixes failed: {fixes_failed}")
        print(f"Need review/no data: {no_data}")

        if len(none_parents) > 50:
            print(f"\n⚠️  NOTE: There are {len(none_parents)} total swimmers with None parent names.")
            print(f"   Only processed first 50. Run again to process more.")

        print(f"\n{'='*60}")
        print("RECOMMENDATIONS")
        print(f"{'='*60}")

        if fixes_applied > 0:
            print(f"✅ {fixes_applied} parent names fixed from CSV data")

        if no_data > 0:
            print(f"⚠️  {no_data} swimmers need manual review:")
            print(f"   - Check Airtable for missing parent names")
            print(f"   - Contact families for correct parent names")
            print(f"   - Update database manually")

        print(f"\nNext: Test parent invitations with fixed names")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()