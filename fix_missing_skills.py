#!/usr/bin/env python3
"""
Fix Missing Skills Import
Re-imports the 737 skill records that were skipped due to missing skill_id mappings
"""

import os
import csv
from datetime import datetime
from supabase import create_client, Client
import sys

# Supabase connection - get from .env.local
def load_env():
    """Load environment variables from .env.local"""
    env_vars = {}
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    except FileNotFoundError:
        print("ERROR: .env.local not found")
        exit(1)
    return env_vars

env = load_env()
SUPABASE_URL = env.get('NEXT_PUBLIC_SUPABASE_URL', 'https://jtqlamkrhdfwtmaubfrc.supabase.co')
SUPABASE_KEY = env.get('SUPABASE_SECRET_KEY')

if not SUPABASE_KEY:
    print("ERROR: SUPABASE_SECRET_KEY not found in .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# File paths
UUID_MAPPING_FILE = "swimmer_uuid_mapping.csv"
SKILLS_FILE = "swimmer_skills.csv"

def load_uuid_mapping():
    """Load swimmer name -> UUID mapping"""
    mapping = {}
    with open(UUID_MAPPING_FILE, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            mapping[row['parsed_name']] = row['supabase_id']
    print(f"Loaded {len(mapping)} swimmer UUID mappings")
    return mapping

def parse_date(date_str):
    """Parse date string to ISO format or None"""
    if not date_str or date_str.strip() == '':
        return None
    try:
        # Try various formats
        for fmt in ['%Y-%m-%d', '%Y-%m-%d %H:%M:%S', '%m/%d/%Y', '%d/%m/%Y']:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.isoformat()
            except ValueError:
                continue
        return None
    except Exception:
        return None

def create_skill_mapping():
    """Create mapping from CSV skill names to database skill IDs with variations"""

    # Get all skills from database
    skills_response = supabase.table('skills').select('id, name').execute()
    skills = skills_response.data

    # Create multiple mappings for variations
    skill_mapping = {}

    for skill in skills:
        db_name = skill['name']
        skill_id = skill['id']

        # Add exact match
        skill_mapping[db_name] = skill_id

        # Add lowercase version for case-insensitive matching
        skill_mapping[db_name.lower()] = skill_id

        # Add variations for common typos/formatting issues
        if db_name == "Jump or roll in, roll to back and breath":
            skill_mapping["JUmp or roll in, roll to back and breath"] = skill_id
            skill_mapping["jump or roll in, roll to back and breath"] = skill_id

        elif db_name == "Treading water 10 seconds":
            skill_mapping["Tread water for 10 seconds"] = skill_id
            skill_mapping["tread water for 10 seconds"] = skill_id

        elif db_name == "Swim-roll-swim":
            skill_mapping["swim-roll-swim"] = skill_id
            skill_mapping["Swim-roll-swim"] = skill_id

        # Add the 5 new skills we just added
        elif db_name == "Asking permission to get in the water":
            skill_mapping["Asking Permission to get in the water"] = skill_id
            skill_mapping["asking permission to get in the water"] = skill_id

        elif db_name == "Wearing lifejacket and jump in and kick on back 10 feet":
            skill_mapping["wearing lifejacket and jump in and kick on back 10 feet"] = skill_id

        elif db_name == "Roll to the back from the front":
            skill_mapping["roll to the back from the front"] = skill_id

        elif db_name == "Disorientating entries and recover":
            skill_mapping["disorientating entries and recover"] = skill_id

        elif db_name == "Reach and throw with assist flotation":
            skill_mapping["reach and throw with assist flotation"] = skill_id

    print(f"Created skill mapping with {len(skill_mapping)} entries")
    return skill_mapping

def import_missing_skills(uuid_mapping, skill_mapping):
    """Import only the records that were previously skipped"""
    print("\n--- Importing Missing Skills ---")

    # First, get all existing swimmer_skills to avoid duplicates
    existing_response = supabase.table('swimmer_skills').select('swimmer_id, skill_id').execute()
    existing_skills = set()
    for record in existing_response.data:
        existing_skills.add((record['swimmer_id'], record['skill_id']))
    print(f"Found {len(existing_skills)} existing swimmer_skill records")

    records = []
    skipped_no_uuid = 0
    skipped_no_skill = 0
    skipped_duplicate = 0
    mapped_variations = {}

    with open(SKILLS_FILE, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            swimmer_name = row['swimmer_name']
            swimmer_id = uuid_mapping.get(swimmer_name)

            if not swimmer_id:
                skipped_no_uuid += 1
                continue

            # Get skill_id - first try from CSV
            skill_id = row.get('skill_id', '').strip()

            # If no skill_id, try to map from skill_name
            if not skill_id:
                skill_name = row.get('skill_name', '').strip()
                if skill_name:
                    # Try exact match first
                    skill_id = skill_mapping.get(skill_name)

                    # Try lowercase match
                    if not skill_id:
                        skill_id = skill_mapping.get(skill_name.lower())

                    # Track which variations we mapped
                    if skill_id and skill_name not in skill_mapping:
                        mapped_variations[skill_name] = skill_mapping.get(skill_name.lower(), 'unknown')

            if not skill_id:
                skipped_no_skill += 1
                continue

            # Check if this record already exists
            if (swimmer_id, skill_id) in existing_skills:
                skipped_duplicate += 1
                continue

            record = {
                'swimmer_id': swimmer_id,
                'skill_id': skill_id,
                'status': row.get('status', 'not_started'),
                'date_started': parse_date(row.get('date_started')),
                'date_met': parse_date(row.get('date_met')),
                'instructor_notes': row.get('notes', '').strip() or None,
                'is_safety_skill': row.get('is_safety_skill', 'False').lower() == 'true'
            }
            records.append(record)

    print(f"\nAnalysis:")
    print(f"  Prepared {len(records)} missing skill records to import")
    print(f"  Skipped: {skipped_no_uuid} (no UUID), {skipped_no_skill} (no skill mapping), {skipped_duplicate} (duplicates)")

    if mapped_variations:
        print(f"\nSkill name variations mapped:")
        for csv_name, db_id in mapped_variations.items():
            # Get the database skill name for this ID
            skill_name = "unknown"
            for skill in supabase.table('skills').select('id, name').execute().data:
                if skill['id'] == db_id:
                    skill_name = skill['name']
                    break
            print(f"  '{csv_name}' → '{skill_name}'")

    # Insert in batches
    if records:
        batch_size = 100
        inserted = 0
        errors = 0

        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            try:
                response = supabase.table('swimmer_skills').upsert(
                    batch,
                    on_conflict='swimmer_id,skill_id'
                ).execute()
                inserted += len(batch)
                print(f"  Inserted batch {i//batch_size + 1}: {len(batch)} records")
            except Exception as e:
                # Try individual inserts
                print(f"  Batch {i//batch_size + 1} failed, trying individual inserts...")
                for record in batch:
                    try:
                        response = supabase.table('swimmer_skills').upsert(
                            record,
                            on_conflict='swimmer_id,skill_id'
                        ).execute()
                        inserted += 1
                    except Exception as e2:
                        errors += 1

        print(f"\n✅ Missing Skills: {inserted} inserted, {errors} errors")
        return inserted
    else:
        print("No missing skills to import")
        return 0

def verify_fix():
    """Verify the fix was successful"""
    print("\n--- Verification ---")

    # Check total skills count
    skills_count = supabase.table('skills').select('id', count='exact').execute()
    print(f"Total skills in database: {skills_count.count} (should be 28)")

    # Check swimmer_skills count
    swimmer_skills_count = supabase.table('swimmer_skills').select('id', count='exact').execute()
    print(f"Total swimmer_skills records: {swimmer_skills_count.count}")

    # Check the new skills have data
    print("\nNew skills data count:")
    new_skills_query = """
    SELECT s.name as skill_name, COUNT(*) as swimmer_count
    FROM swimmer_skills sk
    JOIN skills s ON sk.skill_id = s.id
    WHERE s.name IN (
      'Asking permission to get in the water',
      'Wearing lifejacket and jump in and kick on back 10 feet',
      'Roll to the back from the front',
      'Disorientating entries and recover',
      'Reach and throw with assist flotation'
    )
    GROUP BY s.name
    ORDER BY swimmer_count DESC;
    """

    # Execute the query
    from supabase import Client
    result = supabase.rpc('execute_sql', {'query': new_skills_query}).execute()

    if hasattr(result, 'data'):
        for row in result.data:
            print(f"  {row['skill_name']}: {row['swimmer_count']} swimmers")
    else:
        # Fallback to individual queries
        new_skill_names = [
            'Asking permission to get in the water',
            'Wearing lifejacket and jump in and kick on back 10 feet',
            'Roll to the back from the front',
            'Disorientating entries and recover',
            'Reach and throw with assist flotation'
        ]

        for skill_name in new_skill_names:
            # Get skill ID first
            skill_resp = supabase.table('skills').select('id').eq('name', skill_name).execute()
            if skill_resp.data:
                skill_id = skill_resp.data[0]['id']
                count_resp = supabase.table('swimmer_skills').select('id', count='exact').eq('skill_id', skill_id).execute()
                print(f"  {skill_name}: {count_resp.count} swimmers")

def main():
    print("=" * 60)
    print("FIX MISSING SKILLS IMPORT")
    print("=" * 60)

    # Load UUID mapping
    uuid_mapping = load_uuid_mapping()

    # Create skill mapping with variations
    skill_mapping = create_skill_mapping()

    # Import missing skills
    imported_count = import_missing_skills(uuid_mapping, skill_mapping)

    # Verify
    verify_fix()

    print("\n" + "=" * 60)
    print(f"FIX COMPLETE: {imported_count} missing skill records imported")
    print("=" * 60)

if __name__ == "__main__":
    main()