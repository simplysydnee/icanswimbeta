#!/usr/bin/env node

/**
 * Fix UCI Matches Script
 *
 * Part 1: Resolve ambiguous records (9 records)
 * Part 2: Find missing 84 records with fuzzy matching
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Ambiguous records from the import
const ambiguousRecords = [
  {
    uci: '7763834',
    pdf_name: 'BARAJAS, JR, AL',
    last_name: 'BARAJAS',
    first_name_partial: 'AL',
    description: 'Look for "Alfredo Barajas Jr" or similar'
  },
  {
    uci: '8657143',
    pdf_name: 'CASTILLO, ELLIE',
    last_name: 'CASTILLO',
    first_name_partial: 'ELLIE',
    description: 'Look for "Ellie Castillo"'
  },
  {
    uci: '8658744',
    pdf_name: 'FERRY, RYLIE',
    last_name: 'FERRY',
    first_name_partial: 'RYLIE',
    description: 'Look for "Rylie Ferry"'
  },
  {
    uci: '8660482',
    pdf_name: 'GARCIA, ARIELLA',
    last_name: 'GARCIA',
    first_name_partial: 'ARIELLA',
    description: 'Look for "Ariella Garcia"'
  },
  {
    uci: '7779288',
    pdf_name: 'HARVEY, CAMERON',
    last_name: 'HARVEY',
    first_name_partial: 'CAMERON',
    description: 'Look for "Cameron Harvey"'
  },
  {
    uci: '7779371',
    pdf_name: 'JOHNSON, THOMAS',
    last_name: 'JOHNSON',
    first_name_partial: 'THOMAS',
    description: 'Look for "Thomas Johnson"'
  },
  {
    uci: '8659913',
    pdf_name: 'SINGH, RAYYAAN',
    last_name: 'SINGH',
    first_name_partial: 'RAYYAAN',
    description: 'Look for "Rayyaan Singh"'
  },
  {
    uci: '8656331',
    pdf_name: 'SINGH, TEGHVEER',
    last_name: 'SINGH',
    first_name_partial: 'TEGHVEER',
    description: 'Look for "Teghveer Singh"'
  },
  {
    uci: '7787543',
    pdf_name: 'TORRES, KYNZLEI',
    last_name: 'TORRES',
    first_name_partial: 'KYNZLEI',
    description: 'Look for "Kynzlei Torres"'
  }
];

// Helper function to search for swimmers with detailed info
async function searchSwimmersWithDetails(lastName, firstNamePartial = null) {
  try {
    let query = supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        enrollment_status,
        uci_number,
        funding_source:funding_sources!swimmers_funding_source_id_fkey (
          id,
          name,
          short_name,
          is_vmrc
        )
      `)
      .ilike('last_name', `%${lastName}%`);

    if (firstNamePartial) {
      query = query.ilike('first_name', `${firstNamePartial}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error searching swimmers:', err);
    return [];
  }
}

// Helper function to update swimmer UCI
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

// Part 1: Investigate ambiguous records
async function investigateAmbiguousRecords() {
  console.log('=== PART 1: INVESTIGATING AMBIGUOUS RECORDS (9) ===\n');

  const results = [];

  for (const record of ambiguousRecords) {
    console.log(`\n🔍 Investigating: ${record.pdf_name} (UCI: ${record.uci})`);
    console.log(`Description: ${record.description}`);

    // Search for exact matches first
    const exactMatches = await searchSwimmersWithDetails(record.last_name, record.first_name_partial);

    // If no exact matches, try just last name
    const lastNameMatches = exactMatches.length > 0
      ? exactMatches
      : await searchSwimmersWithDetails(record.last_name);

    console.log(`Found ${lastNameMatches.length} potential matches:`);

    if (lastNameMatches.length === 0) {
      console.log('  No matches found');
      results.push({
        ...record,
        matches: [],
        recommendation: 'NO MATCHES FOUND'
      });
      continue;
    }

    // Display matches with details
    lastNameMatches.forEach((swimmer, index) => {
      const fundingSource = swimmer.funding_source;
      const fundingInfo = fundingSource
        ? `${fundingSource.short_name}${fundingSource.is_vmrc ? ' (VMRC)' : ''}`
        : 'No funding source';

      console.log(`  ${index + 1}. ${swimmer.first_name} ${swimmer.last_name}`);
      console.log(`     ID: ${swimmer.id}`);
      console.log(`     Status: ${swimmer.enrollment_status}`);
      console.log(`     Funding: ${fundingInfo}`);
      console.log(`     Current UCI: ${swimmer.uci_number || 'None'}`);
    });

    // Recommend based on VMRC funding
    const vmrcMatches = lastNameMatches.filter(s =>
      s.funding_source && s.funding_source.is_vmrc
    );

    let recommendation;
    if (vmrcMatches.length === 1) {
      recommendation = `SELECT: ${vmrcMatches[0].first_name} ${vmrcMatches[0].last_name} (VMRC funding)`;
    } else if (vmrcMatches.length > 1) {
      recommendation = `MULTIPLE VMRC MATCHES - Need manual selection`;
    } else if (lastNameMatches.length === 1) {
      recommendation = `SELECT: ${lastNameMatches[0].first_name} ${lastNameMatches[0].last_name} (only match)`;
    } else {
      recommendation = 'MULTIPLE MATCHES - Need manual selection';
    }

    console.log(`\n✅ Recommendation: ${recommendation}`);

    results.push({
      ...record,
      matches: lastNameMatches,
      recommendation
    });
  }

  return results;
}

// Part 2: Find missing records with fuzzy matching
async function findMissingRecords() {
  console.log('\n\n=== PART 2: FINDING MISSING 84 RECORDS ===\n');

  // Read the original CSV to get all records
  const csvData = fs.readFileSync('./uci_import.csv', 'utf8');
  const lines = csvData.split('\n').slice(1); // Skip header
  const allRecords = lines.filter(line => line.trim()).map(line => {
    const [uci, pdf_name, last_name, first_name_partial] = line.split(',');
    return {
      uci: uci.trim(),
      pdf_name: pdf_name.trim().replace(/"/g, ''),
      last_name: last_name.trim().replace(/"/g, ''),
      first_name_partial: first_name_partial.trim().replace(/"/g, '')
    };
  });

  // Read the report to find which ones were unmatched
  const reportData = fs.readFileSync('./uci_import_report_2026-01-09T19-32-53-078Z.txt', 'utf8');

  // Extract unmatched records from report
  const unmatchedSection = reportData.split('Unmatched Records (84):')[1]?.split('Ambiguous Records (9):')[0];
  const unmatchedLines = unmatchedSection?.split('\n').filter(line => line.includes('•')) || [];

  const unmatchedRecords = [];
  for (const line of unmatchedLines) {
    const match = line.match(/• (.+?) \((.+?), (.+?)\) -/);
    if (match) {
      const [, pdf_name, last_name, first_name_partial] = match;
      // Find the full record from CSV
      const fullRecord = allRecords.find(r =>
        r.pdf_name === pdf_name.trim() &&
        r.last_name === last_name.trim() &&
        r.first_name_partial === first_name_partial.trim()
      );
      if (fullRecord) {
        unmatchedRecords.push(fullRecord);
      }
    }
  }

  console.log(`Found ${unmatchedRecords.length} unmatched records to investigate\n`);

  const fuzzyMatches = [];
  const notFound = [];

  for (const record of unmatchedRecords) {
    console.log(`🔍 Searching: ${record.pdf_name} (${record.last_name}, ${record.first_name_partial})`);

    // Try different matching strategies
    let matches = [];

    // Strategy 1: Exact last name + first name prefix
    matches = await searchSwimmersWithDetails(record.last_name, record.first_name_partial);

    // Strategy 2: Just last name (case insensitive)
    if (matches.length === 0) {
      matches = await searchSwimmersWithDetails(record.last_name);
    }

    // Strategy 3: Try without hyphens or special characters
    if (matches.length === 0 && record.last_name.includes('-')) {
      const simpleLastName = record.last_name.split('-')[0].trim();
      matches = await searchSwimmersWithDetails(simpleLastName, record.first_name_partial);
    }

    // Strategy 4: Try just first 3 letters of first name
    if (matches.length === 0 && record.first_name_partial.length >= 3) {
      const shortFirstName = record.first_name_partial.substring(0, 3);
      matches = await searchSwimmersWithDetails(record.last_name, shortFirstName);
    }

    if (matches.length > 0) {
      console.log(`  ✅ Found ${matches.length} potential match(es)`);

      // Show matches
      matches.forEach((swimmer, index) => {
        const fundingSource = swimmer.funding_source;
        const fundingInfo = fundingSource
          ? `${fundingSource.short_name}${fundingSource.is_vmrc ? ' (VMRC)' : ''}`
          : 'No funding source';

        console.log(`    ${index + 1}. ${swimmer.first_name} ${swimmer.last_name}`);
        console.log(`       Status: ${swimmer.enrollment_status}`);
        console.log(`       Funding: ${fundingInfo}`);
      });

      fuzzyMatches.push({
        record,
        matches
      });
    } else {
      console.log(`  ❌ No matches found`);
      notFound.push(record);
    }
  }

  return {
    fuzzyMatches,
    notFound,
    totalUnmatched: unmatchedRecords.length
  };
}

// Main function
async function main() {
  console.log('🔧 FIXING UCI MATCHES\n');

  // Part 1: Ambiguous records
  const ambiguousResults = await investigateAmbiguousRecords();

  // Part 2: Missing records
  const missingResults = await findMissingRecords();

  // Generate summary
  console.log('\n\n=== SUMMARY ===\n');

  console.log('PART 1 - Ambiguous Records (9):');
  console.log('--------------------------------');
  ambiguousResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.pdf_name}`);
    console.log(`   Matches: ${result.matches.length}`);
    console.log(`   Recommendation: ${result.recommendation}`);
    console.log('');
  });

  console.log('\nPART 2 - Missing Records Analysis:');
  console.log('-----------------------------------');
  console.log(`Total unmatched records: ${missingResults.totalUnmatched}`);
  console.log(`Found with fuzzy matching: ${missingResults.fuzzyMatches.length}`);
  console.log(`Not found in system: ${missingResults.notFound.length}`);

  console.log('\n🔍 Fuzzy Match Details:');
  missingResults.fuzzyMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match.record.pdf_name}`);
    console.log(`   Potential matches: ${match.matches.length}`);
    match.matches.forEach((swimmer, i) => {
      console.log(`   ${i + 1}. ${swimmer.first_name} ${swimmer.last_name} (${swimmer.enrollment_status})`);
    });
  });

  console.log('\n❌ Not Found in System:');
  missingResults.notFound.forEach((record, index) => {
    console.log(`${index + 1}. ${record.pdf_name} (${record.last_name}, ${record.first_name_partial})`);
  });

  // Save results to file
  const output = {
    timestamp: new Date().toISOString(),
    ambiguousRecords: ambiguousResults,
    fuzzyMatches: missingResults.fuzzyMatches.map(m => ({
      record: m.record,
      matches: m.matches.map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        status: s.enrollment_status,
        funding_source: s.funding_source ? {
          name: s.funding_source.name,
          short_name: s.funding_source.short_name,
          is_vmrc: s.funding_source.is_vmrc
        } : null
      }))
    })),
    notFound: missingResults.notFound
  };

  const outputFile = `uci_fix_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`\n📄 Detailed report saved to: ${outputFile}`);
  console.log('\n✅ Analysis complete! Review the recommendations above.');
}

// Run the script
main().catch(console.error);