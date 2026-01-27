// Test script to check for specific fields in Airtable
const Airtable = require('airtable');

// Load environment variables
require('dotenv').config({ path: '.env.migration' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'appOj1YUOWN581EgB';
const AIRTABLE_TABLE_ID = 'tblVSz8xjvVLdtgCr';

async function testFields() {
  console.log('Testing for specific fields in Airtable...');

  if (!AIRTABLE_API_KEY) {
    console.error('AIRTABLE_API_KEY not found in .env.migration');
    process.exit(1);
  }

  try {
    const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    // Try to fetch records without specifying a view to get all fields
    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({
        maxRecords: 10
      })
      .firstPage();

    console.log(`Found ${records.length} records`);

    // Look for specific fields mentioned by user
    const targetFields = [
      'Start Date',
      'End Date',
      'Supabase ID (from Client)',
      'Instructor',
      'Booking Status',
      'Session Type',
      'Record ID'
    ];

    // Also track all field names we find
    const allFieldNames = new Set();

    records.forEach((record, i) => {
      console.log(`\nRecord ${i + 1} (ID: ${record.id}):`);

      // Add all field names to set
      Object.keys(record.fields).forEach(field => allFieldNames.add(field));

      // Check for target fields
      targetFields.forEach(field => {
        if (record.fields[field] !== undefined) {
          console.log(`  ${field}:`, record.fields[field]);
        }
      });

      // Also show any other fields that might be relevant
      const otherFields = Object.keys(record.fields).filter(f =>
        !targetFields.includes(f) &&
        (f.toLowerCase().includes('date') ||
         f.toLowerCase().includes('status') ||
         f.toLowerCase().includes('instructor') ||
         f.toLowerCase().includes('type') ||
         f.toLowerCase().includes('time'))
      );

      if (otherFields.length > 0) {
        console.log('  Other relevant fields:');
        otherFields.forEach(field => {
          const value = record.fields[field];
          console.log(`    ${field}:`, typeof value === 'object' ? JSON.stringify(value).substring(0, 100) + '...' : value);
        });
      }
    });

    // Show all unique field names found
    console.log('\n\nAll unique field names found:');
    const sortedFields = Array.from(allFieldNames).sort();
    sortedFields.forEach((field, i) => {
      console.log(`${i + 1}. ${field}`);
    });

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testFields();