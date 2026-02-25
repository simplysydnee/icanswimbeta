#!/usr/bin/env python3
"""Simple CSV test."""

import csv

csv_path = "/Users/sydnee/Desktop/Clients-All data all fields  (3).csv"

print(f"Testing CSV: {csv_path}")

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        print(f"Header length: {len(header)}")
        print(f"First 5 columns: {header[:5]}")

        # Find Parent Name column
        for i, col in enumerate(header):
            if 'Parent Name' in col:
                print(f"Found 'Parent Name' at index {i}: {col}")
                break

        # Read first 3 rows
        for i in range(3):
            row = next(reader)
            print(f"\nRow {i+1}:")
            print(f"  Length: {len(row)}")
            if len(row) > 4:
                print(f"  Parent Name: '{row[4]}'")

            # Look for UUID
            import re
            uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
            for cell in row:
                if uuid_pattern.match(cell.strip()):
                    print(f"  Found UUID: {cell}")
                    break

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()