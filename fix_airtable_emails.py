#!/usr/bin/env python3
"""
Script to fix Airtable email tracking:
1. Reset ALL "Update email sent" fields to false (clear incorrect markings)
2. Then mark ONLY the 184 actually delivered emails as true
"""

import os
import sys
import requests
import json
from typing import List, Dict, Set

# Airtable configuration
BASE_ID = "appa5hlX697VP1FSo"
TABLE_ID = "tblXfCVX2NaUuXbYm"
FIELD_ID = "fldvAvUlAZ8DfLzNa"  # "Update email sent" field
EMAIL_FIELD = "Email"

# API endpoints
BASE_URL = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}"
HEADERS = {
    "Authorization": f"Bearer {os.environ.get('AIRTABLE_PERSONAL_ACCESS_TOKEN') or os.environ.get('AIRTABLE_TOKEN')}",
    "Content-Type": "application/json"
}

# Delivered email list (184 addresses - ACTUALLY SENT)
DELIVERED_EMAILS = {
    email.lower() for email in [
        "1996.mzs@gmail.com",
        "2sweet0heart975@gmail.com",
        "alannahz.mommy@gmail.com",
        "alejandritaamontaanez@gmail.com",
        "alemanluz94@gmail.com",
        "alex200754@hotmail.com",
        "alexandria.waid@gmail.com",
        "alma87perezandrede@gmail.com",
        "alondra88valdovinos@gmail.com",
        "amarquez0923@yahoo.com",
        "ambercardenas67@gmail.com",
        "amendoza623@gmail.com",
        "analmv914@gmail.com",
        "angelinalozano123@gmail.com",
        "aprilmaeyama@yahoo.com",
        "araceli.huizar@yahoo.com",
        "aracelicorona100719@gmail.com",
        "ashleycook0337@gmail.com",
        "at_huynh@ymail.com",
        "avalosjose221@gmail.com",
        "b4ever79@aol.com",
        "bethlehem83@icloud.com",
        "blancajuarez425@yahoo.com",
        "briannasousa18@outlook.com",
        "brittanyborges5@gmail.com",
        "brittfacefosho@yahoo.com",
        "cab0614@aol.com",
        "cabrdzmarje26@gmail.com",
        "camposmelanny30@gmail.com",
        "carolinaecm21@gmail.com",
        "caseyd3398@gmail.com",
        "ccarrillo819@icloud.com",
        "cendybotello76@icloud.com",
        "cesar.algalan@gmail.com",
        "chavezmarisela353@gmail.com",
        "chrissyrae6@yahoo.com",
        "christybalaoing@gmail.com",
        "cindymercado15@gmail.com",
        "ckarinajf@gmail.com",
        "claudettedelacerda6@gmail.com",
        "claudia.86chavez@gmail.com",
        "columbaleon7@gmail.com",
        "connieblackmon10@gmail.com",
        "cordovamarisela70@gmail.com",
        "corlissrobinson57@yahoo.com",
        "csusaulsmom@gmail.com",
        "cuezzi95@gmail.com",
        "cynthiaor10@hotmail.com",
        "davidricous@proton.me",
        "dawnikaford23@yahoo.com",
        "deniseesquivel94p@gmail.com",
        "djacemixmaster@gmail.com",
        "duffyadrianna@yahoo.com",
        "elainafreitas913@gmail.com",
        "elidiadelatorre@yahoo.com",
        "eliflores@live.com",
        "elizabeth.s.flynn@gmail.com",
        "emarie1430@gmail.com",
        "emonijones5@yahoo.com",
        "esalas349@gmail.com",
        "espacevedo83@gmail.com",
        "esperanza0622@yahoo.com",
        "etteve88@gmail.com",
        "evinsantoine@gmail.com",
        "fdembroidery@gmail.com",
        "florezleti19@gmail.com",
        "franciscomasf04@outlook.com",
        "garcia.mari8719@gmail.com",
        "garcializette1997@gmail.com",
        "gemelia.white@gmail.com",
        "giomartinez1234526@icloud.com",
        "grajales@outlook.com",
        "guadalupecastaneda831@gmail.com",
        "heldy2022@icloud.com",
        "hindbenhacene@yahoo.fr",
        "irlanda.arreola.j@gmail.com",
        "isabel.delossantos@outlook.com",
        "jeannie1vargas@hotmail.com",
        "jewelyajones0617@yahoo.com",
        "jkamjkam15@gmail.com",
        "jlocz644@gmail.com",
        "jmartinez4208@gmail.com",
        "jmiller0831@yahoo.com",
        "jrsophie0723@gmail.com",
        "judithjuarez133@gmail.com",
        "justchris2016@yahoo.com",
        "jvilla94014@gmail.com",
        "jynnidawn@gmail.com",
        "karelyy22@gmail.com",
        "kassie2208@yahoo.com",
        "kcmtn209@yahoo.com",
        "kelsey.songer@yahoo.com",
        "kendrakamila07@gmail.com",
        "keva201113@gmail.com",
        "kmjones900@yahoo.com",
        "ktjhson18@gmail.com",
        "kyrstenlarson@yahoo.com",
        "ldiaz2010@gmail.com",
        "lenamarie@mycvre.com",
        "lilmegosss@gmail.com",
        "lilyjb14@gmail.com",
        "lupeo157@gmail.com",
        "madison.pimentel@outlook.com",
        "malloryclemens6@gmail.com",
        "marceny.bedoy@yahoo.com",
        "mariaalejandro333@icloud.com",
        "mariaangelica669@gmail.com",
        "mariagabrielaricocalderon@gmail.com",
        "mariaher45978@yahoo.com",
        "mariarivera330594@gmail.com",
        "maribel95388@gmail.com",
        "maricelabarajas729@gmail.com",
        "mary.ayala94@icloud.com",
        "maxinehernandez106@yahoo.com",
        "mayraiveth0724@gmail.com",
        "mayrapinonarreola@gmail.com",
        "melissakirk0509@yahoo.com",
        "melonie134@icloud.com",
        "michellegarcia93@yahoo.com",
        "mikiep13@yahoo.com",
        "missmaddiemariee@icloud.com",
        "mlornelasx50@gmail.com",
        "monicascolin@gmail.com",
        "msalazar0705@gmail.com",
        "munetonr703@gmail.com",
        "norazamudio77@gmail.com",
        "oliviahernandez877@gmail.com",
        "p.phengthirath@gmail.com",
        "palafoxl@yahoo.com",
        "paola0084@yahoo.com",
        "patobass686868@outlook.com",
        "picassoangela1979@gmail.com",
        "platardh@yahoo.com",
        "princess_lupita209@yahoo.com",
        "putt07_marissa@yahoo.com",
        "quel2tatted@gmail.com",
        "rachel_2005us@yahoo.com",
        "ramirezboly2714@gmail.com",
        "ramirezlucy606@gmail.com",
        "reagsmomma@gmail.com",
        "reneeybee_gr@icloud.com",
        "rmunoz4175@yahoo.com",
        "roblesjackie68@gmail.com",
        "robynrose209@gmail.com",
        "rocha.contreras@yahoo.com",
        "rochellewilliams86@gmail.com",
        "rodriguez.bounsana@gmail.com",
        "romerogriselda@icloud.com",
        "rosa.montijo@ymail.com",
        "ry.msantos96@gmail.com",
        "sasha.madrigal@yahoo.com",
        "saver_cruz@yahoo.com",
        "selenao0528@outlook.com",
        "sfgiantzfan1@gmail.com",
        "shelbyhaverson01@yahoo.com",
        "soto.bianca@outlook.com",
        "soto_00@yahoo.com",
        "stephanie2004alba@gmail.com",
        "susana.hrndz13@gmail.com",
        "svalverde5@icloud.com",
        "sweetuti06@gmail.com",
        "sydnee@simplysydnee.com",
        "t.ash5@yahoo.com",
        "tamekamartinez@chubb.com",
        "tania.ce.goncalves@gmail.com",
        "taniacrrsc@gmail.com",
        "tay01_ac@hotmail.com",
        "taylorleedom.21@gmail.com",
        "tdiaz2323@gmail.com",
        "teresaidedios@hotmail.com",
        "tinavega95@yahoo.com",
        "todosjuntos4veces4@gmail.com",
        "ulanyr14@gmail.com",
        "valenzuelabeatrice@yahoo.com",
        "valladaresromelia2@gmail.com",
        "vegasn97@gmail.com",
        "vinny209@hotmail.com",
        "violetsmith1990@gmail.com",
        "vrtrevino82@gmail.com",
        "wbradley825@gmail.com",
        "yaritzaochoa1994@gmail.com",
        "yenypalomino81@gmail.com",
        "yesiguillen718@gmail.com",
        "zepeda.s@yahoo.com"
    ]
}

def check_auth_token() -> None:
    """Check if Airtable token is available in environment."""
    token = os.environ.get('AIRTABLE_PERSONAL_ACCESS_TOKEN') or os.environ.get('AIRTABLE_TOKEN')
    if not token:
        print("ERROR: Airtable personal access token not found in environment.")
        print("Please set one of these environment variables:")
        print("  export AIRTABLE_PERSONAL_ACCESS_TOKEN='your_token_here'")
        print("  OR")
        print("  export AIRTABLE_TOKEN='your_token_here'")
        sys.exit(1)

    HEADERS["Authorization"] = f"Bearer {token}"
    print("✓ Airtable token found in environment")

def fetch_all_records() -> List[Dict]:
    """Fetch all records from Airtable with pagination."""
    print("Fetching all records from Airtable...")
    all_records = []
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

    print(f"✓ Total records fetched: {len(all_records)}")
    return all_records

def normalize_email(email: str) -> str:
    """Normalize email for case-insensitive comparison."""
    if not email:
        return ""
    return email.strip().lower()

def reset_all_fields(records: List[Dict]) -> int:
    """
    Reset ALL "Update email sent" fields to false.
    Returns number of records that were reset.
    """
    print("\nStep 1: Resetting ALL 'Update email sent' fields to false...")

    records_to_reset = []
    for record in records:
        record_id = record.get("id")
        fields = record.get("fields", {})

        # Check if field exists and is True
        if fields.get("Update email sent") is True:
            records_to_reset.append({
                "id": record_id,
                "fields": {
                    "Update email sent": False
                }
            })

    print(f"  Found {len(records_to_reset)} records with field = True to reset")

    if not records_to_reset:
        print("  No records need resetting")
        return 0

    # Reset in batches
    reset_count = 0
    batch_size = 10
    for i in range(0, len(records_to_reset), batch_size):
        batch = records_to_reset[i:i + batch_size]
        records_payload = [item for item in batch]

        try:
            response = requests.patch(
                BASE_URL,
                headers=HEADERS,
                json={"records": records_payload}
            )
            response.raise_for_status()
            reset_count += len(batch)
            print(f"  Batch {i//batch_size + 1}: Reset {len(batch)} records")

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to reset batch {i//batch_size + 1}: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")

    print(f"✓ Successfully reset {reset_count} records")
    return reset_count

def mark_delivered_emails(records: List[Dict]) -> int:
    """
    Mark ONLY the 184 delivered emails as "Update email sent" = true.
    Returns number of records marked.
    """
    print("\nStep 2: Marking ONLY delivered emails as true...")

    records_to_mark = []
    emails_found = set()
    emails_not_found = DELIVERED_EMAILS.copy()

    for record in records:
        record_id = record.get("id")
        fields = record.get("fields", {})

        # Get email from record
        email = fields.get(EMAIL_FIELD)
        if not email:
            continue

        normalized_email = normalize_email(email)

        # Check if this email is in our delivered list
        if normalized_email in DELIVERED_EMAILS:
            emails_found.add(normalized_email)
            emails_not_found.discard(normalized_email)

            # Get client name for reporting
            client_name = fields.get("Client Name", "Unknown")

            records_to_mark.append({
                "id": record_id,
                "fields": {
                    "Update email sent": True
                },
                "email": normalized_email,
                "name": client_name
            })

    print(f"  Found {len(emails_found)} delivered emails in Airtable")
    print(f"  Will mark {len(records_to_mark)} records as true")
    print(f"  {len(emails_not_found)} delivered emails not found in Airtable")

    if not records_to_mark:
        print("  No records to mark")
        return 0

    # Mark in batches
    marked_count = 0
    batch_size = 10
    for i in range(0, len(records_to_mark), batch_size):
        batch = records_to_mark[i:i + batch_size]
        records_payload = [{"id": item["id"], "fields": item["fields"]} for item in batch]

        try:
            response = requests.patch(
                BASE_URL,
                headers=HEADERS,
                json={"records": records_payload}
            )
            response.raise_for_status()
            marked_count += len(batch)

            # Print first few for verification
            if i == 0:
                print(f"  Sample updates (first {min(5, len(batch))}):")
                for j, item in enumerate(batch[:5]):
                    print(f"    • {item['name']} ({item['email']})")

            print(f"  Batch {i//batch_size + 1}: Marked {len(batch)} records")

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to mark batch {i//batch_size + 1}: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")

    print(f"✓ Successfully marked {marked_count} records as true")

    if emails_not_found:
        print(f"\n⚠️  Emails in delivered list but not found in Airtable:")
        for email in sorted(list(emails_not_found))[:10]:  # Show first 10
            print(f"  • {email}")
        if len(emails_not_found) > 10:
            print(f"  • ... and {len(emails_not_found) - 10} more")

    return marked_count

def verify_final_state() -> None:
    """Verify the final state after fixes."""
    print("\nStep 3: Verifying final state...")

    true_count = 0
    false_count = 0
    missing_count = 0
    total_records = 0

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
            total_records += len(records)

            for record in records:
                fields = record.get("fields", {})
                if "Update email sent" in fields:
                    if fields["Update email sent"] is True:
                        true_count += 1
                    else:
                        false_count += 1
                else:
                    missing_count += 1

            offset = data.get("offset")
            if not offset:
                break

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to verify records: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            return

    print(f"  Total records: {total_records}")
    print(f"  Records with field = True: {true_count}")
    print(f"  Records with field = False: {false_count}")
    print(f"  Records with field missing: {missing_count}")

    # Calculate expected
    expected_true = len(DELIVERED_EMAILS)  # Should be close to 184
    print(f"\n  Expected: ~{expected_true} records with field = True")
    print(f"  Actual: {true_count} records with field = True")

    if abs(true_count - expected_true) <= 10:  # Allow small variance for duplicates
        print("  ✓ Verification PASSED: Count is close to expected")
    else:
        print(f"  ⚠️  Verification WARNING: Count differs from expected by {abs(true_count - expected_true)}")

def main():
    """Main function."""
    print("="*70)
    print("Airtable Email Tracking Fix")
    print("="*70)
    print("This script will:")
    print("1. Reset ALL 'Update email sent' fields to false (clear incorrect data)")
    print("2. Mark ONLY the 184 actually delivered emails as true")
    print("3. Verify the final state")
    print("="*70)

    # Check authentication
    check_auth_token()

    # Fetch all records
    records = fetch_all_records()

    if not records:
        print("No records found in Airtable.")
        return

    # Step 1: Reset all fields
    reset_count = reset_all_fields(records)

    # Step 2: Mark only delivered emails
    marked_count = mark_delivered_emails(records)

    # Step 3: Verify final state
    verify_final_state()

    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print(f"• Reset {reset_count} records (cleared incorrect 'true' markings)")
    print(f"• Marked {marked_count} records as true (only actually delivered emails)")
    print(f"• Total delivered emails: {len(DELIVERED_EMAILS)}")
    print("\n✅ Fix complete! Airtable now accurately reflects which emails were sent.")
    print("="*70)

if __name__ == "__main__":
    main()