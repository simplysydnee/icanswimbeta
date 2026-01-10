// Test migration with a single record
const { createClient } = require('@supabase/supabase-js');
const Airtable = require('airtable');

// Load environment variables
require('dotenv').config({ path: '.env.migration' });

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'appa5hlX697VP1FSo';
const AIRTABLE_TABLE_ID = 'tblXfCVX2NaUuXbYm';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize clients
const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
  console.log('🔍 Testing connections...');

  // Test Airtable connection
  try {
    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({ maxRecords: 1 })
      .firstPage();

    console.log('✅ Airtable connection successful');
    console.log(`   Found ${records.length} record(s)`);

    if (records.length > 0) {
      const record = records[0];
      console.log(`   Sample record: ${record.fields['Client Name'] || 'Unnamed'}`);
    }
  } catch (error) {
    console.error('❌ Airtable connection failed:', error.message);
    return false;
  }

  // Test Supabase connection
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');

    // Test swimmers table
    const { error: swimmersError } = await supabase
      .from('swimmers')
      .select('count')
      .limit(1);

    if (swimmersError) {
      console.error('❌ Swimmers table check failed:', swimmersError.message);
      console.log('   Make sure the swimmers table exists with the correct schema');
      return false;
    }

    console.log('✅ Swimmers table exists');

  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }

  return true;
}

async function testSingleMigration() {
  console.log('\n🧪 Testing single record migration...');

  try {
    // Get a single "Actively Enrolled ✅" client
    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({
        filterByFormula: "FIND('Actively Enrolled ✅', {Status}) > 0",
        maxRecords: 1
      })
      .firstPage();

    if (records.length === 0) {
      console.log('❌ No actively enrolled clients found');
      return false;
    }

    const testRecord = records[0];
    console.log(`   Test client: ${testRecord.fields['Client Name']}`);

    // Import migration functions
    const migration = require('./airtable_migration.js');

    // Test parseClientName
    const nameResult = migration.parseClientName(testRecord.fields['Client Name'] || '');
    console.log(`   Name parsed: ${nameResult.firstName} ${nameResult.lastName}`);
    console.log(`   Private pay marker: ${nameResult.isPrivatePay}`);

    // Test determineFundingSource
    const fundingSource = migration.determineFundingSource(testRecord, nameResult.isPrivatePay);
    console.log(`   Funding source: ${fundingSource}`);

    // Test getOrCreateParentProfile (just check, don't create)
    console.log('   Parent email:', testRecord.fields['Email'] || 'No email');

    // Check if parent profile exists
    if (testRecord.fields['Email']) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', testRecord.fields['Email'])
        .single();

      if (existingProfile) {
        console.log(`   Parent profile exists: ${existingProfile.id}`);
      } else {
        console.log('   Parent profile does not exist (will be created during migration)');
      }
    }

    console.log('\n✅ Test completed successfully');
    console.log('   The migration script is ready to run.');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('🚀 Migration Test Suite');
  console.log('======================\n');

  const connectionsOk = await testConnection();
  if (!connectionsOk) {
    console.log('\n❌ Connection tests failed. Please check your configuration.');
    process.exit(1);
  }

  const migrationOk = await testSingleMigration();
  if (!migrationOk) {
    console.log('\n❌ Migration test failed.');
    process.exit(1);
  }

  console.log('\n🎉 All tests passed!');
  console.log('\nNext steps:');
  console.log('1. Run the full migration: node run_migration.js');
  console.log('2. Or run directly: node airtable_migration.js');
}

// Run test
runTest().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});