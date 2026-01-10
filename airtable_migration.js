// Airtable to Supabase Migration Script
// Migrates "Actively Enrolled ✅" clients from Airtable to Supabase

const { createClient } = require('@supabase/supabase-js');
const Airtable = require('airtable');

// Load environment variables
require('dotenv').config({ path: '.env.migration' });

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'appa5hlX697VP1FSo';
const AIRTABLE_TABLE_ID = 'tblXfCVX2NaUuXbYm';
const AIRTABLE_VIEW_ID = 'viwKm0ev03MhrSyCc';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize clients
const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Migration statistics
const stats = {
  totalProcessed: 0,
  totalMigrated: 0,
  newParentsCreated: 0,
  existingParentsLinked: 0,
  errors: 0,
  errorDetails: []
};

// Helper functions
function parseClientName(fullName) {
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
  const parentName = clientRecord.fields['Parent Name'] || '';
  const parentPhone = clientRecord.fields['Phone Number'] || '';

  if (!parentEmail) {
    throw new Error('No email provided for parent');
  }

  // Check if profile exists
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', parentEmail)
    .single();

  if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Error checking for existing profile: ${selectError.message}`);
  }

  if (existingProfile) {
    stats.existingParentsLinked++;
    return existingProfile.id;
  }

  // Create new profile
  // Note: We need to create auth user first, but for migration we'll create profile directly
  // This assumes the profile table doesn't require auth.users reference for migration
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      email: parentEmail,
      full_name: parentName,
      phone: parentPhone
    })
    .select('id')
    .single();

  if (insertError) {
    throw new Error(`Error creating parent profile: ${insertError.message}`);
  }

  stats.newParentsCreated++;
  return newProfile.id;
}

function mapAirtableToSwimmer(clientRecord, parentId, fundingSource) {
  const { firstName, lastName, isPrivatePay } = parseClientName(clientRecord.fields['Client Name'] || '');

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
    behavior_plan_description: clientRecord.fields['behavior plan describe'] || null,
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
    created_by: null, // Will be set to admin user ID
    approved_by: null, // Will be set to admin user ID
    approved_at: new Date().toISOString()
  };
}

async function migrateClient(clientRecord) {
  try {
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
      'Migration Notes': `Success - ${stats.newParentsCreated > 0 ? 'new parent created' : 'linked to existing parent'}`
    });

    stats.totalMigrated++;
    console.log(`✓ Migrated: ${clientRecord.fields['Client Name']} (ID: ${swimmer.id})`);

  } catch (error) {
    stats.errors++;
    stats.errorDetails.push({
      clientName: clientRecord.fields['Client Name'],
      error: error.message
    });

    // Update Airtable with error
    await airtable(AIRTABLE_TABLE_ID).update(clientRecord.id, {
      'Migration Notes': `Error: ${error.message}`
    });

    console.error(`✗ Error migrating ${clientRecord.fields['Client Name']}: ${error.message}`);
  }

  stats.totalProcessed++;
}

async function runMigration() {
  console.log('Starting Airtable to Supabase migration...');
  console.log('==========================================');

  // Check environment variables
  if (!AIRTABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables:');
    console.error('- AIRTABLE_API_KEY:', AIRTABLE_API_KEY ? 'Set' : 'Missing');
    console.error('- SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    process.exit(1);
  }

  try {
    // Fetch all "Actively Enrolled ✅" clients
    console.log('Fetching actively enrolled clients from Airtable...');

    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({
        view: AIRTABLE_VIEW_ID,
        filterByFormula: "FIND('Actively Enrolled ✅', {Status}) > 0"
      })
      .all();

    console.log(`Found ${records.length} actively enrolled clients`);

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} (records ${i+1}-${Math.min(i+batchSize, records.length)})...`);

      // Process each client in the batch
      for (const record of batch) {
        await migrateClient(record);
      }

      // Report progress
      console.log(`\nProgress: ${stats.totalProcessed}/${records.length} processed`);
      console.log(`  Successfully migrated: ${stats.totalMigrated}`);
      console.log(`  New parents created: ${stats.newParentsCreated}`);
      console.log(`  Linked to existing parents: ${stats.existingParentsLinked}`);
      console.log(`  Errors: ${stats.errors}`);

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < records.length) {
        console.log('Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Final report
    console.log('\n==========================================');
    console.log('MIGRATION COMPLETE');
    console.log('==========================================');
    console.log(`Total clients processed: ${stats.totalProcessed}`);
    console.log(`Successfully migrated: ${stats.totalMigrated}`);
    console.log(`New parent profiles created: ${stats.newParentsCreated}`);
    console.log(`Linked to existing parents: ${stats.existingParentsLinked}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.errors > 0) {
      console.log('\nError details:');
      stats.errorDetails.forEach((error, index) => {
        console.log(`${index + 1}. ${error.clientName}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  parseClientName,
  determineFundingSource,
  getOrCreateParentProfile,
  mapAirtableToSwimmer,
  migrateClient,
  runMigration,
  stats
};