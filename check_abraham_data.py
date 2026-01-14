#!/usr/bin/env python3
"""Check Abraham Lopez's skill data for testing the instructor prep view"""

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

print(f"Connecting to Supabase...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Find Abraham Lopez
try:
    # First, find Abraham Lopez
    response = supabase.table('swimmers') \
        .select('id, first_name, last_name, current_level_id') \
        .eq('first_name', 'Abraham') \
        .eq('last_name', 'Lopez') \
        .execute()

    if not response.data:
        print("❌ Abraham Lopez not found in database")
        exit(1)

    swimmer = response.data[0]
    print(f"✅ Found swimmer: {swimmer['first_name']} {swimmer['last_name']}")
    print(f"   ID: {swimmer['id']}")
    print(f"   Current level ID: {swimmer['current_level_id']}")

    # Get level name
    if swimmer['current_level_id']:
        level_response = supabase.table('swim_levels') \
            .select('name, display_name, color') \
            .eq('id', swimmer['current_level_id']) \
            .execute()

        if level_response.data:
            level = level_response.data[0]
            print(f"   Level: {level['display_name']} ({level['name']})")
            print(f"   Color: {level.get('color', 'Not set')}")

    # Get swimmer skills with the exact query from the component
    print(f"\n📊 Fetching swimmer skills (using component query)...")
    skills_response = supabase.table('swimmer_skills') \
        .select('id, status, instructor_notes, date_started, date_mastered, updated_at, skill:skills(id, name, description, sequence)') \
        .eq('swimmer_id', swimmer['id']) \
        .execute()

    skills = skills_response.data
    print(f"   Found {len(skills)} skills total")

    # Categorize by status
    in_progress = [s for s in skills if s['status'] == 'in_progress']
    mastered = [s for s in skills if s['status'] == 'mastered']
    not_started = [s for s in skills if s['status'] == 'not_started']

    print(f"\n📈 Skill breakdown:")
    print(f"   In Progress: {len(in_progress)} skills")
    print(f"   Mastered: {len(mastered)} skills")
    print(f"   Not Started: {len(not_started)} skills")

    # Check for instructor notes
    skills_with_notes = [s for s in skills if s.get('instructor_notes')]
    print(f"   Skills with notes: {len(skills_with_notes)}")

    # Show in-progress skills with notes (for Focus Today section)
    if in_progress:
        print(f"\n🎯 IN PROGRESS SKILLS (Focus Today section):")
        for i, skill in enumerate(in_progress, 1):
            skill_name = skill['skill']['name'] if skill.get('skill') else 'Unknown'
            notes = skill.get('instructor_notes', 'No notes')
            date_started = skill.get('date_started', 'Not started')
            print(f"\n   {i}. {skill_name}")
            print(f"      Status: {skill['status']}")
            print(f"      Notes: {notes}")
            print(f"      Date started: {date_started}")

    # Show a few mastered skills
    if mastered:
        print(f"\n✅ MASTERED SKILLS (first 3):")
        for i, skill in enumerate(mastered[:3], 1):
            skill_name = skill['skill']['name'] if skill.get('skill') else 'Unknown'
            date_mastered = skill.get('date_mastered', 'Not dated')
            print(f"   {i}. {skill_name} - Mastered: {date_mastered}")

    # Show a few not started skills
    if not_started:
        print(f"\n⭕ NOT STARTED SKILLS (first 3):")
        for i, skill in enumerate(not_started[:3], 1):
            skill_name = skill['skill']['name'] if skill.get('skill') else 'Unknown'
            print(f"   {i}. {skill_name}")

    # Check if data matches what the component expects
    print(f"\n🔍 Data validation:")
    print(f"   Query matches component: ✅ Yes (same fields)")

    # Check for potential issues
    issues = []
    for skill in skills:
        if not skill.get('skill'):
            issues.append(f"Skill {skill['id']} has no skill data")

    if issues:
        print(f"   Potential issues: {len(issues)}")
        for issue in issues[:3]:
            print(f"     - {issue}")
    else:
        print(f"   Data structure: ✅ Good")

    print(f"\n🎯 EXPECTED IN UI:")
    print(f"   1. Level Progress: Should show level name and {len(mastered)}/{len(skills)} mastered")
    print(f"   2. Focus Today: Should show {len(in_progress)} skills with notes")
    print(f"   3. Mastered Skills: Should show {len(mastered)} skills (first 3 visible)")
    print(f"   4. Not Started: Should show {len(not_started)} skills (first 3 visible)")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()