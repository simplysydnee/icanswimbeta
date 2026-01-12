const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Default instructor ID (found from profiles table)
const DEFAULT_INSTRUCTOR_ID = '35679b22-9ff6-4930-bff7-c9d42a633f8f';

async function importAssessments() {
  console.log('=== SIMPLE ASSESSMENT IMPORT ===\n');

  // Step 1: Build lookup from Clients CSV (Airtable Record ID → Supabase UUID)
  console.log('Building lookup from Clients CSV...');
  const clientsCsv = fs.readFileSync('/Users/sydnee/Documents/Clients-All data all fields  with supabase uuid.csv', 'utf-8');
  const clients = parse(clientsCsv, { columns: true, skip_empty_lines: true, bom: true });

  const lookup = new Map(); // Airtable Record ID → Supabase UUID
  for (const client of clients) {
    const airtableId = client['Record ID']?.trim();
    const supabaseId = client['Supabase ID']?.trim();
    if (airtableId && supabaseId) {
      lookup.set(airtableId, supabaseId);
    }
  }
  console.log(`Lookup built: ${lookup.size} clients with Supabase IDs\n`);

  // Step 2: Read Assessments CSV
  console.log('Reading Assessments CSV...');
  const assessmentsCsv = fs.readFileSync('/Users/sydnee/Documents/Initial assessment reports-Grid view.csv', 'utf-8');
  const assessments = parse(assessmentsCsv, { columns: true, skip_empty_lines: true, bom: true });
  console.log(`Assessments to import: ${assessments.length}\n`);

  // Debug: Show first row column names
  if (assessments.length > 0) {
    console.log('First row column names:');
    console.log(Object.keys(assessments[0]));
    console.log('First row sample data:');
    console.log(JSON.stringify(assessments[0], null, 2).slice(0, 500) + '...');
    console.log('');
  }

  // Step 3: Import each assessment
  let created = 0, noMatch = [], errors = [], skipped = 0;

  for (const row of assessments) {
    const airtableClientId = row['Record ID (from Client Name)']?.trim();
    const clientName = row['Client Name']?.trim();

    // Skip rows without required data
    if (!airtableClientId || !clientName) {
      skipped++;
      continue;
    }

    const swimmerId = lookup.get(airtableClientId);

    if (!swimmerId) {
      noMatch.push({ name: clientName, airtableId: airtableClientId });
      continue;
    }

    // Build assessment record matching table schema
    const record = {
      swimmer_id: swimmerId,
      assessment_date: parseDate(row['Date of assessment']),
      instructor_id: DEFAULT_INSTRUCTOR_ID, // Use default instructor
      strengths: row["Description of Swimmer's Strengths "] || '',
      challenges: row["Description of Swimmer's Challenges or Concerns"] || '',
      swim_skills: buildSwimSkills(row),
      roadblocks: buildRoadblocks(row),
      swim_skills_goals: row['Goal(s) for Swim Skills'] || null,
      safety_goals: row['Goal(s) for Safety'] || null,
      approval_status: 'approved' // Default to approved since these are historical
    };

    const { error } = await supabase.from('assessment_reports').insert(record);

    if (error) {
      if (error.code === '23505') { // Duplicate
        continue;
      }
      errors.push({ name: row['Client Name'], error: error.message });
    } else {
      created++;
      if (created % 50 === 0) console.log(`Progress: ${created} created...`);
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(`✅ Created: ${created}`);
  console.log(`⏭️  Skipped (no data): ${skipped}`);
  console.log(`❌ No Supabase ID: ${noMatch.length}`);
  console.log(`🔴 Errors: ${errors.length}`);

  if (noMatch.length > 0) {
    console.log('\nFirst 10 without Supabase ID:');
    noMatch.slice(0, 10).forEach(n => console.log(`  ${n.name} (${n.airtableId})`));
  }

  if (errors.length > 0) {
    console.log('\nFirst 10 errors:');
    errors.slice(0, 10).forEach(e => console.log(`  ${e.name}: ${e.error}`));
  }

  // Update swimmer assessment_status
  console.log('\nUpdating swimmer assessment_status...');
  const { data: imported } = await supabase.from('assessment_reports').select('swimmer_id');
  const swimmerIds = [...new Set(imported.map(a => a.swimmer_id))];

  for (const id of swimmerIds) {
    await supabase.from('swimmers').update({ assessment_status: 'completed' }).eq('id', id);
  }
  console.log(`Updated ${swimmerIds.length} swimmers to assessment_status='completed'`);
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d) ? null : d.toISOString().split('T')[0];
}

function buildSwimSkills(row) {
  return {
    walks_in_water: row['Walks in water'] || null,
    front_float: row['Front Float'] || null,
    back_float: row['Back float'] || null,
    blowing_bubbles: row['Blowing bubbles'] || null,
    submerging: row['Submerging'] || null,
    jumping_in: row['Jumping in'] || null,
    front_crawl: row['Front crawl/freestyle'] || null,
    back_crawl: row['Back crawl/freestyle copy'] || null,
    treading_water: row['Treading Water'] || null,
    enters_safely: row['Enters safely'] || null,
    exits_safely: row['Exits safely'] || null
    // Add more as needed
  };
}

function buildRoadblocks(row) {
  const result = {};
  const areas = [
    ['safety', 'Safety', 'Safety-Intervention/Teaching Strategy'],
    ['water_properties', 'Water properties', 'Water properties-Intervention/Teaching Strategy'],
    ['managing_submerging', 'Managing submerging', 'Managing submerging- Intervention/Teaching Strategy']
    // Add more as needed
  ];
  for (const [key, status, intervention] of areas) {
    if (row[status] || row[intervention]) {
      result[key] = { status: row[status], intervention: row[intervention] };
    }
  }
  return result;
}

importAssessments().catch(console.error);