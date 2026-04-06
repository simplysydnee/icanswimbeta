#!/usr/bin/env python3
"""
Plan for next email batch:
1. Analyze current state of "Pending Parent Enrollment" records
2. Find records where "Update email sent" is null/false
3. Select 185 most recent records
4. Create execution plan
"""

import os
import sys
import requests
from datetime import datetime
from typing import List, Dict

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

def analyze_pending_enrollment() -> Dict:
    """Analyze records in "Pending Parent Enrollment" view."""
    print("Analyzing 'Pending Parent Enrollment' records...")

    all_records = []
    offset = None
    page_count = 0

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
            page_count += 1

            print(f"  Page {page_count}: Fetched {len(records)} records")

            offset = data.get("offset")
            if not offset:
                break

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to fetch records: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            sys.exit(1)

    print(f"✓ Total records in 'Pending Parent Enrollment' view: {len(all_records)}")

    # Analyze records
    analysis = {
        "total": len(all_records),
        "email_sent_true": 0,
        "email_sent_false": 0,
        "email_sent_missing": 0,
        "records_with_email": 0,
        "records_without_email": 0,
        "eligible_records": [],  # Records where email_sent is not true AND has email
        "recent_records": []     # Sorted by "Record Created" date
    }

    for record in all_records:
        record_id = record.get("id")
        fields = record.get("fields", {})

        # Check email field
        has_email = "Email" in fields and fields["Email"]

        # Check Update email sent field
        email_sent = fields.get("Update email sent")

        if email_sent is True:
            analysis["email_sent_true"] += 1
        elif email_sent is False:
            analysis["email_sent_false"] += 1
        else:
            analysis["email_sent_missing"] += 1

        if has_email:
            analysis["records_with_email"] += 1

            # Check if eligible (email_sent is not True AND has email)
            if email_sent is not True:
                # Get record created date for sorting
                record_created = fields.get("Record Created")
                created_date = None
                if record_created:
                    try:
                        created_date = datetime.fromisoformat(record_created.replace('Z', '+00:00'))
                    except:
                        created_date = datetime.min

                analysis["eligible_records"].append({
                    "id": record_id,
                    "email": fields.get("Email"),
                    "client_name": fields.get("Client Name", "Unknown"),
                    "parent_name": fields.get("Parent Name", ""),
                    "record_created": record_created,
                    "created_date": created_date,
                    "status": fields.get("Status", [])
                })
        else:
            analysis["records_without_email"] += 1

    # Sort eligible records by creation date (most recent first)
    analysis["eligible_records"].sort(key=lambda x: x["created_date"], reverse=True)
    analysis["recent_records"] = analysis["eligible_records"][:200]  # Get top 200 most recent

    return analysis

def print_analysis(analysis: Dict) -> None:
    """Print analysis results."""
    print("\n" + "="*70)
    print("ANALYSIS: Pending Parent Enrollment Records")
    print("="*70)

    print(f"\n📊 Total records in view: {analysis['total']}")
    print(f"  • With 'Update email sent' = True: {analysis['email_sent_true']}")
    print(f"  • With 'Update email sent' = False: {analysis['email_sent_false']}")
    print(f"  • With 'Update email sent' missing: {analysis['email_sent_missing']}")

    print(f"\n📧 Email availability:")
    print(f"  • Records with email: {analysis['records_with_email']}")
    print(f"  • Records without email: {analysis['records_without_email']}")

    print(f"\n🎯 Eligible for next batch (email_sent ≠ True AND has email):")
    print(f"  • Total eligible: {len(analysis['eligible_records'])}")

    if analysis['eligible_records']:
        print(f"  • Most recent record: {analysis['eligible_records'][0]['record_created']}")
        print(f"  • Oldest eligible record: {analysis['eligible_records'][-1]['record_created']}")

    print(f"\n📅 Top 10 most recent eligible records:")
    for i, record in enumerate(analysis['recent_records'][:10], 1):
        email_display = record['email'][:30] + "..." if len(record['email']) > 30 else record['email']
        print(f"  {i:2d}. {record['client_name']} - {email_display} ({record['record_created'][:10]})")

def create_execution_plan(analysis: Dict, batch_size: int = 185) -> Dict:
    """Create execution plan for next batch."""
    print(f"\n" + "="*70)
    print(f"EXECUTION PLAN: Next {batch_size} Emails")
    print("="*70)

    eligible_count = len(analysis['eligible_records'])

    if eligible_count == 0:
        print("❌ No eligible records found!")
        return {"can_execute": False, "reason": "No eligible records"}

    if eligible_count < batch_size:
        print(f"⚠️  Only {eligible_count} eligible records found (need {batch_size})")
        print(f"   Will send to all {eligible_count} available records")
        selected_records = analysis['eligible_records']
    else:
        print(f"✅ Found {eligible_count} eligible records")
        print(f"   Will select {batch_size} most recent records")
        selected_records = analysis['eligible_records'][:batch_size]

    # Create plan
    plan = {
        "can_execute": True,
        "batch_size": len(selected_records),
        "selected_records": selected_records,
        "steps": []
    }

    print(f"\n📋 Execution Steps:")
    print(f"  1. Update {len(selected_records)} records:")
    print(f"     • Set 'Update email sent' = True")
    print(f"     • This will trigger email sending via automation")

    print(f"\n📝 Records to update (first 10):")
    for i, record in enumerate(selected_records[:10], 1):
        print(f"  {i:2d}. {record['id']}: {record['client_name']} ({record['email']})")

    if len(selected_records) > 10:
        print(f"     ... and {len(selected_records) - 10} more")

    print(f"\n⚙️  Technical Implementation:")
    print(f"  • Use Airtable MCP tool: mcp__airtable__update_records")
    print(f"  • Update in batches of 10 records (Airtable limit)")
    print(f"  • Set field: 'Update email sent' = True")

    print(f"\n⚠️  Important Considerations:")
    print(f"  1. Resend limit: 185 emails per day")
    print(f"  2. Current batch: {len(selected_records)} emails")
    print(f"  3. Ensure automation is set up to send emails when field changes")
    print(f"  4. Verify email template is correct for 'Pending Parent Enrollment' status")

    return plan

def generate_update_script(plan: Dict) -> None:
    """Generate Python script for execution."""
    if not plan["can_execute"]:
        return

    script_content = '''#!/usr/bin/env python3
"""
Script to update next batch of emails for "Pending Parent Enrollment" records.
Sets 'Update email sent' = True to trigger email automation.
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

def update_records(records_to_update: list) -> None:
    """Update records in Airtable."""
    print(f"\\nUpdating {len(records_to_update)} records...")

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
                    print(f"      • {record.get('client_name', 'Unknown')} ({record.get('email', 'No email')})")

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to update batch {i//batch_size + 1}: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")

    print(f"\\n✅ Successfully updated {updated_count} records")
    print(f"📧 Emails should now be triggered via automation")

def main():
    """Main function."""
    print("="*70)
    print("Update Next Email Batch")
    print("="*70)

    # Check authentication
    check_auth_token()

    # Records to update
    records_to_update = [
'''

    # Add records to script
    for record in plan["selected_records"]:
        script_content += f'        {{"id": "{record["id"]}", "email": "{record["email"]}", "client_name": "{record["client_name"]}"}},\n'

    script_content += '''    ]

    # Confirm with user
    print(f"\\nWill update {len(records_to_update)} records:")
    print("This will set 'Update email sent' = True and trigger email sending.")
    print("\\nType 'YES' to continue: ", end="")

    confirmation = input().strip()
    if confirmation != "YES":
        print("\\n❌ Update cancelled.")
        return

    # Update records
    update_records(records_to_update)

    print("\\n" + "="*70)
    print("✅ Update complete!")
    print("="*70)

if __name__ == "__main__":
    main()
'''

    # Write script to file
    script_path = "/Users/sydnee/icanswimbeta/execute_next_batch.py"
    with open(script_path, "w") as f:
        f.write(script_content)

    print(f"\n📄 Execution script generated: {script_path}")
    print(f"   To run: python3 {script_path}")
    print(f"   Requires: export AIRTABLE_PERSONAL_ACCESS_TOKEN='your_token'")

def main():
    """Main function."""
    print("="*70)
    print("PLAN: Next Email Batch Execution")
    print("="*70)

    # Check authentication
    check_auth_token()

    # Analyze current state
    analysis = analyze_pending_enrollment()

    # Print analysis
    print_analysis(analysis)

    # Create execution plan
    plan = create_execution_plan(analysis, batch_size=185)

    # Generate execution script if plan is viable
    if plan["can_execute"]:
        generate_update_script(plan)

    print("\n" + "="*70)
    print("PLANNING COMPLETE")
    print("="*70)

if __name__ == "__main__":
    main()