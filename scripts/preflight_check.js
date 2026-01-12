// Pre-flight check for assessment migration
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.migrate_assessments' });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase configuration');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.migrate_assessments');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runPreflightChecks() {
  console.log('=== ASSESSMENT MIGRATION PRE-FLIGHT CHECKS ===\n');

  try {
    // CHECK 1: Swimmers have airtable_record_id populated
    console.log('CHECK 1: Swimmers with airtable_record_id');

    // Get total swimmers count
    const { count: totalSwimmers, error: countError } = await supabase
      .from('swimmers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`Error getting total swimmers: ${countError.message}`);
    } else {
      console.log(`Total swimmers: ${totalSwimmers}`);
    }

    // Get swimmers with airtable_record_id
    const { data: swimmersWithId, error: withIdError } = await supabase
      .from('swimmers')
      .select('id')
      .not('airtable_record_id', 'is', null);

    if (withIdError) {
      console.error(`Error getting swimmers with airtable_record_id: ${withIdError.message}`);
    } else {
      console.log(`With airtable_record_id: ${swimmersWithId?.length || 0}`);
      console.log(`Missing airtable_record_id: ${totalSwimmers - (swimmersWithId?.length || 0)}`);
    }

    // CHECK 2: Sample swimmer record IDs
    console.log('\nCHECK 2: Sample swimmer records with airtable_record_id');
    const { data: check2, error: error2 } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, airtable_record_id')
      .not('airtable_record_id', 'is', null)
      .limit(5);

    if (error2) {
      console.error(`Error: ${error2.message}`);
    } else {
      console.log('Sample swimmers:');
      check2.forEach((swimmer, i) => {
        console.log(`${i + 1}. ${swimmer.first_name} ${swimmer.last_name}: ${swimmer.airtable_record_id}`);
      });
    }

    // CHECK 3: Assessment_reports table count
    console.log('\nCHECK 3: Current assessment_reports count');
    const { count: assessmentCount, error: error3 } = await supabase
      .from('assessment_reports')
      .select('*', { count: 'exact', head: true });

    if (error3) {
      console.error(`Error: ${error3.message}`);
    } else {
      console.log(`Current assessment_reports count: ${assessmentCount}`);
    }

    // CHECK 4: Required columns exist
    console.log('\nCHECK 4: assessment_reports table structure');

    // Try to get a single record to see structure
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('assessment_reports')
      .select('*')
      .limit(1);

    if (sampleError) {
      if (sampleError.code === 'PGRST116') {
        console.log('Table is empty - cannot determine structure from data');
        console.log('Assuming default structure from migration files');

        // Check if we can insert a test record to see structure
        console.log('Trying to insert test record to check structure...');
        try {
          // First check if we have any swimmers
          const { data: testSwimmer } = await supabase
            .from('swimmers')
            .select('id')
            .limit(1)
            .single();

          if (testSwimmer) {
            const testRecord = {
              swimmer_id: testSwimmer.id,
              instructor_id: process.env.ADMIN_USER_ID,
              assessment_date: new Date().toISOString().split('T')[0],
              strengths: 'Test strengths',
              challenges: 'Test challenges',
              swim_skills: {},
              roadblocks: {},
              approval_status: 'approved',
              created_by: process.env.ADMIN_USER_ID
            };

            // Try to insert with minimal required fields
            const { error: insertError } = await supabase
              .from('assessment_reports')
              .insert(testRecord);

            if (insertError) {
              console.log(`Insert test failed (shows schema): ${insertError.message}`);
              // Parse error to understand missing columns
              if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
                console.log('This suggests missing columns in the table');
              }
            } else {
              console.log('Test record inserted successfully - basic structure exists');
              // Clean up test record
              await supabase
                .from('assessment_reports')
                .delete()
                .eq('strengths', 'Test strengths');
            }
          }
        } catch (testError) {
          console.log(`Test insertion error: ${testError.message}`);
        }
      } else {
        console.error(`Error accessing table: ${sampleError.message}`);
      }
    } else if (sampleRecord && sampleRecord.length > 0) {
      console.log('Sample record keys:', Object.keys(sampleRecord[0]));

      // Check for required columns
      const requiredColumns = ['instructor_name', 'goals', 'pos_data', 'airtable_record_id'];
      const existingColumns = Object.keys(sampleRecord[0]);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log(`\n⚠️  Missing columns: ${missingColumns.join(', ')}`);
        console.log('Run: npm run migrate:assessments:setup');
      } else {
        console.log('\n✅ All required columns exist');
      }
    } else {
      console.log('Table exists but is empty');
    }

    // CHECK 5: Test swimmer lookup with sample from CSV
    console.log('\nCHECK 5: Test swimmer lookup with sample CSV record');

    // Sample from CSV: Samantha Reed-Vega with Record ID "recagNaOhRLFqLavD"
    const testRecordId = 'recagNaOhRLFqLavD';
    const { data: check5, error: error5 } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, airtable_record_id')
      .eq('airtable_record_id', testRecordId)
      .single();

    if (error5) {
      if (error5.code === 'PGRST116') {
        console.log(`❌ Swimmer not found for Airtable ID: ${testRecordId}`);
        console.log('This suggests swimmers may not have airtable_record_id populated correctly');
      } else {
        console.error(`Error: ${error5.message}`);
      }
    } else {
      console.log(`✅ Found swimmer: ${check5.first_name} ${check5.last_name}`);
      console.log(`   Supabase ID: ${check5.id}`);
      console.log(`   Airtable ID: ${check5.airtable_record_id}`);
    }

    // Additional check: Count CSV records
    console.log('\nCHECK 6: CSV file record count');
    const fs = require('fs');
    const csv = require('csv-parser');
    const csvPath = process.env.CSV_FILE_PATH || './scripts/Initial_Assessment_Reports-Grid_view.csv';

    if (fs.existsSync(csvPath)) {
      const records = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on('data', (row) => records.push(row))
          .on('end', () => resolve())
          .on('error', (error) => reject(error));
      });
      console.log(`CSV records: ${records.length}`);

      // Show first few record IDs
      console.log('Sample CSV record IDs:');
      records.slice(0, 3).forEach((row, i) => {
        const recordId = row['Record ID (from Client Name)'] || row['Record ID'];
        const clientName = row['Client Name'] || 'Unknown';
        console.log(`${i + 1}. ${clientName}: ${recordId}`);
      });
    } else {
      console.log(`❌ CSV file not found at: ${csvPath}`);
    }

    console.log('\n=== PRE-FLIGHT CHECKS COMPLETE ===');

  } catch (error) {
    console.error('Fatal error during pre-flight checks:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runPreflightChecks().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { runPreflightChecks };