#!/usr/bin/env node

// fix_swimmer_status.js
// Fix enrollment status mapping from Airtable to Supabase

const { createClient } = require('@supabase/supabase-js');
const Airtable = require('airtable');
require('dotenv').config({ path: '.env.migrate_all_clients' });

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appa5hlX697VP1FSo';
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID || 'tblXfCVX2NaUuXbYm';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize clients
const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Status mapping from Airtable to Supabase
const STATUS_MAPPING = {
  // Airtable Status → Supabase enrollment_status
  'Actively Enrolled ✅': 'enrolled',
  'Waitlist ⏳': 'waitlist',
  'Dropped ⚠️': 'dropped',
  'Pending Parent Enrollment 📝': 'pending',
  'Enrollment Expired ⛔️': 'expired',
  'Declined 🚫': 'declined',
  'Pending VMRC Referral 📣': 'pending_referral',
  'Pending Approval 🔔': 'pending_approval',
  // Fallbacks for any variations
  'Actively Enrolled': 'enrolled',
  'Waitlist': 'waitlist',
  'Dropped': 'dropped',
  'Pending Parent Enrollment': 'pending',
  'Enrollment Expired': 'expired',
  'Declined': 'declined',
  'Pending VMRC Referral': 'pending_referral',
  'Pending Approval': 'pending_approval'
};

// Default status if no mapping found
const DEFAULT_STATUS = 'pending';

function mapAirtableStatus(airtableStatus) {
  // Handle non-string values
  if (!airtableStatus) return DEFAULT_STATUS;

  const statusString = String(airtableStatus).trim();
  if (!statusString) return DEFAULT_STATUS;

  // Try exact match first
  if (STATUS_MAPPING[statusString]) {
    return STATUS_MAPPING[statusString];
  }

  // Try case-insensitive match
  const lowerStatus = statusString.toLowerCase();
  for (const [key, value] of Object.entries(STATUS_MAPPING)) {
    if (key.toLowerCase() === lowerStatus) {
      return value;
    }
  }

  // Try partial match
  for (const [key, value] of Object.entries(STATUS_MAPPING)) {
    const cleanKey = key.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
    const cleanStatus = statusString.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
    if (cleanStatus.includes(cleanKey) || cleanKey.includes(cleanStatus)) {
      return value;
    }
  }

  console.warn(`No mapping found for status: "${statusString}". Using default: "${DEFAULT_STATUS}"`);
  return DEFAULT_STATUS;
}

async function fixSwimmerStatuses() {
  console.log('==========================================');
  console.log('Fix Swimmer Enrollment Status Mapping');
  console.log('==========================================');
  console.log(`Start time: ${new Date().toISOString()}`);
  console.log('');

  // Check environment variables
  if (!AIRTABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables');
    console.error('Please ensure .env.migrate_all_clients is properly configured');
    process.exit(1);
  }

  try {
    // Fetch all migrated records from Airtable
    console.log('Fetching migrated records from Airtable...');
    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({
        filterByFormula: '{Supabase Migrated} = TRUE()',
        fields: ['Client Name', 'Status', 'Supabase ID']
      })
      .all();

    console.log(`Found ${records.length} migrated records in Airtable`);

    if (records.length === 0) {
      console.log('No migrated records found. Nothing to fix.');
      return;
    }

    // Track statistics
    const stats = {
      totalRecords: records.length,
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      statusCounts: {},
      mappingCounts: {}
    };

    // Process in batches to avoid rate limiting
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, records.length);
      const batch = records.slice(startIdx, endIdx);

      console.log(`\nProcessing batch ${batchIndex + 1}/${totalBatches} (records ${startIdx + 1}-${endIdx})...`);

      // Process each record in the batch
      for (const record of batch) {
        try {
          const clientName = record.fields['Client Name'] || 'Unknown';
          const airtableStatus = record.fields['Status'] || '';
          const supabaseId = record.fields['Supabase ID'];

          if (!supabaseId) {
            console.warn(`Skipping ${clientName}: No Supabase ID found`);
            stats.skipped++;
            continue;
          }

          // Map Airtable status to Supabase status
          const supabaseStatus = mapAirtableStatus(airtableStatus);

          // Track mapping
          const mappingKey = `${airtableStatus} → ${supabaseStatus}`;
          stats.mappingCounts[mappingKey] = (stats.mappingCounts[mappingKey] || 0) + 1;

          // Update swimmer in Supabase
          const { error } = await supabase
            .from('swimmers')
            .update({ enrollment_status: supabaseStatus })
            .eq('id', supabaseId);

          if (error) {
            console.error(`Error updating ${clientName} (${supabaseId}): ${error.message}`);
            stats.errors++;
          } else {
            stats.updated++;
            stats.statusCounts[supabaseStatus] = (stats.statusCounts[supabaseStatus] || 0) + 1;

            if (stats.updated % 10 === 0) {
              process.stdout.write('.');
            }
          }

          stats.processed++;

        } catch (error) {
          console.error(`Error processing record: ${error.message}`);
          stats.errors++;
          stats.processed++;
        }
      }

      // Report batch progress
      const progressPercent = Math.round((stats.processed / records.length) * 100);
      console.log(`\nBatch ${batchIndex + 1} complete: ${progressPercent}% overall`);
      console.log(`  Updated: ${stats.updated}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);

      // Small delay between batches
      if (batchIndex + 1 < totalBatches) {
        console.log('Waiting 1 second before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Final report
    console.log('\n==========================================');
    console.log('STATUS FIX COMPLETE');
    console.log('==========================================');
    console.log(`Total records processed: ${stats.processed}`);
    console.log(`Successfully updated: ${stats.updated}`);
    console.log(`Skipped (no Supabase ID): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    console.log('\nFinal status distribution:');
    Object.entries(stats.statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\nStatus mappings used:');
    Object.entries(stats.mappingCounts).forEach(([mapping, count]) => {
      console.log(`  ${mapping}: ${count}`);
    });

    // Verify the fix by checking Supabase
    console.log('\nVerifying fix in Supabase...');
    const { data: verificationData, error: verificationError } = await supabase
      .from('swimmers')
      .select('enrollment_status')
      .not('enrollment_status', 'is', null);

    if (verificationError) {
      console.error('Verification error:', verificationError.message);
    } else {
      const verificationCounts = {};
      verificationData.forEach(row => {
        verificationCounts[row.enrollment_status] = (verificationCounts[row.enrollment_status] || 0) + 1;
      });

      console.log('\nVerified status distribution in Supabase:');
      Object.entries(verificationCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      console.log(`Total swimmers in Supabase: ${verificationData.length}`);
    }

  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nFix interrupted by user.');
  process.exit(0);
});

// Run fix if script is executed directly
if (require.main === module) {
  fixSwimmerStatuses();
}

module.exports = {
  mapAirtableStatus,
  fixSwimmerStatuses,
  STATUS_MAPPING
};