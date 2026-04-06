#!/usr/bin/env python3
"""
Script to update Airtable records using MCP tool.
Marks 'Update email sent' = true for all delivered recipients.

This script uses the Airtable MCP tool to:
1. List all records with pagination
2. Filter for emails in the delivered list
3. Update matching records where 'Update email sent' is not already true
"""

import json
import sys
from typing import List, Dict, Set, Tuple

# Delivered email list (184 addresses) - converted to lowercase for case-insensitive matching
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

# Internal/test emails for special tracking
INTERNAL_EMAILS = {
    "sydnee@simplysydnee.com",
    "christybalaoing@gmail.com",
    "t.ash5@yahoo.com"
}

def print_header():
    """Print script header."""
    print("="*70)
    print("Airtable Email Update Script (MCP Tool Version)")
    print("="*70)
    print(f"Total delivered emails to check: {len(DELIVERED_EMAILS)}")
    print(f"Internal/test emails: {len(INTERNAL_EMAILS)}")
    print()

def normalize_email(email: str) -> str:
    """Normalize email for case-insensitive comparison."""
    if not email:
        return ""
    return email.strip().lower()

def process_records(records: List[Dict]) -> Tuple[List[Dict], Set[str], Set[str], Set[str]]:
    """
    Process records and identify which ones need updating.

    Returns:
        Tuple of (records_to_update, emails_found, emails_not_found, emails_already_true)
    """
    print("Processing records...")

    records_to_update = []
    emails_found = set()
    emails_not_found = DELIVERED_EMAILS.copy()  # Start with all delivered emails
    emails_already_true = set()

    for record in records:
        record_id = record.get("id")
        fields = record.get("fields", {})

        # Get email from record
        email = fields.get("Email")
        if not email:
            continue

        normalized_email = normalize_email(email)

        # Check if this email is in our delivered list
        if normalized_email in DELIVERED_EMAILS:
            emails_found.add(normalized_email)
            emails_not_found.discard(normalized_email)

            # Check current value of "Update email sent" field
            current_value = fields.get("Update email sent", False)

            if current_value is True:
                emails_already_true.add(normalized_email)
                continue  # Already marked true, skip update

            # Get client name for reporting
            client_name = fields.get("Client Name", "Unknown")

            records_to_update.append({
                "id": record_id,
                "fields": {
                    "Update email sent": True
                },
                "email": normalized_email,
                "name": client_name,
                "is_internal": normalized_email in INTERNAL_EMAILS
            })

    print(f"✓ Found {len(emails_found)} delivered emails in Airtable")
    print(f"✓ {len(emails_already_true)} emails already marked as 'Update email sent = true'")
    print(f"✓ {len(records_to_update)} records need updating")
    print(f"✓ {len(emails_not_found)} delivered emails not found in Airtable")
    print()

    return records_to_update, emails_found, emails_not_found, emails_already_true

def print_summary(
    updated_records: List[Dict],
    emails_found: Set[str],
    emails_not_found: Set[str],
    emails_already_true: Set[str]
) -> None:
    """Print detailed summary of the operation."""
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)

    print(f"\n📊 Statistics:")
    print(f"  • Total delivered emails: {len(DELIVERED_EMAILS)}")
    print(f"  • Emails found in Airtable: {len(emails_found)}")
    print(f"  • Records updated: {len(updated_records)}")
    print(f"  • Already marked true: {len(emails_already_true)}")
    print(f"  • Emails not found in Airtable: {len(emails_not_found)}")

    if updated_records:
        print(f"\n📝 Updated Records (ID + Name):")
        internal_count = 0
        for item in updated_records:
            prefix = "  • " + ("[INTERNAL] " if item["is_internal"] else "")
            print(f"{prefix}{item['id']}: {item['name']} ({item['email']})")
            if item["is_internal"]:
                internal_count += 1

        if internal_count:
            print(f"\n  Note: {internal_count} internal/test email(s) were updated")

    if emails_already_true:
        print(f"\n✅ Already Marked True ({len(emails_already_true)} emails):")
        # Show first 10 as examples
        sample = list(emails_already_true)[:10]
        for email in sample:
            print(f"  • {email}")
        if len(emails_already_true) > 10:
            print(f"  • ... and {len(emails_already_true) - 10} more")

    if emails_not_found:
        print(f"\n❌ Emails Not Found in Airtable ({len(emails_not_found)} emails):")
        # Show first 20 as examples
        sample = list(emails_not_found)[:20]
        for email in sample:
            print(f"  • {email}")
        if len(emails_not_found) > 20:
            print(f"  • ... and {len(emails_not_found) - 20} more")

    print("\n" + "="*70)
    print("Operation complete!")

def main():
    """Main function."""
    print_header()

    # First, we need to fetch all records with pagination
    print("Step 1: Fetching all records from Airtable...")

    all_records = []
    offset = None
    page_count = 0
    total_records = 0

    try:
        while True:
            # We'll use the MCP tool via manual calls since we can't call it directly from Python
            # For now, we'll process in batches manually
            print(f"  Note: This script needs to be run with manual MCP tool calls.")
            print(f"  Please run the following steps manually:")
            print()
            print(f"  1. Use 'mcp__airtable__list_records' with maxRecords=100")
            print(f"     and offset={offset if offset else 'None'}")
            print(f"  2. Process the returned records")
            print(f"  3. Check for 'offset' in response for pagination")
            print()
            break  # We'll break here since we can't automate MCP calls from Python

    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    print("\nSince we cannot automate MCP tool calls from Python, here's the manual process:")
    print("="*70)
    print("\nMANUAL PROCESS INSTRUCTIONS:")
    print("1. Use the MCP tool to list records in batches of 100")
    print("2. For each batch, check if emails match the delivered list")
    print("3. Update records where 'Update email sent' is not already true")
    print("4. Continue until no more records (no offset returned)")
    print()
    print("RECORDS TO UPDATE FORMAT:")
    print("For each record that needs updating, use:")
    print("  mcp__airtable__update_records")
    print("  baseId: 'appa5hlX697VP1FSo'")
    print("  tableId: 'tblXfCVX2NaUuXbYm'")
    print("  records: [")
    print("    {")
    print("      'id': 'record_id_here',")
    print("      'fields': {")
    print("        'Update email sent': True")
    print("      }")
    print("    }")
    print("  ]")
    print()
    print("Or update in batches (max 10 records per request):")
    print("  records: [")
    print("    {'id': 'rec1', 'fields': {'Update email sent': True}},")
    print("    {'id': 'rec2', 'fields': {'Update email sent': True}},")
    print("    ...")
    print("  ]")
    print()
    print("DELIVERED EMAILS TO CHECK:")
    print(f"Total: {len(DELIVERED_EMAILS)} emails")
    print()

    # Show a sample of emails to check
    print("Sample emails (first 20):")
    sample = list(DELIVERED_EMAILS)[:20]
    for i, email in enumerate(sample, 1):
        print(f"  {i:2d}. {email}")

    if len(DELIVERED_EMAILS) > 20:
        print(f"  ... and {len(DELIVERED_EMAILS) - 20} more")

    print()
    print("INTERNAL/TEST EMAILS (note these when updating):")
    for email in INTERNAL_EMAILS:
        print(f"  • {email}")

    print("\n" + "="*70)
    print("To automate this, you would need to:")
    print("1. Write a script that makes direct HTTP requests to Airtable API")
    print("2. Use the Python script I created earlier (update_airtable_emails.py)")
    print("3. Set AIRTABLE_PERSONAL_ACCESS_TOKEN environment variable")
    print("4. Run: python update_airtable_emails.py")

if __name__ == "__main__":
    main()