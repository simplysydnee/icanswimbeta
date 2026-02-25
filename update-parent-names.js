// Script to update parent names in Supabase from Airtable
// This script reads from Airtable and updates Supabase swimmers table

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Supabase credentials not found in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mock Airtable data for testing - in reality, you would use the Airtable API
// For now, let me create a test with a few records

const testUpdates = [
  {
    supabaseId: '68f20b9b-2cb2-4052-98c9-d83def6bbca6', // Sawyer Bennett
    parentName: 'T Ash5' // From Airtable
  },
  {
    supabaseId: '5580f5ed-fdea-48e7-a330-f15289616737', // Messiah Hughes
    parentName: 'Jake Hughes' // Example - would be from Airtable
  },
  {
    supabaseId: '65e494b2-b463-4116-9fff-6de9cf58e628', // Julian Ayala
    parentName: 'Cristina Rodriguez' // Example - would be from Airtable
  }
];

async function updateParentNames() {
  console.log('Starting parent name updates...');

  let successCount = 0;
  let errorCount = 0;

  for (const update of testUpdates) {
    try {
      console.log(`\nUpdating swimmer ${update.supabaseId} with parent name: "${update.parentName}"`);

      const { data, error } = await supabase
        .from('swimmers')
        .update({ parent_name: update.parentName })
        .eq('id', update.supabaseId)
        .select('id, first_name, last_name, parent_name')
        .single();

      if (error) {
        console.error(`Error updating ${update.supabaseId}:`, error.message);
        errorCount++;
      } else {
        console.log(`Successfully updated: ${data.first_name} ${data.last_name}`);
        console.log(`Old parent name: ${data.parent_name}`);
        console.log(`New parent name: ${update.parentName}`);
        successCount++;
      }
    } catch (err) {
      console.error(`Unexpected error for ${update.supabaseId}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Successfully updated: ${successCount} records`);
  console.log(`Errors: ${errorCount} records`);

  if (errorCount > 0) {
    console.log('\nNote: Some records failed to update. Check the errors above.');
  }
}

// Run the update
updateParentNames().catch(console.error);