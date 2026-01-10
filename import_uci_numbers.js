#!/usr/bin/env node

/**
 * UCI Numbers Import Script
 *
 * This script imports UCI numbers from a CSV file to Supabase swimmers table.
 * Matching strategy:
 * 1. Match by last_name (case insensitive)
 * 2. If multiple matches, use first_name_partial as prefix match
 * 3. Update swimmers.uci_number for exact matches
 * 4. Log unmatched/ambiguous records for manual review
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');
const readline = require('readline');

// Configuration
const CSV_PATH = process.argv[2] || './uci_import.csv';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Results tracking
const results = {
  total: 0,
  matched: 0,
  unmatched: 0,
  ambiguous: 0,
  errors: 0,
  matchedRecords: [],
  unmatchedRecords: [],
  ambiguousRecords: []
};

// Helper function to normalize names
function normalizeName(name) {
  return name.trim().toLowerCase();
}

// Helper function to parse CSV
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        records.push({
          uci: row.uci,
          pdf_name: row.pdf_name,
          last_name: row.last_name,
          first_name_partial: row.first_name_partial
        });
      })
      .on('end', () => {
        console.log(`Parsed ${records.length} records from CSV`);
        resolve(records);
      })
      .on('error', reject);
  });
}

// Find matching swimmer in database
async function findMatchingSwimmer(lastName, firstNamePartial) {
  try {
    // First, try exact match with last name and first name prefix
    const { data: exactMatches, error } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, uci_number')
      .ilike('last_name', lastName)
      .ilike('first_name', `${firstNamePartial}%`);

    if (error) {
      console.error('Database error:', error);
      return { matches: [], error };
    }

    // If we found exact matches, return them
    if (exactMatches && exactMatches.length > 0) {
      return { matches: exactMatches, error: null };
    }

    // If no exact matches, try just last name (case insensitive)
    const { data: lastNameMatches, error: lastNameError } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, uci_number')
      .ilike('last_name', lastName);

    if (lastNameError) {
      console.error('Database error (last name only):', lastNameError);
      return { matches: [], error: lastNameError };
    }

    return { matches: lastNameMatches || [], error: null };
  } catch (err) {
    console.error('Error finding matching swimmer:', err);
    return { matches: [], error: err };
  }
}

// Update swimmer with UCI number
async function updateSwimmerUCI(swimmerId, uciNumber) {
  try {
    const { error } = await supabase
      .from('swimmers')
      .update({
        uci_number: uciNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', swimmerId);

    if (error) {
      console.error(`Error updating swimmer ${swimmerId}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Exception updating swimmer ${swimmerId}:`, err);
    return false;
  }
}

// Process a single CSV record
async function processRecord(record, index) {
  console.log(`Processing ${index + 1}/${results.total}: ${record.pdf_name}`);

  const normalizedLastName = normalizeName(record.last_name);
  const normalizedFirstNamePartial = normalizeName(record.first_name_partial);

  // Find matching swimmer
  const { matches, error } = await findMatchingSwimmer(
    normalizedLastName,
    normalizedFirstNamePartial
  );

  if (error) {
    results.errors++;
    results.unmatchedRecords.push({
      ...record,
      reason: 'Database error',
      error: error.message
    });
    return;
  }

  if (matches.length === 0) {
    // No matches found
    results.unmatched++;
    results.unmatchedRecords.push({
      ...record,
      reason: 'No matching swimmer found',
      matches: []
    });
  } else if (matches.length === 1) {
    // Exact match found - update UCI number
    const swimmer = matches[0];
    const success = await updateSwimmerUCI(swimmer.id, record.uci);

    if (success) {
      results.matched++;
      results.matchedRecords.push({
        ...record,
        swimmer_id: swimmer.id,
        swimmer_name: `${swimmer.first_name} ${swimmer.last_name}`,
        previous_uci: swimmer.uci_number
      });
      console.log(`  ✓ Matched: ${swimmer.first_name} ${swimmer.last_name} → UCI: ${record.uci}`);
    } else {
      results.errors++;
      results.unmatchedRecords.push({
        ...record,
        reason: 'Failed to update database',
        swimmer_id: swimmer.id,
        swimmer_name: `${swimmer.first_name} ${swimmer.last_name}`
      });
    }
  } else {
    // Multiple matches found - ambiguous
    results.ambiguous++;
    results.ambiguousRecords.push({
      ...record,
      reason: 'Multiple potential matches',
      matches: matches.map(m => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`,
        uci_number: m.uci_number
      }))
    });
    console.log(`  ⚠ Ambiguous: ${matches.length} potential matches for ${record.pdf_name}`);
  }
}

// Generate report
function generateReport() {
  const report = `
UCI NUMBERS IMPORT REPORT
=========================

Summary:
--------
Total CSV Records: ${results.total}
Successfully Matched: ${results.matched}
Unmatched (no swimmer found): ${results.unmatched}
Ambiguous (multiple matches): ${results.ambiguous}
Errors: ${results.errors}

Matched Records (${results.matched}):
------------------------------------
${results.matchedRecords.map(r => `  • ${r.pdf_name} → ${r.swimmer_name} (ID: ${r.swimmer_id}) UCI: ${r.uci} ${r.previous_uci ? `(was: ${r.previous_uci})` : ''}`).join('\n')}

Unmatched Records (${results.unmatched}):
----------------------------------------
${results.unmatchedRecords.map(r => `  • ${r.pdf_name} (${r.last_name}, ${r.first_name_partial}) - ${r.reason}`).join('\n')}

Ambiguous Records (${results.ambiguous}):
----------------------------------------
${results.ambiguousRecords.map(r => `  • ${r.pdf_name} (${r.last_name}, ${r.first_name_partial})
    Potential matches:
    ${r.matches.map(m => `    - ${m.name} (ID: ${m.id}, Current UCI: ${m.uci_number || 'none'})`).join('\n    ')}`).join('\n\n')}

Errors (${results.errors}):
--------------------------
${results.unmatchedRecords.filter(r => r.error).map(r => `  • ${r.pdf_name}: ${r.error}`).join('\n')}
`;

  return report;
}

// Main function
async function main() {
  console.log('Starting UCI numbers import...');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`CSV file: ${CSV_PATH}`);

  // Check if CSV file exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Error: CSV file not found at ${CSV_PATH}`);
    console.log('Usage: node import_uci_numbers.js [path/to/uci_import.csv]');
    process.exit(1);
  }

  // Parse CSV
  const records = await parseCSV(CSV_PATH);
  results.total = records.length;

  console.log(`Processing ${records.length} records...\n`);

  // Process records sequentially
  for (let i = 0; i < records.length; i++) {
    await processRecord(records[i], i);

    // Small delay to avoid overwhelming the database
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Generate and save report
  const report = generateReport();
  const reportPath = `uci_import_report_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
  fs.writeFileSync(reportPath, report);

  console.log('\n' + report);
  console.log(`\nDetailed report saved to: ${reportPath}`);

  // Summary
  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`Total processed: ${results.total}`);
  console.log(`Successfully updated: ${results.matched}`);
  console.log(`Unmatched: ${results.unmatched}`);
  console.log(`Ambiguous: ${results.ambiguous}`);
  console.log(`Errors: ${results.errors}`);

  if (results.unmatched > 0 || results.ambiguous > 0) {
    console.log('\n⚠ Some records require manual review. Check the report for details.');
  }
}

// Run the script
main().catch(console.error);