// Test the simple migration script with a small batch
const { createClient } = require('@supabase/supabase-js');
const Airtable = require('airtable');

// Load environment variables
require('dotenv').config({ path: '.env.migration' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'appOj1YUOWN581EgB';
const AIRTABLE_TABLE_ID = 'tblVSz8xjvVLdtgCr';
const SUPABASE_URL = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testSmallBatch() {
  console.log('Testing migration with small batch...');
  console.log('====================================');

  if (!AIRTABLE_API_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables');
    process.exit(1);
  }

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
    // Check existing records
    const { data: existingRecords } = await supabase
      .from('sessions')
      .select('airtable_record_id')
      .not('airtable_record_id', 'is', null);

    const existingRecordIds = new Set(existingRecords?.map(r => r.airtable_record_id) || []);
    console.log(`Found ${existingRecordIds.size} already imported records`);

    // Fetch 10 records for testing
    console.log('\nFetching 10 records from Airtable...');
    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({
        maxRecords: 10
      })
      .firstPage();

    console.log(`Found ${records.length} records for testing`);

    // Process each record
    for (const record of records) {
      await processRecord(record, supabase, existingRecordIds, stats);
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
    console.log(`Skipped (swimmer not found): ${stats.skippedSwimmerNotFound}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.errors > 0) {
      console.log('\nError details:');
      stats.errorDetails.forEach((error, index) => {
        console.log(`${index + 1}. Record ${error.recordId}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Copy the processRecord function from migrate_sessions_simple.js
async function processRecord(record, supabase, existingRecordIds, stats) {
  const airtableRecordId = record.fields['Record ID'] || record.id;

  try {
    // Check if already imported
    if (existingRecordIds.has(airtableRecordId)) {
      stats.skippedAlreadyImported++;
      stats.totalProcessed++;
      console.log(`⏭️ Skipping already imported: ${airtableRecordId}`);
      return;
    }

    // Get booking status
    const bookingStatus = record.fields['Booking Status'];
    const statuses = mapStatuses(bookingStatus);

    // Skip Open status
    if (bookingStatus === 'Open') {
      stats.skippedOpenStatus++;
      stats.totalProcessed++;
      console.log(`⏭️ Skipping Open status: ${airtableRecordId}`);
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

    console.log(`Creating session for ${airtableRecordId}...`);
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
          console.log(`⚠️ Floating session without swimmer ID: ${airtableRecordId}`);
        } else {
          throw new Error('Swimmer ID is required for booking');
        }
      } else {
        // Check if swimmer exists in Supabase
        console.log(`Checking if swimmer exists: ${swimmer_id}`);
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

          console.log(`Creating booking for session ${session.id}...`);
          const { error: bookingError } = await supabase
            .from('bookings')
            .insert(bookingData);

          if (bookingError) {
            throw new Error(`Error creating booking: ${bookingError.message}`);
          }

          stats.totalBookingsCreated++;
          console.log(`✓ Created booking for session ${session.id}`);
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

// Helper functions
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

  const INSTRUCTOR_MAPPING = {
    'Jennifer': '0e7e65a7-38e2-4ef6-9539-856c5ac97705',
    'Sutton': 'd751c62a-89de-4c02-aed5-622271364023',
    'Lauren': '2aborla7-4161-4f75-8f64-36b2dbda955e',
    'Desiree': 'd00a5d05-e9c1-43fb-a4f5-b96110a57638',
    'Stephanie': '05b81ac8-30d8-4e6f-b0a4-e27ea7167322',
    'Megan': 'a6bba22f-9206-4077-b2e0-ce439bee02df',
    'Alyah': '9d3e3c41-98e8-4e34-a98d-074152ab24fb',
    'Lina': 'b0ed3080-9e5d-4717-86c8-5fd8d7b07ace',
    'Jada': '54852087-6c28-4085-8f66-b6686bbdcdef',
    'Alexis': 'a03c22bb-7ca8-48b2-b99e-e6fc1d8eec81',
    'Brooke': null
  };

  return INSTRUCTOR_MAPPING[instructorName] || null;
}

function getSwimmerId(supabaseIdField) {
  if (!supabaseIdField) return null;
  if (Array.isArray(supabaseIdField)) return supabaseIdField[0];
  return supabaseIdField;
}

// Run test
testSmallBatch();