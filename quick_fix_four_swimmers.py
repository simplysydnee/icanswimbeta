#!/usr/bin/env python3
"""
Quick fix for the 4 swimmers with 'None' parent names.
Apply reasonable parent names based on available data.
"""

from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env.local')
load_dotenv(env_path)

def main():
    print("QUICK FIX FOR 4 SWIMMERS WITH 'None' PARENT NAMES")
    print("=" * 60)

    # Initialize Supabase
    supabase = create_client(
        os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        os.getenv('SUPABASE_SECRET_KEY')
    )

    # Define fixes based on our analysis
    fixes = [
        {
            'id': '25b427c2-81c0-424d-811a-d14716fbaffa',  # Liam Johnson
            'parent_name': 'Parent/Guardian Johnson',
            'reason': 'Last name fallback - needs verification'
        },
        {
            'id': 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  # Taylen Merchant
            'parent_name': 'Sydnee Merchant',
            'reason': 'Email suggests parent is Sydnee'
        },
        {
            'id': '9e29fc20-51eb-4bb0-b51a-9bcc4f07c890',  # Noah Williams
            'parent_name': 'Parent/Guardian Williams',
            'reason': 'Last name fallback - needs verification'
        },
        {
            'id': '5b021ef7-8a6f-4918-98e1-5f74e8c9d4b6',  # steve merchant
            'parent_name': 'Parent/Guardian Merchant',
            'reason': 'Last name fallback, also fix capitalization'
        }
    ]

    print("\nProposed fixes:")
    for i, fix in enumerate(fixes):
        print(f"{i+1}. ID: {fix['id'][:8]}...")
        print(f"   Parent name: '{fix['parent_name']}'")
        print(f"   Reason: {fix['reason']}")
        print()

    response = input("Apply these fixes? (yes/no): ").strip().lower()

    if response != 'yes':
        print("Fixes cancelled.")
        return

    print("\nApplying fixes...")

    applied = 0
    failed = 0

    for fix in fixes:
        try:
            # First, check if swimmer exists and get current name
            response = supabase.table('swimmers').select(
                'id, first_name, last_name, parent_name'
            ).eq('id', fix['id']).execute()

            if response.data:
                swimmer = response.data[0]
                current_name = swimmer.get('parent_name', 'None')

                print(f"\nUpdating {swimmer['first_name']} {swimmer['last_name']}:")
                print(f"  From: '{current_name}'")
                print(f"  To:   '{fix['parent_name']}'")

                # Apply update
                update_response = supabase.table('swimmers').update({
                    'parent_name': fix['parent_name']
                }).eq('id', fix['id']).execute()

                if update_response.data:
                    print(f"  ✅ SUCCESS")
                    applied += 1
                else:
                    print(f"  ❌ FAILED")
                    failed += 1
            else:
                print(f"\n❌ Swimmer not found: {fix['id'][:8]}...")
                failed += 1

        except Exception as e:
            print(f"\n❌ Error updating {fix['id'][:8]}...: {e}")
            failed += 1

    print(f"\n{'='*60}")
    print("RESULTS")
    print(f"{'='*60}")
    print(f"Fixes applied: {applied}")
    print(f"Fixes failed: {failed}")

    if applied > 0:
        print(f"\n✅ {applied} swimmers updated")
        print("You can now proceed with claim flow testing.")
    else:
        print(f"\n❌ No fixes applied. Manual intervention needed.")

if __name__ == "__main__":
    main()