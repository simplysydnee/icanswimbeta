// Test script to verify Airtable access
const Airtable = require('airtable');

// Load environment variables
require('dotenv').config({ path: '.env.migration' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'appOj1YUOWN581EgB';
const AIRTABLE_TABLE_ID = 'tblVSz8xjvVLdtgCr';

async function testAccess() {
  console.log('Testing Airtable access...');
  console.log('API Key present:', !!AIRTABLE_API_KEY);
  console.log('Base ID:', AIRTABLE_BASE_ID);
  console.log('Table ID:', AIRTABLE_TABLE_ID);

  if (!AIRTABLE_API_KEY) {
    console.error('AIRTABLE_API_KEY not found in .env.migration');
    process.exit(1);
  }

  try {
    const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    // Try to get table info
    console.log('\nAttempting to fetch table info...');

    // Try to list tables first to see what we have access to
    // Note: The Airtable JS SDK doesn't have a direct listTables method
    // We'll try to fetch a single record instead

    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({
        maxRecords: 1,
        view: 'viw7LtozW36rmtXZf'
      })
      .firstPage();

    console.log(`Success! Found ${records.length} record(s)`);

    if (records.length > 0) {
      const record = records[0];
      console.log('\nSample record fields:');
      console.log('Record ID:', record.id);
      console.log('Fields:', Object.keys(record.fields));

      // Show some key fields if they exist
      const sampleFields = ['Date', 'Swimmer', 'Instructor', 'Status', 'Record ID'];
      sampleFields.forEach(field => {
        if (record.fields[field] !== undefined) {
          console.log(`${field}:`, record.fields[field]);
        }
      });
    }

    console.log('\n✅ Airtable access test successful!');

  } catch (error) {
    console.error('\n❌ Airtable access test failed:');
    console.error('Error:', error.message);

    if (error.error && error.error.type) {
      console.error('Error type:', error.error.type);
      console.error('Error message:', error.error.message);
    }

    process.exit(1);
  }
}

testAccess();