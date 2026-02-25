#!/usr/bin/env python3
"""Get actual IDs for swimmers with None parent names."""

from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env.local')
load_dotenv(env_path)

def main():
    print("GETTING SWIMMER IDs WITH 'None' PARENT NAMES")
    print("=" * 60)

    # Initialize Supabase
    supabase = create_client(
        os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        os.getenv('SUPABASE_SECRET_KEY')
    )

    try:
        # Query for swimmers with None parent names
        response = supabase.table('swimmers').select(
            'id, first_name, last_name, parent_name, parent_email, enrollment_status'
        ).eq('enrollment_status', 'pending_enrollment').execute()

        none_parents = []
        for swimmer in response.data:
            parent_name = swimmer.get('parent_name')
            if parent_name in [None, 'None', 'none', '']:
                none_parents.append(swimmer)

        print(f"\nFound {len(none_parents)} swimmers with None parent names:")
        print("-" * 60)

        for i, swimmer in enumerate(none_parents):
            print(f"{i+1}. {swimmer['first_name']} {swimmer['last_name']}")
            print(f"   ID: {swimmer['id']}")
            print(f"   Email: {swimmer.get('parent_email', 'No email')}")
            print()

        if none_parents:
            print("\nPython list for fixing:")
            print("[")
            for swimmer in none_parents:
                print(f"    {{")
                print(f"        'id': '{swimmer['id']}',")
                print(f"        'first_name': '{swimmer['first_name']}',")
                print(f"        'last_name': '{swimmer['last_name']}',")
                print(f"        'email': '{swimmer.get('parent_email', '')}'")
                print(f"    }},")
            print("]")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()