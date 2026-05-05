"""
I Can Swim — Lesson Count Import Script
Reads weekly lesson count CSV and updates sessions_used on purchase_orders.

Match priority:
1. Auth number → purchase_orders.authorization_number
2. UCI number → swimmers.uci_number → purchase_orders.swimmer_id

Run: python3 import_lesson_counts.py
"""

import os
import sys
import csv
from pathlib import Path

try:
    from supabase import create_client
    from dotenv import load_dotenv
except ImportError:
    os.system("pip install supabase python-dotenv --break-system-packages -q")
    from supabase import create_client
    from dotenv import load_dotenv

# ─────────────────────────────────────────────
# SETUP
# ─────────────────────────────────────────────

load_dotenv(".env.local")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_KEY")

# ─────────────────────────────────────────────
# PARSE CSV
# ─────────────────────────────────────────────

def parse_csv(filepath):
    """
    Parse the Lesson_Counts_WE_X.csv file.
    Returns list of dicts with: name, auth, uci, sessions_used, remaining, action
    """
    with open(filepath, encoding='utf-8-sig') as f:
        content = f.read()

    lines = content.split('\n')
    rows = []

    # Row 1 = title, Row 2 = headers, Row 3 = dates, Row 4+ = data
    for line in lines[3:]:
        if not line.strip():
            continue
        parts = line.split(',')
        if len(parts) < 12:
            continue

        name        = parts[0].strip()
        auth        = parts[1].strip()
        uci         = parts[2].strip()
        beginning   = parts[3].strip()
        week_total  = parts[11].strip()
        remaining   = parts[12].strip() if len(parts) > 12 else ''
        action      = parts[13].strip() if len(parts) > 13 else ''

        if not name or name == 'Client Name':
            continue

        # Calculate sessions_used = beginning + this week
        try:
            beg = int(beginning) if beginning and beginning.lstrip('-').isdigit() else 0
            wk  = int(week_total) if week_total and week_total.lstrip('-').isdigit() else 0
            used = max(0, beg + wk)  # Never negative
        except Exception:
            used = 0

        # Only include auth if it looks like a real auth number (numeric)
        clean_auth = auth if auth and auth.isdigit() else None
        clean_uci  = uci if uci and uci.strip() else None

        rows.append({
            'name':     name,
            'auth':     clean_auth,
            'uci':      clean_uci,
            'used':     used,
            'remaining': remaining,
            'action':   action,
        })

    return rows

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get CSV path
    csv_path = input("\nPath to lesson counts CSV file: ").strip()
    if not Path(csv_path).exists():
        print(f"ERROR: File not found: {csv_path}")
        sys.exit(1)

    test_mode = input("Test mode? (y/n) [y]: ").strip().lower() != 'n'
    if test_mode:
        print("*** TEST MODE — No database changes will be made ***\n")

    rows = parse_csv(csv_path)
    print(f"Parsed {len(rows)} swimmers from CSV")

    # Counters
    updated_auth   = 0
    updated_uci    = 0
    skipped_zero   = 0
    not_found      = 0
    errors         = 0
    not_found_list = []

    print("\n" + "="*60)

    for r in rows:
        name  = r['name']
        auth  = r['auth']
        uci   = r['uci']
        used  = r['used']

        # Skip if 0 sessions — nothing to update
        if used == 0:
            skipped_zero += 1
            continue

        po_id = None
        match_method = None

        # ── Match by auth number first ──
        if auth:
            res = supabase.table('purchase_orders')\
                .select('id, sessions_used, sessions_authorized, swimmer_id')\
                .eq('authorization_number', auth)\
                .execute()
            if res.data:
                po = res.data[0]
                po_id = po['id']
                match_method = f"auth#{auth}"

        # ── Fallback: match by UCI → swimmer_id ──
        if not po_id and uci:
            swimmer_res = supabase.table('swimmers')\
                .select('id')\
                .eq('uci_number', uci)\
                .execute()
            if swimmer_res.data:
                swimmer_id = swimmer_res.data[0]['id']
                po_res = supabase.table('purchase_orders')\
                    .select('id, sessions_used, sessions_authorized, swimmer_id')\
                    .eq('swimmer_id', swimmer_id)\
                    .eq('po_type', 'lessons')\
                    .eq('status', 'active')\
                    .order('end_date', desc=True)\
                    .limit(1)\
                    .execute()
                if po_res.data:
                    po = po_res.data[0]
                    po_id = po['id']
                    match_method = f"UCI#{uci}"

        if not po_id:
            print(f"  ❌ NOT FOUND: {name} (auth={auth}, uci={uci})")
            not_found_list.append(f"{name} (auth={auth}, uci={uci})")
            not_found += 1
            continue

        # ── Update sessions_used ──
        print(f"  ✅ {name} → sessions_used={used} [{match_method}]")

        if not test_mode:
            try:
                supabase.table('purchase_orders')\
                    .update({
                        'sessions_used': used,
                        'updated_at': 'now()'
                    })\
                    .eq('id', po_id)\
                    .execute()

                if match_method.startswith('auth'):
                    updated_auth += 1
                else:
                    updated_uci += 1

            except Exception as e:
                print(f"    ERROR updating {name}: {e}")
                errors += 1
        else:
            if match_method.startswith('auth'):
                updated_auth += 1
            else:
                updated_uci += 1

    # ── Summary ──
    print("\n" + "="*60)
    print("IMPORT SUMMARY")
    print("="*60)
    print(f"Total swimmers in CSV:    {len(rows)}")
    print(f"Updated via auth#:        {updated_auth}")
    print(f"Updated via UCI#:         {updated_uci}")
    print(f"Skipped (0 sessions):     {skipped_zero}")
    print(f"Not found in DB:          {not_found}")
    print(f"Errors:                   {errors}")

    if test_mode:
        print("\n*** TEST MODE — No database changes were made ***")
        print("Run again and answer 'n' to apply changes.")

    if not_found_list:
        print(f"\nNot found ({len(not_found_list)}):")
        for n in not_found_list:
            print(f"  - {n}")

if __name__ == "__main__":
    main()
