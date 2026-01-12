const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeName(name) {
  return name?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [month, day, year] = parts;
  return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
}

async function updateSwimmerAirtableIds() {
  console.log('=== STEP 1: UPDATE SWIMMER AIRTABLE IDs ===\n');

  // Read CSV
  console.log('Reading Clients CSV...');
  const csvContent = fs.readFileSync('./scripts/airtable_clients.csv', 'utf-8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, bom: true });
  console.log(`Airtable records: ${records.length}`);

  // Get all swimmers
  console.log('Fetching Supabase swimmers...');
  const { data: swimmers, error } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name, date_of_birth, parent_email, airtable_record_id');

  if (error) throw new Error(`Fetch error: ${error.message}`);
  console.log(`Supabase swimmers: ${swimmers.length}\n`);

  // Build lookup maps
  const byNameDob = new Map();
  const byNameEmail = new Map();
  const byName = new Map();

  for (const s of swimmers) {
    const name = normalizeName(`${s.first_name} ${s.last_name}`);
    const dob = s.date_of_birth;
    const email = s.parent_email?.toLowerCase().trim();

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

  let updated = 0, alreadySet = 0, notFound = [], ambiguous = [];

  for (const record of records) {
    const clientName = record['Client Name']?.trim();
    const airtableId = record['Record ID']?.trim();
    const email = record['Email']?.toLowerCase().trim();
    const birthday = parseDate(record['Birthday']);

    if (!clientName || !airtableId) continue;

    const name = normalizeName(clientName);
    let matches = [];

    // Try name+dob first
    if (birthday && byNameDob.has(`${name}|${birthday}`)) {
      matches = byNameDob.get(`${name}|${birthday}`);
    }
    // Try name+email
    else if (email && byNameEmail.has(`${name}|${email}`)) {
      matches = byNameEmail.get(`${name}|${email}`);
    }
    // Try name only
    else if (byName.has(name)) {
      matches = byName.get(name);
    }

    if (matches.length === 0) {
      notFound.push({ name: clientName, airtableId });
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
      ambiguous.push({ name: clientName, reason: 'All have different airtable_id' });
      continue;
    }
    if (unset.length > 1) {
      ambiguous.push({ name: clientName, reason: `${unset.length} matches, can't determine which` });
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
      updated++;
      if (updated % 100 === 0) console.log(`Progress: ${updated} updated...`);
    }
  }

  console.log('\n=== STEP 1 RESULTS ===');
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Already set: ${alreadySet}`);
  console.log(`❌ Not found: ${notFound.length}`);
  console.log(`⚠️  Ambiguous: ${ambiguous.length}`);

  // Save report
  fs.writeFileSync('./scripts/step1_report.json', JSON.stringify({
    updated, alreadySet, notFound, ambiguous
  }, null, 2));

  // Verify
  const { count } = await supabase
    .from('swimmers')
    .select('*', { count: 'exact', head: true })
    .not('airtable_record_id', 'is', null);

  console.log(`\n✅ Swimmers with airtable_record_id: ${count}`);

  return { updated, notFound: notFound.length };
}

updateSwimmerAirtableIds()
  .then(result => {
    console.log('\nStep 1 complete! Run Step 2 next.');
    process.exit(0);
  })
  .catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });