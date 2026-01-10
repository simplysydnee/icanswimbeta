#!/usr/bin/env node

// migrate_all_clients.js
// Comprehensive Airtable to Supabase migration script for all clients
// Can be run independently and resumed if interrupted

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
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// Migration settings
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 50;
const DELAY_BETWEEN_BATCHES_MS = parseInt(process.env.DELAY_BETWEEN_BATCHES_MS) || 2000;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
const RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY_MS) || 1000;

// File paths for logging and state
const ERROR_LOG_PATH = 'migration_error_log.txt';
const STATE_LOG_PATH = 'migration_state.json';

// Initialize clients
const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Migration statistics
const stats = {
  totalRecords: 0,
  totalProcessed: 0,
  totalMigrated: 0,
  newParentsCreated: 0,
  existingParentsLinked: 0,
  errors: 0,
  skipped: 0,
  startTime: null,
  endTime: null,
  errorDetails: []
};

// State management for resuming
let migrationState = {
  lastProcessedId: null,
  processedIds: new Set(),
  currentBatch: 0
};

// Helper functions
function parseClientName(fullName) {
  if (!fullName) return { firstName: '', lastName: '', isPrivatePay: false };

  // Remove (P) or [P] markers for private pay
  const privatePayMarker = fullName.match(/[(\[]P[)\]]/);
  const isPrivatePay = !!privatePayMarker;

  // Clean name
  let cleanName = fullName.replace(/[(\[]P[)\]]/g, '').trim();

  // Split into first and last name
  const nameParts = cleanName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return { firstName, lastName, isPrivatePay };
}

function determineFundingSource(clientRecord, isPrivatePay) {
  if (isPrivatePay) {
    return 'private_pay';
  }

  const vmrcEmail = clientRecord.fields['Email of VMRC Coordinator'] || '';
  const vmrcClient = clientRecord.fields['VMRC Client'] || '';

  if (vmrcEmail.toLowerCase().includes('vmrc') || vmrcClient === 'Yes' || vmrcClient === 'YES') {
    return 'vmrc';
  } else if (vmrcEmail.toLowerCase().includes('cvrc')) {
    return 'cvrc';
  }

  return 'private_pay';
}

async function getOrCreateParentProfile(clientRecord) {
  const parentEmail = clientRecord.fields['Email'] || '';

  if (!parentEmail) {
    // Return null instead of throwing error - we'll store email for auto-linking later
    return null;
  }

  // Check if profile exists
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', parentEmail)
    .single();

  if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
    // Log error but continue - we'll store email for auto-linking later
    console.warn(`Error checking for existing profile: ${selectError.message}`);
    return null;
  }

  if (existingProfile) {
    stats.existingParentsLinked++;
    return existingProfile.id;
  }

  // Don't create new profile - return null and store email for auto-linking
  // The auto-link trigger will link swimmers to parents when they sign up
  return null;
}

function mapAirtableToSwimmer(clientRecord, parentId, fundingSource) {
  const { firstName, lastName } = parseClientName(clientRecord.fields['Client Name'] || '');

  // Map diagnosis array
  const diagnosis = clientRecord.fields['Diagnosis'] || [];

  // Map swim goals array
  const swimGoals = clientRecord.fields['Swim goals'] || [];

  // Map communication type array
  const communicationType = clientRecord.fields['Type of communication'] || [];

  // Map availability array
  const availability = clientRecord.fields['What is your general availability for swim lessons?'] || [];

  // Parse boolean fields
  const hasAllergies = clientRecord.fields['Allergies'] || false;
  const hasMedicalConditions = clientRecord.fields['Medical Conditions '] || false;
  const historyOfSeizures = clientRecord.fields['History of Seizures'] === 'Yes';
  const nonAmbulatory = clientRecord.fields['non-ambulatory'] === 'Yes';
  const selfInjuriousBehavior = clientRecord.fields['Self Injurious Behavior\t'] === 'Yes';
  const aggressiveBehavior = clientRecord.fields['Aggressive Behavior'] === 'Yes';
  const elopementHistory = clientRecord.fields['Elopement History\t'] === 'Yes';
  const hasBehaviorPlan = clientRecord.fields['Safety/Behavior plan'] === 'Yes';
  const restraintHistory = clientRecord.fields['Restraint History'] === 'Yes';
  const previousSwimLessons = clientRecord.fields['Previous Swim Lessons'] === 'Yes';
  const otherTherapies = clientRecord.fields['Other Therapies'] === 'Yes';
  const isVmrcClient = fundingSource === 'vmrc';
  const signedWaiver = clientRecord.fields['Signed Waiver '] || false;

  // Parse comfortable in water
  let comfortableInWater = null;
  const comfortField = clientRecord.fields['Comfortable in Water'];
  if (comfortField === 'Yes') comfortableInWater = 'very';
  else if (comfortField === 'No') comfortableInWater = 'not_at_all';

  // Parse toilet trained
  let toiletTrained = null;
  const toiletField = clientRecord.fields['Toilet Trained?'];
  if (toiletField === 'Yes') toiletTrained = 'yes';
  else if (toiletField === 'No') toiletTrained = 'no';

  return {
    parent_id: parentId,
    parent_email: clientRecord.fields['Email'] || null,
    first_name: firstName,
    last_name: lastName,
    date_of_birth: clientRecord.fields['Birthday'] || null,
    gender: clientRecord.fields['Child\'s Gender'] || null,
    height: clientRecord.fields['Height'] || null,
    weight: clientRecord.fields['Weight'] || null,
    client_number: clientRecord.fields['Client ID']?.toString() || null,

    // Medical & Safety
    has_allergies: hasAllergies,
    allergies_description: clientRecord.fields['Allergies- Describe'] || null,
    has_medical_conditions: hasMedicalConditions,
    medical_conditions_description: clientRecord.fields['Medical-Describe'] || null,
    diagnosis: diagnosis.length > 0 ? diagnosis : null,
    history_of_seizures: historyOfSeizures,
    seizures_description: clientRecord.fields['History of Seizures'] === 'Yes' ? 'Yes' : null,
    toilet_trained: toiletTrained,
    non_ambulatory: nonAmbulatory,

    // Behavioral
    self_injurious_behavior: selfInjuriousBehavior,
    self_injurious_behavior_description: clientRecord.fields['Self Injurious Describe'] || null,
    aggressive_behavior: aggressiveBehavior,
    aggressive_behavior_description: clientRecord.fields['Aggressive Behavior Describe'] || null,
    elopement_history: elopementHistory,
    elopement_history_description: clientRecord.fields['Elopement Description\t'] || null,
    has_behavior_plan: hasBehaviorPlan,
    // Note: behavior_plan_description column doesn't exist in swimmers table
    // behavior_plan_description: clientRecord.fields['behavior plan describe'] || null,
    restraint_history: restraintHistory,
    restraint_history_description: clientRecord.fields['Restraint Description '] || null,

    // Swimming Background
    previous_swim_lessons: previousSwimLessons,
    comfortable_in_water: comfortableInWater,
    swim_goals: swimGoals.length > 0 ? swimGoals : null,
    strengths_interests: clientRecord.fields['Strengths/Interest'] || null,

    // Communication & Functional
    communication_type: communicationType.length > 0 ? communicationType : null,
    other_therapies: otherTherapies,
    therapies_description: clientRecord.fields['Therapies- Describe'] || null,

    // Scheduling
    availability: availability.length > 0 ? availability : null,
    preferred_start_date: clientRecord.fields['Start Date'] || null,
    client_booking_limit: clientRecord.fields['Client Booking Limit'] || 4,

    // Payment & VMRC
    payment_type: fundingSource,
    is_vmrc_client: isVmrcClient,
    vmrc_coordinator_name: clientRecord.fields['VMRC Coordinator'] || null,
    vmrc_coordinator_email: clientRecord.fields['Email of VMRC Coordinator'] || null,

    // Status
    enrollment_status: 'enrolled',
    assessment_status: 'not_scheduled',
    approval_status: 'approved',
    flexible_swimmer: clientRecord.fields['Attendance Standing'] === 'Floating',

    // Waivers & Agreements
    photo_video_permission: clientRecord.fields['Photo Release'] === 'Yes',
    signed_waiver: signedWaiver,

    // Admin tracking
    created_by: ADMIN_USER_ID || null,
    approved_by: ADMIN_USER_ID || null,
    approved_at: new Date().toISOString()
  };
}

async function logError(error, clientRecord) {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    clientId: clientRecord.id,
    clientName: clientRecord.fields['Client Name'] || 'Unknown',
    error: error.message,
    stack: error.stack
  };

  stats.errorDetails.push(errorEntry);

  // Append to error log file
  const logLine = `${errorEntry.timestamp} - ${errorEntry.clientName} (${errorEntry.clientId}): ${errorEntry.error}\n`;
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

async function migrateClientWithRetry(clientRecord, retryCount = 0) {
  try {
    // Skip if already processed in this session
    if (migrationState.processedIds.has(clientRecord.id)) {
      console.log(`Skipping already processed: ${clientRecord.fields['Client Name']}`);
      stats.skipped++;
      return;
    }

    // Skip if already migrated in Airtable
    if (clientRecord.fields['Supabase Migrated'] === true) {
      console.log(`Skipping already migrated: ${clientRecord.fields['Client Name']}`);
      stats.skipped++;
      migrationState.processedIds.add(clientRecord.id);
      return;
    }

    console.log(`Processing: ${clientRecord.fields['Client Name']}`);

    // Parse name and determine funding
    const { isPrivatePay } = parseClientName(clientRecord.fields['Client Name'] || '');
    const fundingSource = determineFundingSource(clientRecord, isPrivatePay);

    // Get or create parent profile
    const parentId = await getOrCreateParentProfile(clientRecord);

    // Map data to swimmer schema
    const swimmerData = mapAirtableToSwimmer(clientRecord, parentId, fundingSource);

    // Insert swimmer
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .insert(swimmerData)
      .select('id')
      .single();

    if (swimmerError) {
      throw new Error(`Error creating swimmer: ${swimmerError.message}`);
    }

    // Update Airtable with migration info
    await airtable(AIRTABLE_TABLE_ID).update(clientRecord.id, {
      'Supabase Migrated': true,
      'Supabase ID': swimmer.id,
      'Supabase Parent ID': parentId,
      'Migration Date': new Date().toISOString().split('T')[0],
      'Migration Notes': `Success - ${parentId ? 'linked to existing parent' : 'parent email stored for auto-linking'}`
    });

    // Update state
    migrationState.lastProcessedId = clientRecord.id;
    migrationState.processedIds.add(clientRecord.id);
    stats.totalMigrated++;

    console.log(`✓ Migrated: ${clientRecord.fields['Client Name']} (ID: ${swimmer.id})`);

  } catch (error) {
    stats.errors++;
    await logError(error, clientRecord);

    // Update Airtable with error
    try {
      await airtable(AIRTABLE_TABLE_ID).update(clientRecord.id, {
        'Migration Notes': `Error: ${error.message}`
      });
    } catch (updateError) {
      console.error(`Failed to update Airtable error status: ${updateError.message}`);
    }

    console.error(`✗ Error migrating ${clientRecord.fields['Client Name']}: ${error.message}`);

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying (${retryCount + 1}/${MAX_RETRIES}) after ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return migrateClientWithRetry(clientRecord, retryCount + 1);
    }
  }

  stats.totalProcessed++;
}

async function runMigration() {
  console.log('==========================================');
  console.log('Airtable to Supabase Migration - All Clients');
  console.log('==========================================');
  console.log(`Start time: ${new Date().toISOString()}`);
  console.log('');

  // Check environment variables
  if (!AIRTABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables:');
    console.error('- AIRTABLE_API_KEY:', AIRTABLE_API_KEY ? 'Set' : 'Missing');
    console.error('- SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    console.error('\nPlease copy .env.migrate_all_clients.example to .env.migrate_all_clients and fill in your values');
    process.exit(1);
  }

  // Load previous state if exists
  const hasState = await loadMigrationState();
  if (hasState) {
    console.log('Resuming from previous migration state...');
  }

  stats.startTime = new Date();

  try {
    // Fetch all clients where "Supabase Migrated" != true
    console.log('Fetching unmigrated clients from Airtable...');

    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({
        view: AIRTABLE_VIEW_ID,
        filterByFormula: 'NOT({Supabase Migrated} = TRUE())'
      })
      .all();

    stats.totalRecords = records.length;
    console.log(`Found ${records.length} unmigrated clients`);

    if (records.length === 0) {
      console.log('No unmigrated clients found. Migration complete!');
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
        await migrateClientWithRetry(record);
      }

      // Save state after each batch
      await saveMigrationState();

      // Report progress
      const progressPercent = Math.round((stats.totalProcessed / records.length) * 100);
      console.log(`\nProgress: ${stats.totalProcessed}/${records.length} (${progressPercent}%)`);
      console.log(`  Successfully migrated: ${stats.totalMigrated}`);
      console.log(`  Skipped (already migrated): ${stats.skipped}`);
      console.log(`  Linked to existing parents: ${stats.existingParentsLinked}`);
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
    console.log('MIGRATION COMPLETE');
    console.log('==========================================');
    console.log(`Total time: ${durationMinutes}m ${durationSeconds}s`);
    console.log(`Total records: ${stats.totalRecords}`);
    console.log(`Successfully migrated: ${stats.totalMigrated}`);
    console.log(`Skipped (already migrated): ${stats.skipped}`);
    console.log(`Linked to existing parents: ${stats.existingParentsLinked}`);
    console.log(`Errors: ${stats.errors}`);

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
  parseClientName,
  determineFundingSource,
  getOrCreateParentProfile,
  mapAirtableToSwimmer,
  migrateClientWithRetry,
  runMigration,
  stats
};