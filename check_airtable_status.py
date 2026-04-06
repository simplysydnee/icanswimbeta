#!/usr/bin/env python3
"""
Quick script to check how many records have "Update email sent" = true
"""

import os
import sys
import requests

# Airtable configuration
BASE_ID = "appa5hlX697VP1FSo"
TABLE_ID = "tblXfCVX2NaUuXbYm"
FIELD_ID = "fldvAvUlAZ8DfLzNa"  # "Update email sent" field

# API endpoints
BASE_URL = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}"
HEADERS = {
    "Authorization": f"Bearer {os.environ.get('AIRTABLE_PERSONAL_ACCESS_TOKEN')}",
    "Content-Type": "application/json"
}

def check_auth_token() -> None:
    """Check if Airtable token is available in environment."""
    token = os.environ.get('AIRTABLE_PERSONAL_ACCESS_TOKEN')
    if not token:
        print("ERROR: Airtable personal access token not found in environment.")
        print("Please set: export AIRTABLE_PERSONAL_ACCESS_TOKEN='your_token_here'")
        sys.exit(1)

    HEADERS["Authorization"] = f"Bearer {token}"
    print("✓ Airtable token found in environment")

def count_true_records() -> int:
    """Count how many records have 'Update email sent' = true."""
    print("Counting records with 'Update email sent' = true...")

    count = 0
    offset = None
    page_count = 0

    while True:
        params = {"pageSize": 100}
        if offset:
            params["offset"] = offset

        try:
            response = requests.get(BASE_URL, headers=HEADERS, params=params)
            response.raise_for_status()
            data = response.json()

            records = data.get("records", [])
            page_count += 1

            # Count records with "Update email sent" = true
            for record in records:
                fields = record.get("fields", {})
                if fields.get("Update email sent") is True:
                    count += 1

            print(f"  Page {page_count}: Processed {len(records)} records, {count} with field = true so far")

            offset = data.get("offset")
            if not offset:
                break

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to fetch records: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            sys.exit(1)

    return count

def main():
    """Main function."""
    print("="*60)
    print("Airtable Status Check")
    print("="*60)

    # Check authentication
    check_auth_token()

    # Count records with field = true
    true_count = count_true_records()

    print(f"\n📊 Result:")
    print(f"  Total records with 'Update email sent' = true: {true_count}")

    print("\n" + "="*60)
    print("Check complete!")

if __name__ == "__main__":
    main()