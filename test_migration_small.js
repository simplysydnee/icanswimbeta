// Test migration with a small batch
const { runMigration } = require('./migrate_sessions.js');

// Modify the runMigration function to only process a small batch
async function testSmallBatch() {
  console.log('Testing migration with small batch...');
  console.log('====================================');

  // Load environment variables
  require('dotenv').config({ path: '.env.migration' });

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check environment variables
  if (!AIRTABLE_API_KEY) {
    console.error('Missing AIRTABLE_API_KEY environment variable');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }

  const Airtable = require('airtable');
  const { createClient } = require('@supabase/supabase-js');

  const AIRTABLE_BASE_ID = 'appOj1YUOWN581EgB';
  const AIRTABLE_TABLE_ID = 'tblVSz8xjvVLdtgCr';
  const SUPABASE_URL = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';

  // Initialize clients
  const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Fetch only 5 records for testing
    console.log('Fetching 5 records from Airtable...');
    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({
        maxRecords: 5
      })
      .firstPage();

    console.log(`Found ${records.length} records for testing`);

    // Import the migrateSession function
    const { migrateSession, stats } = require('./migrate_sessions.js');

    // Process each record
    for (const record of records) {
      await migrateSession(record);
    }

    // Report results
    console.log('\n====================================');
    console.log('TEST COMPLETE');
    console.log('====================================');
    console.log(`Total records processed: ${stats.totalProcessed}`);
    console.log(`Sessions created: ${stats.totalSessionsCreated}`);
    console.log(`Bookings created: ${stats.totalBookingsCreated}`);
    console.log(`Skipped (already imported): ${stats.skippedAlreadyImported}`);
    console.log(`Skipped (Open status): ${stats.skippedOpenStatus}`);
    console.log(`Skipped (Floating no swimmer): ${stats.skippedFloatingNoSwimmer}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.errors > 0) {
      console.log('\nError details:');
      stats.errorDetails.forEach((error, index) => {
        console.log(`${index + 1}. Record ${error.recordId}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run test
testSmallBatch();