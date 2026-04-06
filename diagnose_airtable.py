#!/usr/bin/env python3
"""
Diagnostic script to understand field values in Airtable
"""

import os
import sys
import requests

# Airtable configuration
BASE_ID = "appa5hlX697VP1FSo"
TABLE_ID = "tblXfCVX2NaUuXbYm"
FIELD_NAME = "Update email sent"

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

def analyze_field_values() -> None:
    """Analyze different field values for 'Update email sent'."""
    print("Analyzing field values for 'Update email sent'...")

    true_count = 0
    false_count = 0
    null_count = 0
    missing_count = 0
    other_count = 0
    total_records = 0

    offset = None
    page_count = 0

    # Sample some records to see actual values
    sample_records = []

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
            total_records += len(records)

            for record in records:
                fields = record.get("fields", {})

                if FIELD_NAME in fields:
                    value = fields[FIELD_NAME]

                    if value is True:
                        true_count += 1
                    elif value is False:
                        false_count += 1
                    elif value is None:
                        null_count += 1
                    else:
                        other_count += 1
                        # Collect sample of non-boolean values
                        if len(sample_records) < 5:
                            sample_records.append({
                                "id": record.get("id"),
                                "value": value,
                                "type": type(value).__name__
                            })
                else:
                    missing_count += 1

            print(f"  Page {page_count}: Processed {len(records)} records")

            offset = data.get("offset")
            if not offset:
                break

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to fetch records: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            sys.exit(1)

    print(f"\n📊 Field Value Analysis:")
    print(f"  Total records processed: {total_records}")
    print(f"  Records with field = True: {true_count}")
    print(f"  Records with field = False: {false_count}")
    print(f"  Records with field = None: {null_count}")
    print(f"  Records with field missing: {missing_count}")
    print(f"  Records with other values: {other_count}")

    if sample_records:
        print(f"\n🔍 Sample of non-boolean values:")
        for sample in sample_records:
            print(f"    Record ID: {sample['id']}")
            print(f"    Value: {sample['value']} (type: {sample['type']})")
            print()

    # Check some specific records that should have been updated
    print(f"\n🔍 Checking specific emails from delivered list:")
    test_emails = ["mayrapinonarreola@gmail.com", "sydnee@simplysydnee.com", "christybalaoing@gmail.com"]

    for email in test_emails:
        print(f"\n  Looking for email: {email}")
        params = {
            "filterByFormula": f"{{Email}} = '{email}'",
            "maxRecords": 5
        }

        try:
            response = requests.get(BASE_URL, headers=HEADERS, params=params)
            response.raise_for_status()
            data = response.json()

            records = data.get("records", [])
            print(f"    Found {len(records)} record(s)")

            for record in records:
                fields = record.get("fields", {})
                field_value = fields.get(FIELD_NAME, "MISSING")
                print(f"    Record {record.get('id')}: '{FIELD_NAME}' = {field_value} (type: {type(field_value).__name__})")

        except requests.exceptions.RequestException as e:
            print(f"    ERROR: {e}")

def main():
    """Main function."""
    print("="*60)
    print("Airtable Field Value Diagnostic")
    print("="*60)

    # Check authentication
    check_auth_token()

    # Analyze field values
    analyze_field_values()

    print("\n" + "="*60)
    print("Diagnostic complete!")

if __name__ == "__main__":
    main()