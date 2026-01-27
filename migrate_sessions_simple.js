// Simple Airtable to Supabase Session Migration Script
// Migrates "Individual Sessions" from Airtable to Supabase sessions and bookings tables

const { createClient } = require('@supabase/supabase-js');
const Airtable = require('airtable');

// Load environment variables
require('dotenv').config({ path: '.env.migration' });

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'appOj1YUOWN581EgB';
const AIRTABLE_TABLE_ID = 'tblVSz8xjvVLdtgCr';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Instructor mapping
const INSTRUCTOR_MAPPING = {
  'Lauren': '1a79854a-1d69-4a47-affc-82de7956511a',
  'Sutton': '00fbcc63-4fe9-4069-b03c-4476e2b26aa8',
  'Megan': '6ecfee52-a52e-4274-bbd8-b7c8360cb4a7',
  'Stephanie': 'af2c2885-ff59-4ccb-890f-3b09150c7876',
  'Brooke': '8f0a0731-3ded-4540-a982-c284334dfec2',
  'Jennifer': '5433b1ee-95cd-4887-bcac-c92ae26b26b4',
  'Desiree': 'b54af6c0-aa0e-4602-bd35-7848babb1196',
  'Alyah': 'bd9e85d8-8c37-45ee-9333-19ec30127118',
  'Jada': 'f4c0461c-6e2c-4c46-b663-0005535fe67f',
  'Alexis': 'b8e1ac20-451d-4f54-a13c-64331e3738fe',
  'Lina': '85db05a3-ef17-4bf3-ae31-1ca172cbc073'
};

// Status mapping
function mapStatuses(airtableBookingStatus) {
  const status = airtableBookingStatus || '';
  const mappings = {
    'Attended': { session: 'completed', booking: 'completed' },
    'Booked': { session: 'booked', booking: 'confirmed' },
    'Confirmed': { session: 'booked', booking: 'confirmed' },
    'Cancel': { session: 'cancelled', booking: 'cancelled' },
    'Cancel single session': { session: 'cancelled', booking: 'cancelled' },
    'Cancel all': { session: 'cancelled', booking: 'cancelled' },
    'No-Show': { session: 'completed', booking: 'no_show' },
    'Closed': { session: 'completed', booking: 'completed' },
    'Open': { session: 'available', booking: null },
    'Floating': { session: 'available', booking: 'confirmed' }
  };
  return mappings[status] || { session: 'booked', booking: 'confirmed' };
}

// Map instructor
function mapInstructor(airtableInstructor, airtableInstructorFromGroup) {
  let instructorName = airtableInstructor;
  if (!instructorName && airtableInstructorFromGroup) {
    if (Array.isArray(airtableInstructorFromGroup) && airtableInstructorFromGroup.length > 0) {
      instructorName = airtableInstructorFromGroup[0];
    } else if (typeof airtableInstructorFromGroup === 'string') {
      instructorName = airtableInstructorFromGroup;
    }
  }
  if (!instructorName) return null;
  if (Array.isArray(instructorName)) instructorName = instructorName[0];

  const uuid = INSTRUCTOR_MAPPING[instructorName];

  // Validate UUID format
  if (uuid && !isValidUUID(uuid)) {
    console.warn(`⚠️ Invalid UUID format for instructor ${instructorName}: ${uuid}`);
    return null;
  }

  return uuid || null;
}

// Helper function to validate UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Get swimmer ID
function getSwimmerId(supabaseIdField) {
  if (!supabaseIdField) return null;
  if (Array.isArray(supabaseIdField)) return supabaseIdField[0];
  return supabaseIdField;
}

async function runMigration() {
  console.log('Starting Airtable to Supabase session migration...');
  console.log('==================================================');

  // Check environment variables
  if (!AIRTABLE_API_KEY) {
    console.error('Missing AIRTABLE_API_KEY environment variable');
    process.exit(1);
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }

  // Initialize clients
  const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Statistics
  const stats = {
    totalProcessed: 0,
    totalSessionsCreated: 0,
    totalBookingsCreated: 0,
    errors: 0,
    errorDetails: [],
    skippedAlreadyImported: 0,
    skippedOpenStatus: 0,
    skippedFloatingNoSwimmer: 0,
    skippedSwimmerNotFound: 0
  };

  try {
    // Check existing imported records
    console.log('Checking existing imported records...');
    const { data: existingRecords, error: existingError } = await supabase
      .from('sessions')
      .select('airtable_record_id')
      .not('airtable_record_id', 'is', null);

    if (existingError) {
      console.error(`Error checking existing records: ${existingError.message}`);
    } else {
      console.log(`Found ${existingRecords?.length || 0} already imported records`);
    }

    const existingRecordIds = new Set(existingRecords?.map(r => r.airtable_record_id) || []);

    // Fetch all records from Airtable
    console.log('\nFetching sessions from Airtable...');
    let allRecords = [];

    // Use eachPage to fetch all records
    await new Promise((resolve, reject) => {
      airtable(AIRTABLE_TABLE_ID)
        .select()
        .eachPage(
          (page, next) => {
            allRecords = allRecords.concat(page);
            console.log(`Fetched ${allRecords.length} records so far...`);
            next();
          },
          (err) => {
            if (err) {
              reject(err);
            } else {
              console.log(`Fetched ${allRecords.length} records total`);
              resolve();
            }
          }
        );
    });

    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < allRecords.length; i += batchSize) {
      const batch = allRecords.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} (records ${i+1}-${Math.min(i+batchSize, allRecords.length)})...`);

      for (const record of batch) {
        await processRecord(record, supabase, existingRecordIds, stats);
      }

      // Report progress
      console.log(`\nProgress: ${stats.totalProcessed}/${allRecords.length} processed`);
      console.log(`  Sessions created: ${stats.totalSessionsCreated}`);
      console.log(`  Bookings created: ${stats.totalBookingsCreated}`);
      console.log(`  Skipped (already imported): ${stats.skippedAlreadyImported}`);
      console.log(`  Skipped (Open status): ${stats.skippedOpenStatus}`);
      console.log(`  Skipped (Floating no swimmer): ${stats.skippedFloatingNoSwimmer}`);
      console.log(`  Skipped (swimmer not found): ${stats.skippedSwimmerNotFound}`);
      console.log(`  Errors: ${stats.errors}`);

      // Delay between batches
      if (i + batchSize < allRecords.length) {
        console.log('Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Final report
    console.log('\n==================================================');
    console.log('MIGRATION COMPLETE');
    console.log('==================================================');
    console.log(`Total records processed: ${stats.totalProcessed}`);
    console.log(`Sessions created: ${stats.totalSessionsCreated}`);
    console.log(`Bookings created: ${stats.totalBookingsCreated}`);
    console.log(`Skipped (already imported): ${stats.skippedAlreadyImported}`);
    console.log(`Skipped (Open status): ${stats.skippedOpenStatus}`);
    console.log(`Skipped (Floating no swimmer): ${stats.skippedFloatingNoSwimmer}`);
    console.log(`Skipped (swimmer not found): ${stats.skippedSwimmerNotFound}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.errors > 0) {
      console.log('\nError details (first 10):');
      stats.errorDetails.slice(0, 10).forEach((error, index) => {
        console.log(`${index + 1}. Record ${error.recordId}: ${error.error}`);
      });
      if (stats.errorDetails.length > 10) {
        console.log(`... and ${stats.errorDetails.length - 10} more errors`);
      }
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

async function processRecord(record, supabase, existingRecordIds, stats) {
  const airtableRecordId = record.fields['Record ID'] || record.id;

  try {
    // Check if already imported
    if (existingRecordIds.has(airtableRecordId)) {
      stats.skippedAlreadyImported++;
      stats.totalProcessed++;
      return;
    }

    // Get booking status
    const bookingStatus = record.fields['Booking Status'];
    const statuses = mapStatuses(bookingStatus);

    // Skip Open status
    if (bookingStatus === 'Open') {
      stats.skippedOpenStatus++;
      stats.totalProcessed++;
      return;
    }

    // Get dates
    const startDate = record.fields['Start Date'];
    if (!startDate) {
      throw new Error('Start Date field is required');
    }

    const startTime = new Date(startDate);
    const endDate = record.fields['End Date'];
    const endTime = endDate ? new Date(endDate) : new Date(startTime.getTime() + 30 * 60 * 1000);

    if (isNaN(startTime.getTime())) {
      throw new Error(`Invalid Start Date: ${startDate}`);
    }

    // Map instructor
    const instructorField = record.fields['Instructor'];
    const instructorFromGroupField = record.fields['Instructor (from Session Group)'];
    const instructor_id = mapInstructor(instructorField, instructorFromGroupField);

    // Map session type
    const sessionTypeField = record.fields['Session Type'];
    const session_type = sessionTypeField && sessionTypeField.toLowerCase().includes('assessment') ? 'assessment' : 'lesson';

    // Create session
    const sessionData = {
      instructor_id: instructor_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      day_of_week: startTime.getDay(),
      location: 'Modesto',
      session_type: session_type,
      status: statuses.session,
      max_capacity: 1,
      booking_count: statuses.booking ? 1 : 0,
      is_full: true,
      price_cents: 9644,
      airtable_record_id: airtableRecordId,
      created_at: new Date().toISOString()
    };

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select('id')
      .single();

    if (sessionError) {
      throw new Error(`Error creating session: ${sessionError.message}`);
    }

    stats.totalSessionsCreated++;

    // Create booking if needed
    if (statuses.booking && statuses.booking !== 'cancelled') {
      const supabaseIdField = record.fields['Supabase ID (from Client)'];
      const swimmer_id = getSwimmerId(supabaseIdField);

      if (!swimmer_id) {
        // Check for floating session
        const clientStatusField = record.fields['Status (from Client)'];
        if (clientStatusField && Array.isArray(clientStatusField) && clientStatusField.includes('Floating')) {
          stats.skippedFloatingNoSwimmer++;
        } else {
          throw new Error('Swimmer ID is required for booking');
        }
      } else {
        // Check if swimmer exists in Supabase
        const { data: swimmer, error: swimmerError } = await supabase
          .from('swimmers')
          .select('id, parent_id')
          .eq('id', swimmer_id)
          .single();

        if (swimmerError || !swimmer) {
          stats.skippedSwimmerNotFound++;
          console.log(`⚠️ Swimmer not found, skipping: ${swimmer_id}`);
        } else {
          const bookingData = {
            session_id: session.id,
            swimmer_id: swimmer_id,
            parent_id: swimmer.parent_id || null,
            status: statuses.booking,
            created_at: new Date().toISOString()
          };

          const { error: bookingError } = await supabase
            .from('bookings')
            .insert(bookingData);

          if (bookingError) {
            throw new Error(`Error creating booking: ${bookingError.message}`);
          }

          stats.totalBookingsCreated++;
        }
      }
    }

    console.log(`✓ Migrated: ${airtableRecordId} (Session ${session.id})`);

  } catch (error) {
    stats.errors++;
    stats.errorDetails.push({
      recordId: airtableRecordId,
      error: error.message
    });
    console.error(`✗ Error migrating ${airtableRecordId}: ${error.message}`);
  }

  stats.totalProcessed++;
}

// Run migration if script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };