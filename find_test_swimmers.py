#!/usr/bin/env python3
"""Find swimmers with good data for testing the instructor prep view"""

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

try:
    # Find swimmers with good test data
    print(f"\n🔍 Finding swimmers with good test data...")

    # Get all swimmers with skills
    response = supabase.table('swimmers') \
        .select('id, first_name, last_name, current_level_id') \
        .execute()

    swimmers = response.data
    print(f"Found {len(swimmers)} total swimmers")

    # Check each swimmer for good test data
    good_test_candidates = []

    for swimmer in swimmers[:50]:  # Check first 50
        # Get swimmer skills
        skills_response = supabase.table('swimmer_skills') \
            .select('id, status, instructor_notes, date_started, date_mastered') \
            .eq('swimmer_id', swimmer['id']) \
            .execute()

        skills = skills_response.data
        if not skills:
            continue

        # Categorize skills
        in_progress = [s for s in skills if s['status'] == 'in_progress']
        mastered = [s for s in skills if s['status'] == 'mastered']
        not_started = [s for s in skills if s['status'] == 'not_started']
        skills_with_notes = [s for s in skills if s.get('instructor_notes')]

        # Score the swimmer for testing
        score = 0
        notes = []

        if swimmer['current_level_id']:
            score += 10
            notes.append("Has level assigned")

        if len(in_progress) > 0:
            score += 5
            notes.append(f"{len(in_progress)} in-progress skills")

        if len(skills_with_notes) > 0:
            score += 15
            notes.append(f"{len(skills_with_notes)} skills with notes")

        if len(mastered) > 0:
            score += 3
            notes.append(f"{len(mastered)} mastered skills")

        if len(not_started) > 0:
            score += 2
            notes.append(f"{len(not_started)} not-started skills")

        if score >= 10:  # Only include decent candidates
            good_test_candidates.append({
                'swimmer': swimmer,
                'score': score,
                'stats': {
                    'total_skills': len(skills),
                    'in_progress': len(in_progress),
                    'mastered': len(mastered),
                    'not_started': len(not_started),
                    'with_notes': len(skills_with_notes)
                },
                'notes': notes
            })

    # Sort by score
    good_test_candidates.sort(key=lambda x: x['score'], reverse=True)

    print(f"\n🏆 TOP TEST CANDIDATES:")
    for i, candidate in enumerate(good_test_candidates[:10], 1):
        swimmer = candidate['swimmer']
        stats = candidate['stats']
        print(f"\n{i}. {swimmer['first_name']} {swimmer['last_name']} (Score: {candidate['score']})")
        print(f"   ID: {swimmer['id']}")
        print(f"   Has level: {'✅ Yes' if swimmer['current_level_id'] else '❌ No'}")
        print(f"   Skills: {stats['total_skills']} total")
        print(f"     - In Progress: {stats['in_progress']}")
        print(f"     - Mastered: {stats['mastered']}")
        print(f"     - Not Started: {stats['not_started']}")
        print(f"     - With Notes: {stats['with_notes']}")
        print(f"   Notes: {', '.join(candidate['notes'])}")

    if good_test_candidates:
        print(f"\n🎯 RECOMMENDATION:")
        best = good_test_candidates[0]
        best_swimmer = best['swimmer']
        print(f"   Test with: {best_swimmer['first_name']} {best_swimmer['last_name']}")
        print(f"   Reason: Highest score ({best['score']}) with good mix of data")

        # Show what to expect in UI
        print(f"\n📱 EXPECTED IN UI:")
        if best_swimmer['current_level_id']:
            print(f"   1. ✅ Level Progress: Will show level name and progress bar")
        else:
            print(f"   1. ⚠️ Level Progress: Will show 'Assign a Level First'")

        if best['stats']['in_progress'] > 0:
            print(f"   2. ✅ Focus Today: Will show {best['stats']['in_progress']} skills")
            if best['stats']['with_notes'] > 0:
                print(f"      - Will show instructor notes on {best['stats']['with_notes']} skills")
            else:
                print(f"      - ⚠️ No instructor notes to display")
        else:
            print(f"   2. ⚠️ Focus Today: Will show 'No skills in progress'")

        if best['stats']['mastered'] > 0:
            print(f"   3. ✅ Mastered Skills: Will show {best['stats']['mastered']} skills")
        else:
            print(f"   3. ⚠️ Mastered Skills: Section won't appear")

        if best['stats']['not_started'] > 0:
            print(f"   4. ✅ Not Started: Will show {best['stats']['not_started']} skills")
        else:
            print(f"   4. ⚠️ Not Started: Section won't appear")
    else:
        print(f"\n❌ No good test candidates found. Need to add test data.")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()