#!/usr/bin/env python3
"""
Script to update next batch of emails for "Pending Parent Enrollment" records.
Corrected version that sets both fields correctly for automation trigger:
1. Set "login email sent" = "no"
2. Set "Update email sent" = True
This triggers the email automation correctly.
"""

import os
import sys
import requests

# Airtable configuration
BASE_ID = "appa5hlX697VP1FSo"
TABLE_ID = "tblXfCVX2NaUuXbYm"

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

def analyze_and_select_records() -> list:
    """Analyze records and select 185 for update."""
    print("Analyzing 'Pending Parent Enrollment' records...")

    all_records = []
    offset = None

    # Fetch all records from the "Pending Parent Enrollment" view
    while True:
        params = {
            "view": "viwYo4mDW9O7gNmBj",  # "Pending Parent Enrollment" view
            "pageSize": 100
        }
        if offset:
            params["offset"] = offset

        try:
            response = requests.get(BASE_URL, headers=HEADERS, params=params)
            response.raise_for_status()
            data = response.json()

            records = data.get("records", [])
            all_records.extend(records)

            offset = data.get("offset")
            if not offset:
                break

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to fetch records: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            sys.exit(1)

    print(f"✓ Total records in 'Pending Parent Enrollment' view: {len(all_records)}")

    # Filter and sort records
    eligible_records = []
    for record in all_records:
        record_id = record.get("id")
        fields = record.get("fields", {})

        # Check if eligible:
        # 1. Has email
        # 2. "Update email sent" is not True
        # 3. "login email sent" is "yes" or missing (we'll reset it to "no")
        has_email = "Email" in fields and fields["Email"]
        update_sent = fields.get("Update email sent")
        login_sent = fields.get("login email sent")

        if has_email and update_sent is not True:
            # Get record created date for sorting
            record_created = fields.get("Record Created")
            created_date = "1970-01-01T00:00:00.000Z"
            if record_created:
                created_date = record_created

            eligible_records.append({
                "id": record_id,
                "email": fields.get("Email"),
                "client_name": fields.get("Client Name", "Unknown"),
                "parent_name": fields.get("Parent Name", ""),
                "record_created": created_date,
                "update_sent": update_sent,
                "login_sent": login_sent
            })

    # Sort by creation date (most recent first)
    eligible_records.sort(key=lambda x: x["record_created"], reverse=True)

    print(f"✓ Eligible records (Update email sent ≠ True): {len(eligible_records)}")

    # Select 185 most recent
    selected = eligible_records[:185]
    print(f"✓ Selected {len(selected)} most recent records for update")

    return selected

def update_records(records_to_update: list) -> None:
    """Update records in Airtable with correct field values."""
    print(f"\nUpdating {len(records_to_update)} records...")
    print("Setting: 'login email sent' = 'no' AND 'Update email sent' = True")

    # Update in batches of 10 (Airtable limit)
    batch_size = 10
    updated_count = 0

    for i in range(0, len(records_to_update), batch_size):
        batch = records_to_update[i:i + batch_size]
        records_payload = []

        for record in batch:
            records_payload.append({
                "id": record["id"],
                "fields": {
                    "login email sent": "no",
                    "Update email sent": True
                }
            })

        try:
            response = requests.patch(BASE_URL, headers=HEADERS, json={"records": records_payload})
            response.raise_for_status()
            updated_count += len(batch)

            # Print progress
            print(f"  Batch {i//batch_size + 1}: Updated {len(batch)} records")

            # Show first few records in first batch
            if i == 0:
                print(f"    Sample updates:")
                for j, record in enumerate(batch[:3]):
                    print(f"      • {record['client_name']} ({record['email']})")
                    print(f"        Before: login_sent='{record['login_sent']}', update_sent={record['update_sent']}")
                    print(f"        After:  login_sent='no', update_sent=True")

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to update batch {i//batch_size + 1}: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")

    print(f"\n✅ Successfully updated {updated_count} records")
    print(f"📧 Emails should now be triggered via automation")
    print(f"   (Trigger: login email sent='no' AND Update email sent=True)")

def main():
    """Main function."""
    print("="*70)
    print("UPDATE NEXT EMAIL BATCH (CORRECTED)")
    print("="*70)
    print("This script will:")
    print("1. Find 185 most recent 'Pending Parent Enrollment' records")
    print("2. Where 'Update email sent' is not True")
    print("3. Set 'login email sent' = 'no'")
    print("4. Set 'Update email sent' = True")
    print("5. Trigger email automation")
    print("="*70)

    # Check authentication
    check_auth_token()

    # Analyze and select records
    records_to_update = analyze_and_select_records()

    if not records_to_update:
        print("\n❌ No eligible records found!")
        return

    # Show summary
    print(f"\n📋 Summary:")
    print(f"  • Total records to update: {len(records_to_update)}")
    print(f"  • Resend daily limit: 185 emails")
    print(f"  • Emails will be sent: {len(records_to_update)}")

    print(f"\n📝 First 10 records to update:")
    for i, record in enumerate(records_to_update[:10], 1):
        email_display = record['email'][:30] + "..." if len(record['email']) > 30 else record['email']
        print(f"  {i:2d}. {record['client_name']} - {email_display}")

    if len(records_to_update) > 10:
        print(f"     ... and {len(records_to_update) - 10} more")

    # Confirm with user
    print(f"\n⚠️  CONFIRMATION REQUIRED:")
    print(f"   This will send {len(records_to_update)} emails via Resend")
    print(f"   Using your daily limit of 185 emails")
    print(f"\n   Type 'YES' to continue: ", end="")

    confirmation = input().strip()
    if confirmation != "YES":
        print("\n❌ Update cancelled.")
        return

    # Update records
    update_records(records_to_update)

    print("\n" + "="*70)
    print("✅ UPDATE COMPLETE!")
    print("="*70)
    print(f"\n📊 Results:")
    print(f"  • Updated: {len(records_to_update)} records")
    print(f"  • Set: 'login email sent' = 'no'")
    print(f"  • Set: 'Update email sent' = True")
    print(f"  • Emails triggered: {len(records_to_update)}")
    print(f"\n⚠️  Remaining Resend emails today: {185 - len(records_to_update)}")
    print(f"   Limit resets at midnight")

if __name__ == "__main__":
    main()