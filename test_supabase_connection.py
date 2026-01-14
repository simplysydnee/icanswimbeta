#!/usr/bin/env python3
"""Test Supabase connection and check current data"""

import os
from supabase import create_client, Client

# Load environment from .env.local
def load_env():
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
SUPABASE_URL = env.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = env.get('SUPABASE_SECRET_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing Supabase credentials in .env.local")
    exit(1)

print(f"Connecting to Supabase at: {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test connection by checking skills count
try:
    response = supabase.table('skills').select('id', count='exact').execute()
    print(f"✅ Connection successful! Found {response.count} skills in database")

    # Check current data in new tables
    skills_count = supabase.table('swimmer_skills').select('id', count='exact').execute()
    targets_count = supabase.table('swimmer_targets').select('id', count='exact').execute()
    strategies_count = supabase.table('swimmer_strategies').select('id', count='exact').execute()

    print(f"\nCurrent data counts:")
    print(f"  swimmer_skills: {skills_count.count} records")
    print(f"  swimmer_targets: {targets_count.count} records")
    print(f"  swimmer_strategies: {strategies_count.count} records")

    # Check UUID mapping file
    import csv
    try:
        with open('swimmer_uuid_mapping.csv', 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            print(f"\nUUID mapping file: {len(rows)} rows")
            if rows:
                print(f"  Sample: {rows[0]['parsed_name']} -> {rows[0]['supabase_id']}")
    except FileNotFoundError:
        print("\n❌ swimmer_uuid_mapping.csv not found in current directory")
        print("   Copy it from: /Users/sydnee/Documents/swimmer_uuid_mapping.csv")

except Exception as e:
    print(f"❌ Connection failed: {e}")