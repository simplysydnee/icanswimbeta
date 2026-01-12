const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSwimmerAirtableIdsV2() {
  console.log('=== STEP 1.5: IMPROVED SWIMMER MATCHING USING UUID CSV ===\n');

  // Read the CSV with UUIDs
  console.log('Reading Clients CSV with UUIDs...');
  const csvContent = fs.readFileSync('/Users/sydnee/Documents/Clients-All data all fields  with supabase uuid.csv', 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, bom: true });
  console.log(`Airtable records with UUIDs: ${records.length}`);

  // Get all swimmers
  console.log('Fetching Supabase swimmers...');
  const { data: swimmers, error } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name, date_of_birth, parent_email, airtable_record_id');

  if (error) throw new Error(`Fetch error: ${error.message}`);
  console.log(`Supabase swimmers: ${swimmers.length}\n`);

  // Build lookup maps
  const bySupabaseId = new Map(); // Map Supabase ID to swimmer
  const byAirtableId = new Map(); // Map Airtable Record ID to swimmer
  const byNameDob = new Map();
  const byNameEmail = new Map();
  const byName = new Map();

  for (const s of swimmers) {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase().trim().replace(/\s+/g, ' ');
    const dob = s.date_of_birth;
    const email = s.parent_email?.toLowerCase().trim();

    // Index by Supabase ID
    bySupabaseId.set(s.id, s);

    // Index by Airtable ID if exists
    if (s.airtable_record_id) {
      byAirtableId.set(s.airtable_record_id, s);
    }

    // Index by name combinations for fallback
    if (dob) {
      const key = `${name}|${dob}`;
      if (!byNameDob.has(key)) byNameDob.set(key, []);
      byNameDob.get(key).push(s);
    }
    if (email) {
      const key = `${name}|${email}`;
      if (!byNameEmail.has(key)) byNameEmail.set(key, []);
      byNameEmail.get(key).push(s);
    }
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(s);
  }

  let updatedByUuid = 0, updatedByAirtableId = 0, updatedByName = 0;
  let alreadySet = 0, notFound = [], ambiguous = [];
  let hasSupabaseId = 0, hasAirtableId = 0;

  for (const record of records) {
    const clientName = record['Client Name']?.trim();
    const airtableId = record['Record ID']?.trim();
    const supabaseId = record['Supabase ID']?.trim();
    const email = record['Email']?.toLowerCase().trim();
    const birthday = record['Birthday'];

    if (!clientName || !airtableId) continue;

    // Count records with IDs
    if (supabaseId) hasSupabaseId++;
    if (airtableId) hasAirtableId++;

    let matches = [];
    let matchMethod = '';

    // Method 1: Direct Supabase ID match (most reliable)
    if (supabaseId && bySupabaseId.has(supabaseId)) {
      matches = [bySupabaseId.get(supabaseId)];
      matchMethod = 'supabase_id';
    }
    // Method 2: Airtable ID match
    else if (airtableId && byAirtableId.has(airtableId)) {
      matches = [byAirtableId.get(airtableId)];
      matchMethod = 'airtable_id';
    }
    // Method 3: Name + DOB match
    else if (birthday) {
      const normalizedBirthday = parseDate(birthday);
      const name = normalizeName(clientName);
      if (normalizedBirthday && byNameDob.has(`${name}|${normalizedBirthday}`)) {
        matches = byNameDob.get(`${name}|${normalizedBirthday}`);
        matchMethod = 'name_dob';
      }
    }
    // Method 4: Name + Email match
    else if (email) {
      const name = normalizeName(clientName);
      if (byNameEmail.has(`${name}|${email}`)) {
        matches = byNameEmail.get(`${name}|${email}`);
        matchMethod = 'name_email';
      }
    }
    // Method 5: Name only match (with improved normalization)
    else {
      const name = normalizeName(clientName);
      if (byName.has(name)) {
        matches = byName.get(name);
        matchMethod = 'name_only';
      }
    }

    if (matches.length === 0) {
      notFound.push({
        name: clientName,
        airtableId,
        supabaseId: supabaseId || 'N/A',
        email: email || 'N/A'
      });
      continue;
    }

    // Check for already set
    const exactMatch = matches.find(m => m.airtable_record_id === airtableId);
    if (exactMatch) {
      alreadySet++;
      continue;
    }

    const unset = matches.filter(m => !m.airtable_record_id);
    if (unset.length === 0) {
      ambiguous.push({
        name: clientName,
        reason: 'All have different airtable_id',
        matchMethod
      });
      continue;
    }
    if (unset.length > 1) {
      ambiguous.push({
        name: clientName,
        reason: `${unset.length} matches, can't determine which`,
        matchMethod
      });
      continue;
    }

    // Update single match
    const { error: updateError } = await supabase
      .from('swimmers')
      .update({ airtable_record_id: airtableId })
      .eq('id', unset[0].id);

    if (updateError) {
      console.error(`Error updating ${clientName}: ${updateError.message}`);
    } else {
      switch (matchMethod) {
        case 'supabase_id': updatedByUuid++; break;
        case 'airtable_id': updatedByAirtableId++; break;
        default: updatedByName++; break;
      }

      if ((updatedByUuid + updatedByAirtableId + updatedByName) % 100 === 0) {
        console.log(`Progress: ${updatedByUuid + updatedByAirtableId + updatedByName} updated...`);
      }
    }
  }

  console.log('\n=== STEP 1.5 RESULTS ===');
  console.log(`📊 CSV Statistics:`);
  console.log(`   Records with Supabase ID: ${hasSupabaseId}/${records.length} (${((hasSupabaseId/records.length)*100).toFixed(1)}%)`);
  console.log(`   Records with Airtable ID: ${hasAirtableId}/${records.length} (100%)`);

  console.log(`\n✅ Matching Results:`);
  console.log(`   Updated by Supabase ID: ${updatedByUuid}`);
  console.log(`   Updated by Airtable ID: ${updatedByAirtableId}`);
  console.log(`   Updated by name match: ${updatedByName}`);
  console.log(`   Total updated: ${updatedByUuid + updatedByAirtableId + updatedByName}`);
  console.log(`   ⏭️  Already set: ${alreadySet}`);
  console.log(`   ❌ Not found: ${notFound.length}`);
  console.log(`   ⚠️  Ambiguous: ${ambiguous.length}`);

  // Save detailed report
  fs.writeFileSync('./scripts/step1_5_report.json', JSON.stringify({
    csvStats: {
      totalRecords: records.length,
      withSupabaseId: hasSupabaseId,
      withAirtableId: hasAirtableId
    },
    matchingResults: {
      updatedByUuid,
      updatedByAirtableId,
      updatedByName,
      totalUpdated: updatedByUuid + updatedByAirtableId + updatedByName,
      alreadySet,
      notFoundCount: notFound.length,
      ambiguousCount: ambiguous.length
    },
    notFound: notFound.slice(0, 100), // First 100 only
    ambiguous: ambiguous
  }, null, 2));

  // Verify final count
  const { count } = await supabase
    .from('swimmers')
    .select('*', { count: 'exact', head: true })
    .not('airtable_record_id', 'is', null);

  console.log(`\n✅ Final count - Swimmers with airtable_record_id: ${count}`);
  console.log(`   Percentage: ${((count / swimmers.length) * 100).toFixed(1)}%`);

  return {
    totalUpdated: updatedByUuid + updatedByAirtableId + updatedByName,
    notFound: notFound.length,
    finalCount: count
  };
}

// Helper functions
function normalizeName(name) {
  return name
    ?.toLowerCase()
    .trim()
    .replace(/\s*-\s*\[p\]\s*$/i, '')  // Remove "- [P]" suffix
    .replace(/\s*\[p\]\s*$/i, '')       // Remove "[P]" suffix
    .replace(/\s*\(p\)\s*$/i, '')       // Remove "(P)" suffix
    .replace(/\s*-\s*\(p\)\s*$/i, '')   // Remove "- (P)" suffix
    .replace(/[^\w\s-]/g, '')           // Remove special chars except hyphen
    .replace(/\s+/g, ' ')               // Normalize spaces
    || '';
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  // Try MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
  }
  // Try other formats if needed
  return null;
}

updateSwimmerAirtableIdsV2()
  .then(result => {
    console.log('\nStep 1.5 complete!');
    console.log(`Updated ${result.totalUpdated} swimmers, ${result.notFound} not found.`);
    console.log(`Final count: ${result.finalCount} swimmers with airtable_record_id.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });