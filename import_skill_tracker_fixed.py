#!/usr/bin/env python3
"""
Fixed Skill Tracker Data Import Script
Handles duplicate records and ambiguous column errors
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
        print("WARNING: .env.local not found")
    return env_vars

env = load_env()
SUPABASE_URL = env.get('NEXT_PUBLIC_SUPABASE_URL', 'https://jtqlamkrhdfwtmaubfrc.supabase.co')
SUPABASE_KEY = env.get('SUPABASE_SECRET_KEY')  # Use service role key

if not SUPABASE_KEY:
    print("ERROR: SUPABASE_SECRET_KEY not found in .env.local")
    print("Make sure .env.local has SUPABASE_SECRET_KEY from Supabase Dashboard > Settings > API")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# File paths
BASE_PATH = "."  # Current directory
UUID_MAPPING_FILE = f"{BASE_PATH}/swimmer_uuid_mapping.csv"
SKILLS_FILE = f"{BASE_PATH}/swimmer_skills.csv"
TARGETS_FILE = f"{BASE_PATH}/swimmer_targets.csv"
STRATEGIES_FILE = f"{BASE_PATH}/swimmer_strategies.csv"

# Check if files exist
missing_files = []
for file_path, desc in [
    (UUID_MAPPING_FILE, "swimmer_uuid_mapping.csv"),
    (SKILLS_FILE, "swimmer_skills.csv"),
    (TARGETS_FILE, "swimmer_targets.csv"),
    (STRATEGIES_FILE, "swimmer_strategies.csv")
]:
    if not os.path.exists(file_path):
        missing_files.append(desc)

if missing_files:
    print("ERROR: Missing CSV files:")
    for f in missing_files:
        print(f"  - {f}")
    exit(1)


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


def remove_duplicates(records, key_fields):
    """Remove duplicate records based on key fields"""
    seen = set()
    unique_records = []
    for record in records:
        # Create a tuple of the key fields
        key = tuple(record.get(field) for field in key_fields)
        if key not in seen:
            seen.add(key)
            unique_records.append(record)
    return unique_records


def import_swimmer_skills(uuid_mapping):
    """Import swimmer_skills records"""
    print("\n--- Importing Swimmer Skills ---")

    # First get all existing skill IDs from database
    skills_response = supabase.table('skills').select('id, name').execute()
    skill_name_to_id = {s['name']: s['id'] for s in skills_response.data}
    print(f"Found {len(skill_name_to_id)} skills in database")

    records = []
    skipped = 0
    no_uuid = 0
    no_skill_id = 0

    with open(SKILLS_FILE, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            swimmer_name = row['swimmer_name']
            swimmer_id = uuid_mapping.get(swimmer_name)

            if not swimmer_id:
                no_uuid += 1
                continue

            # Get skill_id - first try from CSV, then lookup by name
            skill_id = row.get('skill_id', '').strip()
            if not skill_id:
                skill_name = row.get('skill_name', '').strip()
                skill_id = skill_name_to_id.get(skill_name)

            if not skill_id:
                no_skill_id += 1
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

    # Remove duplicates
    records = remove_duplicates(records, ['swimmer_id', 'skill_id'])
    print(f"Prepared {len(records)} skill records (after removing duplicates)")
    print(f"Skipped: {no_uuid} (no UUID), {no_skill_id} (no skill_id)")

    # Insert in smaller batches to avoid duplicate errors
    batch_size = 100
    inserted = 0
    errors = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            # Use upsert to handle duplicates
            response = supabase.table('swimmer_skills').upsert(
                batch,
                on_conflict='swimmer_id,skill_id'
            ).execute()
            inserted += len(batch)
            print(f"  Inserted batch {i//batch_size + 1}: {len(batch)} records")
        except Exception as e:
            # Try inserting one by one if batch fails
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
                    # print(f"    Individual insert failed: {str(e2)[:100]}")

    print(f"✅ Swimmer Skills: {inserted} inserted, {errors} errors")
    return inserted


def import_swimmer_targets(uuid_mapping):
    """Import swimmer_targets records"""
    print("\n--- Importing Swimmer Targets ---")

    records = []
    no_uuid = 0

    with open(TARGETS_FILE, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            swimmer_name = row['swimmer_name']
            swimmer_id = uuid_mapping.get(swimmer_name)

            if not swimmer_id:
                no_uuid += 1
                continue

            record = {
                'swimmer_id': swimmer_id,
                'target_name': row.get('target_name', '').strip(),
                'status': row.get('status', 'not_started'),
                'date_started': parse_date(row.get('date_started')),
                'date_met': parse_date(row.get('date_met')),
                'notes': row.get('notes', '').strip() or None
            }

            if record['target_name']:
                records.append(record)

    # Remove duplicates
    records = remove_duplicates(records, ['swimmer_id', 'target_name'])
    print(f"Prepared {len(records)} target records (after removing duplicates)")
    print(f"Skipped: {no_uuid} (no UUID)")

    # Insert in smaller batches
    batch_size = 100
    inserted = 0
    errors = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            response = supabase.table('swimmer_targets').upsert(
                batch,
                on_conflict='swimmer_id,target_name'
            ).execute()
            inserted += len(batch)
            print(f"  Inserted batch {i//batch_size + 1}: {len(batch)} records")
        except Exception as e:
            # Try inserting one by one if batch fails
            print(f"  Batch {i//batch_size + 1} failed, trying individual inserts...")
            for record in batch:
                try:
                    response = supabase.table('swimmer_targets').upsert(
                        record,
                        on_conflict='swimmer_id,target_name'
                    ).execute()
                    inserted += 1
                except Exception as e2:
                    errors += 1
                    # print(f"    Individual insert failed: {str(e2)[:100]}")

    print(f"✅ Swimmer Targets: {inserted} inserted, {errors} errors")
    return inserted


def import_swimmer_strategies(uuid_mapping):
    """Import swimmer_strategies records"""
    print("\n--- Importing Swimmer Strategies ---")

    records = []
    no_uuid = 0

    with open(STRATEGIES_FILE, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            swimmer_name = row['swimmer_name']
            swimmer_id = uuid_mapping.get(swimmer_name)

            if not swimmer_id:
                no_uuid += 1
                continue

            # Parse is_used - could be True/False string or date
            is_used_raw = row.get('is_used', 'False')
            is_used = is_used_raw.lower() == 'true' if isinstance(is_used_raw, str) else bool(is_used_raw)

            record = {
                'swimmer_id': swimmer_id,
                'strategy_name': row.get('strategy_name', '').strip(),
                'is_used': is_used,
                'notes': row.get('notes', '').strip() or None
            }

            if record['strategy_name']:
                records.append(record)

    # Remove duplicates
    records = remove_duplicates(records, ['swimmer_id', 'strategy_name'])
    print(f"Prepared {len(records)} strategy records (after removing duplicates)")
    print(f"Skipped: {no_uuid} (no UUID)")

    # Insert in smaller batches
    batch_size = 100
    inserted = 0
    errors = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            response = supabase.table('swimmer_strategies').upsert(
                batch,
                on_conflict='swimmer_id,strategy_name'
            ).execute()
            inserted += len(batch)
            print(f"  Inserted batch {i//batch_size + 1}: {len(batch)} records")
        except Exception as e:
            # Try inserting one by one if batch fails
            print(f"  Batch {i//batch_size + 1} failed, trying individual inserts...")
            for record in batch:
                try:
                    response = supabase.table('swimmer_strategies').upsert(
                        record,
                        on_conflict='swimmer_id,strategy_name'
                    ).execute()
                    inserted += 1
                except Exception as e2:
                    errors += 1
                    # print(f"    Individual insert failed: {str(e2)[:100]}")

    print(f"✅ Swimmer Strategies: {inserted} inserted, {errors} errors")
    return inserted


def verify_import():
    """Verify the import was successful"""
    print("\n--- Verification ---")

    skills_count = supabase.table('swimmer_skills').select('id', count='exact').execute()
    targets_count = supabase.table('swimmer_targets').select('id', count='exact').execute()
    strategies_count = supabase.table('swimmer_strategies').select('id', count='exact').execute()

    print(f"swimmer_skills: {skills_count.count} records")
    print(f"swimmer_targets: {targets_count.count} records")
    print(f"swimmer_strategies: {strategies_count.count} records")

    # Sample data check
    print("\nSample swimmer_skills record:")
    sample = supabase.table('swimmer_skills').select('*').limit(1).execute()
    if sample.data:
        print(f"  Swimmer: {sample.data[0]['swimmer_id']}, Skill: {sample.data[0]['skill_id']}, Status: {sample.data[0]['status']}")


def main():
    print("=" * 60)
    print("SKILL TRACKER DATA IMPORT (Fixed)")
    print("=" * 60)

    # Load UUID mapping
    uuid_mapping = load_uuid_mapping()

    # Import each table
    skills_count = import_swimmer_skills(uuid_mapping)
    targets_count = import_swimmer_targets(uuid_mapping)
    strategies_count = import_swimmer_strategies(uuid_mapping)

    # Verify
    verify_import()

    print("\n" + "=" * 60)
    print("IMPORT COMPLETE")
    print(f"Total records imported: {skills_count + targets_count + strategies_count}")
    print("=" * 60)


if __name__ == "__main__":
    main()