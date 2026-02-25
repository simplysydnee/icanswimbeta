#!/usr/bin/env python3
"""Test Supabase connection."""

import os
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env.local')
load_dotenv(env_path)

print("Testing Supabase connection...")
print(f"URL exists: {bool(os.getenv('NEXT_PUBLIC_SUPABASE_URL'))}")
print(f"Secret key exists: {bool(os.getenv('SUPABASE_SECRET_KEY'))}")

if os.getenv('NEXT_PUBLIC_SUPABASE_URL') and os.getenv('SUPABASE_SECRET_KEY'):
    print("Environment variables found.")

    # Try to import supabase
    try:
        from supabase import create_client
        print("Supabase module imported successfully.")

        # Try to create client
        supabase = create_client(
            os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
            os.getenv('SUPABASE_SECRET_KEY')
        )
        print("Supabase client created successfully.")

        # Try a simple query
        try:
            result = supabase.table('swimmers').select('count', count='exact').limit(1).execute()
            print(f"Query successful. Count: {result.count}")
        except Exception as e:
            print(f"Query failed: {e}")

    except Exception as e:
        print(f"Error creating Supabase client: {e}")
else:
    print("Missing environment variables.")