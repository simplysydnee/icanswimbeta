#!/usr/bin/env python3
"""
FINAL VERSION: Script to trigger next batch of emails.
Based on automation logic:
- Trigger: "Update email sent" is null/false AND "login email sent" is "no"
- Action: Send email, set "Update email sent" to True

So we need to:
1. Ensure "login email sent" = "no"
2. Ensure "Update email sent" is null/false (not True)
3. Set "Update email sent" = True (triggers automation)
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

    # Filter records that meet automation trigger conditions
    eligible_records = []
    for record in all_records:
        record_id = record.get("id")
        fields = record.get("fields", {})

        # Check conditions:
        # 1. Has email
        # 2. "Update email sent" is null or false (not True)
        # 3. We'll handle "login email sent" separately
        has_email = "Email" in fields and fields["Email"]
        update_sent = fields.get("Update email sent")
        login_sent = fields.get("login email sent")

        # Check if "Update email sent" is null or false (not True)
        update_sent_eligible = (update_sent is None) or (update_sent is False)

        if has_email and update_sent_eligible:
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
                "login_sent": login_sent,
                "needs_login_reset": login_sent != "no"  # Need to reset to "no"
            })

    # Sort by creation date (most recent first)
    eligible_records.sort(key=lambda x: x["record_created"], reverse=True)

    print(f"✓ Eligible records (Update email sent is null/false): {len(eligible_records)}")

    # Select 185 most recent
    selected = eligible_records[:185]

    # Count how many need login reset
    need_reset = sum(1 for r in selected if r["needs_login_reset"])

    print(f"✓ Selected {len(selected)} most recent records")
    print(f"✓ {need_reset} records need 'login email sent' reset to 'no'")

    return selected

def update_records(records_to_update: list) -> None:
    """Update records in Airtable to trigger email automation."""
    print(f"\nUpdating {len(records_to_update)} records to trigger emails...")

    # First, reset "login email sent" to "no" for records that need it
    records_needing_reset = [r for r in records_to_update if r["needs_login_reset"]]

    if records_needing_reset:
        print(f"Step 1: Resetting 'login email sent' to 'no' for {len(records_needing_reset)} records...")
        reset_batch_size = 10

        for i in range(0, len(records_needing_reset), reset_batch_size):
            batch = records_needing_reset[i:i + reset_batch_size]
            records_payload = []

            for record in batch:
                records_payload.append({
                    "id": record["id"],
                    "fields": {
                        "login email sent": "no"
                    }
                })

            try:
                response = requests.patch(BASE_URL, headers=HEADERS, json={"records": records_payload})
                response.raise_for_status()
                print(f"  Reset batch {i//reset_batch_size + 1}: {len(batch)} records")

            except requests.exceptions.RequestException as e:
                print(f"ERROR: Failed to reset batch {i//reset_batch_size + 1}: {e}")
                if hasattr(e.response, 'text'):
                    print(f"Response: {e.response.text}")

    # Now set "Update email sent" to True for ALL records (triggers automation)
    print(f"\nStep 2: Setting 'Update email sent' = True for {len(records_to_update)} records...")
    print("  This will trigger email automation for records where:")
    print("  - 'login email sent' = 'no'")
    print("  - 'Update email sent' was null/false (now changing to True)")

    batch_size = 10
    updated_count = 0

    for i in range(0, len(records_to_update), batch_size):
        batch = records_to_update[i:i + batch_size]
        records_payload = []

        for record in batch:
            records_payload.append({
                "id": record["id"],
                "fields": {
                    "Update email sent": True
                }
            })

        try:
            response = requests.patch(BASE_URL, headers=HEADERS, json={"records": records_payload})
            response.raise_for_status()
            updated_count += len(batch)

            # Print progress
            print(f"  Trigger batch {i//batch_size + 1}: {len(batch)} records")

            # Show first few records in first batch
            if i == 0:
                print(f"    Sample triggers:")
                for j, record in enumerate(batch[:3]):
                    print(f"      • {record['client_name']} ({record['email']})")
                    print(f"        Before: login_sent='{record['login_sent']}', update_sent={record['update_sent']}")
                    print(f"        After:  login_sent='no', update_sent=True")
                    print(f"        ✓ Email should trigger")

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to trigger batch {i//batch_size + 1}: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")

    print(f"\n✅ Successfully prepared {updated_count} records for email triggering")
    print(f"📧 Emails should now be sent via automation")
    print(f"   Trigger: 'login email sent'='no' AND 'Update email sent' changed to True")

def main():
    """Main function."""
    print("="*70)
    print("TRIGGER NEXT EMAIL BATCH (FINAL)")
    print("="*70)
    print("Based on your automation logic:")
    print("  Trigger: 'Update email sent' is null/false AND 'login email sent' is 'no'")
    print("  Action: Send email, set 'Update email sent' to True")
    print("\nThis script will:")
    print("1. Find 185 most recent 'Pending Parent Enrollment' records")
    print("2. Where 'Update email sent' is null/false")
    print("3. Reset 'login email sent' to 'no' if needed")
    print("4. Set 'Update email sent' = True (triggers automation)")
    print("="*70)

    # Check authentication
    check_auth_token()

    # Analyze and select records
    records_to_update = analyze_and_select_records()

    if not records_to_update:
        print("\n❌ No eligible records found!")
        print("   (Need records where 'Update email sent' is null/false)")
        return

    # Show summary
    print(f"\n📋 Summary:")
    print(f"  • Total records to trigger: {len(records_to_update)}")
    print(f"  • Resend daily limit: 185 emails")
    print(f"  • Emails that will be sent: {len(records_to_update)}")

    # Check login email sent status
    login_status_counts = {}
    for record in records_to_update:
        status = record["login_sent"] if record["login_sent"] is not None else "null"
        login_status_counts[status] = login_status_counts.get(status, 0) + 1

    print(f"  • 'login email sent' status:")
    for status, count in login_status_counts.items():
        print(f"      {status}: {count} records")

    print(f"\n📝 First 10 records to trigger:")
    for i, record in enumerate(records_to_update[:10], 1):
        email_display = record['email'][:30] + "..." if len(record['email']) > 30 else record['email']
        login_status = record['login_sent'] if record['login_sent'] is not None else "null"
        print(f"  {i:2d}. {record['client_name']} - {email_display}")
        print(f"       login: '{login_status}', update: {record['update_sent']}")

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
    print("✅ TRIGGER COMPLETE!")
    print("="*70)
    print(f"\n📊 Results:")
    print(f"  • Records prepared: {len(records_to_update)}")
    print(f"  • 'login email sent' set to: 'no'")
    print(f"  • 'Update email sent' set to: True")
    print(f"  • Emails triggered: {len(records_to_update)}")
    print(f"\n⚠️  Remaining Resend emails today: {185 - len(records_to_update)}")
    print(f"   Limit resets at midnight")
    print(f"\n📈 Next steps:")
    print(f"  1. Check Resend dashboard for send status")
    print(f"  2. Monitor email delivery")
    print(f"  3. Tomorrow: Run again for next batch")

if __name__ == "__main__":
    main()