#!/usr/bin/env node

// fix_created_dates.js
// Backfill original created_at dates from Airtable to Supabase
// For accurate waitlist time calculations

const { createClient } = require('@supabase/supabase-js');
const Airtable = require('airtable');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables from .env.migrate_all_clients
require('dotenv').config({ path: '.env.migrate_all_clients' });

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appa5hlX697VP1FSo';
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID || 'tblXfCVX2NaUuXbYm';
const AIRTABLE_VIEW_ID = process.env.AIRTABLE_VIEW_ID || 'viwKm0ev03MhrSyCc';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Migration settings
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 100;
const DELAY_BETWEEN_BATCHES_MS = parseInt(process.env.DELAY_BETWEEN_BATCHES_MS) || 2000;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
const RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY_MS) || 1000;

// File paths for logging and state
const ERROR_LOG_PATH = 'created_dates_error_log.txt';
const STATE_LOG_PATH = 'created_dates_state.json';

// Initialize clients
const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Statistics
const stats = {
  totalRecords: 0,
  totalProcessed: 0,
  totalUpdated: 0,
  errors: 0,
  skipped: 0,
  startTime: null,
  endTime: null,
  earliestDate: null,
  latestDate: null,
  errorDetails: []
};

// State management for resuming
let migrationState = {
  lastProcessedId: null,
  processedIds: new Set(),
  currentBatch: 0
};

async function logError(error, clientRecord) {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    clientId: clientRecord.id,
    clientName: clientRecord.fields['Client Name'] || 'Unknown',
    supabaseId: clientRecord.fields['Supabase ID'] || 'Unknown',
    error: error.message,
    stack: error.stack
  };

  stats.errorDetails.push(errorEntry);

  // Append to error log file
  const logLine = `${errorEntry.timestamp} - ${errorEntry.clientName} (Airtable: ${errorEntry.clientId}, Supabase: ${errorEntry.supabaseId}): ${errorEntry.error}\n`;
  try {
    await fs.appendFile(ERROR_LOG_PATH, logLine);
  } catch (logError) {
    console.error('Failed to write to error log:', logError.message);
  }
}

async function saveMigrationState() {
  try {
    const state = {
      lastProcessedId: migrationState.lastProcessedId,
      processedIds: Array.from(migrationState.processedIds),
      currentBatch: migrationState.currentBatch,
      stats: stats
    };
    await fs.writeFile(STATE_LOG_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save migration state:', error.message);
  }
}

async function loadMigrationState() {
  try {
    const data = await fs.readFile(STATE_LOG_PATH, 'utf8');
    const state = JSON.parse(data);
    migrationState.lastProcessedId = state.lastProcessedId;
    migrationState.processedIds = new Set(state.processedIds);
    migrationState.currentBatch = state.currentBatch;

    // Merge stats
    Object.assign(stats, state.stats);

    console.log(`Loaded migration state: ${migrationState.processedIds.size} records already processed`);
    return true;
  } catch (error) {
    // File doesn't exist or is invalid - start fresh
    return false;
  }
}

async function updateCreatedDateWithRetry(clientRecord, retryCount = 0) {
  try {
    // Skip if already processed in this session
    if (migrationState.processedIds.has(clientRecord.id)) {
      console.log(`Skipping already processed: ${clientRecord.fields['Client Name']}`);
      stats.skipped++;
      return;
    }

    const clientName = clientRecord.fields['Client Name'] || 'Unknown';
    const supabaseId = clientRecord.fields['Supabase ID'];
    const recordCreated = clientRecord.fields['Record Created'];

    // Validate required fields
    if (!supabaseId) {
      console.warn(`Skipping ${clientName}: No Supabase ID found`);
      stats.skipped++;
      migrationState.processedIds.add(clientRecord.id);
      return;
    }

    if (!recordCreated) {
      console.warn(`Skipping ${clientName}: No Record Created date found`);
      stats.skipped++;
      migrationState.processedIds.add(clientRecord.id);
      return;
    }

    console.log(`Processing: ${clientName} (Supabase ID: ${supabaseId})`);

    // Parse the date from Airtable
    let createdDate;
    if (typeof recordCreated === 'string') {
      createdDate = new Date(recordCreated);
    } else if (recordCreated instanceof Date) {
      createdDate = recordCreated;
    } else {
      throw new Error(`Invalid date format: ${typeof recordCreated}`);
    }

    // Validate the date
    if (isNaN(createdDate.getTime())) {
      throw new Error(`Invalid date: ${recordCreated}`);
    }

    // Format for Supabase (ISO string)
    const isoDate = createdDate.toISOString();

    // Update stats for earliest/latest dates
    if (!stats.earliestDate || createdDate < new Date(stats.earliestDate)) {
      stats.earliestDate = isoDate;
    }
    if (!stats.latestDate || createdDate > new Date(stats.latestDate)) {
      stats.latestDate = isoDate;
    }

    // Update Supabase
    const { error: updateError } = await supabase
      .from('swimmers')
      .update({ created_at: isoDate })
      .eq('id', supabaseId);

    if (updateError) {
      throw new Error(`Supabase update failed: ${updateError.message}`);
    }

    // Update state
    migrationState.lastProcessedId = clientRecord.id;
    migrationState.processedIds.add(clientRecord.id);
    stats.totalUpdated++;

    console.log(`✓ Updated: ${clientName} (created_at: ${isoDate})`);

  } catch (error) {
    stats.errors++;
    await logError(error, clientRecord);

    console.error(`✗ Error updating ${clientRecord.fields['Client Name'] || 'Unknown'}: ${error.message}`);

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying (${retryCount + 1}/${MAX_RETRIES}) after ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return updateCreatedDateWithRetry(clientRecord, retryCount + 1);
    }
  }

  stats.totalProcessed++;
}

async function runMigration() {
  console.log('==========================================');
  console.log('Backfill Created Dates from Airtable to Supabase');
  console.log('==========================================');
  console.log(`Start time: ${new Date().toISOString()}`);
  console.log('');

  // Check environment variables
  if (!AIRTABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables:');
    console.error('- AIRTABLE_API_KEY:', AIRTABLE_API_KEY ? 'Set' : 'Missing');
    console.error('- SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    console.error('\nPlease ensure .env.migrate_all_clients is properly configured');
    process.exit(1);
  }

  // Load previous state if exists
  const hasState = await loadMigrationState();
  if (hasState) {
    console.log('Resuming from previous migration state...');
  }

  stats.startTime = new Date();

  try {
    // Fetch all clients where "Supabase Migrated" = true
    console.log('Fetching migrated clients from Airtable...');

    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({
        view: AIRTABLE_VIEW_ID,
        filterByFormula: '{Supabase Migrated} = TRUE()',
        fields: ['Client Name', 'Supabase ID', 'Record Created']
      })
      .all();

    stats.totalRecords = records.length;
    console.log(`Found ${records.length} migrated clients`);

    if (records.length === 0) {
      console.log('No migrated clients found. Nothing to update.');
      return;
    }

    // Process in batches
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);

    for (let batchIndex = migrationState.currentBatch; batchIndex < totalBatches; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, records.length);
      const batch = records.slice(startIdx, endIdx);

      console.log(`\nProcessing batch ${batchIndex + 1}/${totalBatches} (records ${startIdx + 1}-${endIdx})...`);

      migrationState.currentBatch = batchIndex;

      // Process each client in the batch
      for (const record of batch) {
        await updateCreatedDateWithRetry(record);
      }

      // Save state after each batch
      await saveMigrationState();

      // Report progress
      const progressPercent = Math.round((stats.totalProcessed / records.length) * 100);
      console.log(`\nProgress: ${stats.totalProcessed}/${records.length} (${progressPercent}%)`);
      console.log(`  Successfully updated: ${stats.totalUpdated}`);
      console.log(`  Skipped: ${stats.skipped}`);
      console.log(`  Errors: ${stats.errors}`);

      // Small delay between batches to avoid rate limiting
      if (batchIndex + 1 < totalBatches) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES_MS}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
      }
    }

    // Final report
    stats.endTime = new Date();
    const durationMs = stats.endTime - stats.startTime;
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationSeconds = Math.floor((durationMs % 60000) / 1000);

    console.log('\n==========================================');
    console.log('CREATED DATES BACKFILL COMPLETE');
    console.log('==========================================');
    console.log(`Total time: ${durationMinutes}m ${durationSeconds}s`);
    console.log(`Total records: ${stats.totalRecords}`);
    console.log(`Successfully updated: ${stats.totalUpdated}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.earliestDate) {
      console.log(`Earliest created_at date: ${stats.earliestDate}`);
    }
    if (stats.latestDate) {
      console.log(`Latest created_at date: ${stats.latestDate}`);
    }

    if (stats.errors > 0) {
      console.log(`\nError details saved to: ${ERROR_LOG_PATH}`);
      console.log('First 5 errors:');
      stats.errorDetails.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. ${error.clientName}: ${error.error}`);
      });
      if (stats.errorDetails.length > 5) {
        console.log(`... and ${stats.errorDetails.length - 5} more errors`);
      }
    }

    // Clean up state file on successful completion
    try {
      await fs.unlink(STATE_LOG_PATH);
      console.log(`\nState file ${STATE_LOG_PATH} cleaned up`);
    } catch (error) {
      // Ignore if file doesn't exist
    }

  } catch (error) {
    console.error('Migration failed:', error);

    // Save state before exiting
    await saveMigrationState();
    console.log(`\nMigration state saved to ${STATE_LOG_PATH}. You can resume later.`);

    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n\nMigration interrupted by user. Saving state...');
  await saveMigrationState();
  console.log(`Migration state saved to ${STATE_LOG_PATH}. You can resume later.`);
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nMigration terminated. Saving state...');
  await saveMigrationState();
  console.log(`Migration state saved to ${STATE_LOG_PATH}. You can resume later.`);
  process.exit(0);
});

// Run migration if script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  updateCreatedDateWithRetry,
  runMigration,
  stats
};