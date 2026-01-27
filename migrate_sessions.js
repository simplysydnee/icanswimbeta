// Airtable to Supabase Session Migration Script
// Migrates "Individual Sessions" from Airtable to Supabase sessions and bookings tables

const { createClient } = require('@supabase/supabase-js');
const Airtable = require('airtable');

// Load environment variables
require('dotenv').config({ path: '.env.migration' });

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'appOj1YUOWN581EgB'; // Provided by user
const AIRTABLE_TABLE_ID = 'tblVSz8xjvVLdtgCr'; // Individual Sessions table from URL
const AIRTABLE_VIEW_ID = 'viw7LtozW36rmtXZf'; // From URL

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Instructor mapping from requirements
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
  'Brooke': null // Need UUID for Brooke
};

// Status mapping from requirements
const STATUS_MAPPING = {
  'Attended': 'completed',
  'Booked': 'confirmed',
  'Confirmed': 'confirmed',
  'Cancelled': 'cancelled',
  'No-Show': 'no_show'
};

// Initialize clients
let airtable;
let supabase;

// Migration statistics
const stats = {
  totalProcessed: 0,
  totalSessionsCreated: 0,
  totalBookingsCreated: 0,
  errors: 0,
  errorDetails: [],
  skippedAlreadyImported: 0,
  skippedOpenStatus: 0,
  skippedFloatingNoSwimmer: 0
};

// Helper function to map Airtable booking status to Supabase session and booking statuses
function mapStatuses(airtableBookingStatus) {
  const status = airtableBookingStatus || '';

  // Default mappings based on user requirements
  const mappings = {
    'Attended': { session: 'completed', booking: 'completed' },
    'Booked': { session: 'booked', booking: 'confirmed' },
    'Confirmed': { session: 'booked', booking: 'confirmed' },
    'Cancel': { session: 'cancelled', booking: 'cancelled' },
    'Cancel single session': { session: 'cancelled', booking: 'cancelled' },
    'Cancel all': { session: 'cancelled', booking: 'cancelled' },
    'No-Show': { session: 'completed', booking: 'no_show' },
    'Closed': { session: 'completed', booking: 'completed' },
    'Open': { session: 'available', booking: null }, // No booking needed
    'Floating': { session: 'available', booking: 'confirmed' }
  };

  return mappings[status] || { session: 'booked', booking: 'confirmed' }; // Default
}

// Helper function to map instructor name to UUID
function mapInstructor(airtableInstructor, airtableInstructorFromGroup) {
  // Try primary instructor field first
  let instructorName = airtableInstructor;

  // If no primary instructor, try instructor from session group
  if (!instructorName && airtableInstructorFromGroup) {
    if (Array.isArray(airtableInstructorFromGroup) && airtableInstructorFromGroup.length > 0) {
      instructorName = airtableInstructorFromGroup[0];
    } else if (typeof airtableInstructorFromGroup === 'string') {
      instructorName = airtableInstructorFromGroup;
    }
  }

  if (!instructorName) return null;

  // Handle array of instructor names
  if (Array.isArray(instructorName)) {
    instructorName = instructorName[0];
  }

  // Map instructor name to UUID
  return INSTRUCTOR_MAPPING[instructorName] || null;
}

// Helper function to map session type
function mapSessionType(airtableSessionType) {
  if (!airtableSessionType) return 'lesson';

  const type = airtableSessionType.toLowerCase();
  if (type.includes('assessment')) {
    return 'assessment';
  }
  return 'lesson'; // Default to lesson
}

// Helper function to get swimmer ID from Supabase ID field
function getSwimmerId(supabaseIdField) {
  if (!supabaseIdField) return null;

  if (Array.isArray(supabaseIdField)) {
    // Take the first swimmer ID if multiple
    return supabaseIdField[0];
  }

  return supabaseIdField;
}

// Check if record already imported
async function checkAlreadyImported(airtableRecordId) {
  if (!airtableRecordId) return false;

  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('airtable_record_id', airtableRecordId)
    .limit(1);

  if (error) {
    console.error(`Error checking for existing record: ${error.message}`);
    return false;
  }

  return data && data.length > 0;
}

// Create session record
async function createSession(airtableRecord) {
  try {
    const airtableRecordId = airtableRecord.fields['Record ID'] || airtableRecord.id;

    // Check if already imported
    const alreadyImported = await checkAlreadyImported(airtableRecordId);
    if (alreadyImported) {
      stats.skippedAlreadyImported++;
      console.log(`⏭️ Skipping already imported: ${airtableRecordId}`);
      return null;
    }

    // Get booking status and check if we should skip
    const bookingStatus = airtableRecord.fields['Booking Status'];
    const statuses = mapStatuses(bookingStatus);

    // Skip records with status "Open" (no booking needed)
    if (bookingStatus === 'Open') {
      stats.skippedOpenStatus++;
      console.log(`⏭️ Skipping Open status: ${airtableRecordId}`);
      return null;
    }

    // Get start and end dates
    const startDate = airtableRecord.fields['Start Date'];
    const endDate = airtableRecord.fields['End Date'];

    if (!startDate) {
      throw new Error('Start Date field is required');
    }

    // Parse dates
    const startTime = new Date(startDate);
    const endTime = endDate ? new Date(endDate) : new Date(startTime.getTime() + 30 * 60 * 1000);

    if (isNaN(startTime.getTime())) {
      throw new Error(`Invalid Start Date format: ${startDate}`);
    }

    // Map instructor
    const instructorField = airtableRecord.fields['Instructor'];
    const instructorFromGroupField = airtableRecord.fields['Instructor (from Session Group)'];
    const instructor_id = mapInstructor(instructorField, instructorFromGroupField);

    // Map session type
    const sessionTypeField = airtableRecord.fields['Session Type'];
    const session_type = mapSessionType(sessionTypeField);

    // Create session data
    const sessionData = {
      instructor_id: instructor_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      day_of_week: startTime.getDay(), // 0 = Sunday, 1 = Monday, etc.
      location: 'Modesto', // From requirements
      session_type: session_type,
      status: statuses.session,
      max_capacity: 1, // Individual sessions
      booking_count: statuses.booking ? 1 : 0, // One booking if booking status exists
      is_full: true, // Individual sessions are always full
      price_cents: 9644, // From requirements
      airtable_record_id: airtableRecordId,
      created_at: new Date().toISOString()
    };

    // Insert session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select('id')
      .single();

    if (sessionError) {
      throw new Error(`Error creating session: ${sessionError.message}`);
    }

    stats.totalSessionsCreated++;
    return { id: session.id, needsBooking: !!statuses.booking, bookingStatus: statuses.booking };

  } catch (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
}

// Create booking record
async function createBooking(sessionId, airtableRecord, bookingStatus) {
  try {
    // Get swimmer UUID from Supabase ID field
    const supabaseIdField = airtableRecord.fields['Supabase ID (from Client)'];
    const swimmer_id = getSwimmerId(supabaseIdField);

    if (!swimmer_id) {
      // Check if this is a floating session (has swimmer in status field)
      const clientStatusField = airtableRecord.fields['Status (from Client)'];
      if (clientStatusField && Array.isArray(clientStatusField) && clientStatusField.includes('Floating')) {
        console.log(`⚠️ Floating session without swimmer ID: ${airtableRecord.fields['Record ID']}`);
        stats.skippedFloatingNoSwimmer++;
        return null;
      }
      throw new Error('Swimmer ID is required for booking');
    }

    // Create booking data
    const bookingData = {
      session_id: sessionId,
      swimmer_id: swimmer_id,
      parent_id: null, // Will be populated later from swimmer.parent_id
      status: bookingStatus,
      created_at: new Date().toISOString()
    };

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select('id')
      .single();

    if (bookingError) {
      throw new Error(`Error creating booking: ${bookingError.message}`);
    }

    stats.totalBookingsCreated++;
    return booking.id;

  } catch (error) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }
}

// Update booking with parent_id
async function updateBookingWithParent(bookingId, swimmerId) {
  try {
    // Get swimmer to find parent_id
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .select('parent_id')
      .eq('id', swimmerId)
      .single();

    if (swimmerError) {
      console.warn(`Could not find parent for swimmer ${swimmerId}: ${swimmerError.message}`);
      return;
    }

    if (swimmer && swimmer.parent_id) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ parent_id: swimmer.parent_id })
        .eq('id', bookingId);

      if (updateError) {
        console.warn(`Could not update booking with parent: ${updateError.message}`);
      }
    }
  } catch (error) {
    console.warn(`Error updating booking with parent: ${error.message}`);
  }
}

// Migrate a single Airtable record
async function migrateSession(airtableRecord) {
  const airtableRecordId = airtableRecord.fields['Record ID'] || airtableRecord.id;

  try {
    console.log(`Processing: ${airtableRecordId}`);

    // Create session
    const sessionResult = await createSession(airtableRecord);
    if (!sessionResult) {
      // Already imported, Open status, or failed
      stats.totalProcessed++;
      return;
    }

    const { id: sessionId, needsBooking, bookingStatus } = sessionResult;

    // Create booking if needed
    let bookingId = null;
    if (needsBooking && bookingStatus) {
      bookingId = await createBooking(sessionId, airtableRecord, bookingStatus);

      // Update booking with parent_id (async, don't wait)
      const supabaseIdField = airtableRecord.fields['Supabase ID (from Client)'];
      const swimmerId = getSwimmerId(supabaseIdField);
      if (swimmerId && bookingId) {
        updateBookingWithParent(bookingId, swimmerId).catch(() => {
          // Silently fail, parent update is not critical
        });
      }
    }

    console.log(`✓ Migrated: Session ${sessionId}${bookingId ? `, Booking ${bookingId}` : ''}`);

  } catch (error) {
    stats.errors++;
    stats.errorDetails.push({
      recordId: airtableRecordId,
      error: error.message
    });

    console.error(`✗ Error migrating record ${airtableRecordId}: ${error.message}`);
  }

  stats.totalProcessed++;
}

// Main migration function
async function runMigration() {
  console.log('Starting Airtable to Supabase session migration...');
  console.log('==================================================');

  // Check environment variables
  if (!AIRTABLE_API_KEY) {
    console.error('Missing AIRTABLE_API_KEY environment variable');
    console.error('Please set it in .env.migration file');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    console.error('Please set it in .env.migration file');
    process.exit(1);
  }

  // Initialize clients
  airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Fetch all records from Individual Sessions table
    console.log('Fetching sessions from Airtable...');

    const records = await airtable(AIRTABLE_TABLE_ID)
      .select({
        view: AIRTABLE_VIEW_ID
      })
      .all();

    console.log(`Found ${records.length} sessions in Airtable`);

    // Check existing imported records
    console.log('Checking for already imported records...');
    const { data: existingRecords, error: existingError } = await supabase
      .from('sessions')
      .select('airtable_record_id')
      .not('airtable_record_id', 'is', null);

    if (existingError) {
      console.error(`Error checking existing records: ${existingError.message}`);
    } else {
      console.log(`Found ${existingRecords?.length || 0} already imported records`);
    }

    // Process in batches of 50 to avoid rate limiting
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} (records ${i+1}-${Math.min(i+batchSize, records.length)})...`);

      // Process each session in the batch
      for (const record of batch) {
        await migrateSession(record);
      }

      // Report progress
      console.log(`\nProgress: ${stats.totalProcessed}/${records.length} processed`);
      console.log(`  Sessions created: ${stats.totalSessionsCreated}`);
      console.log(`  Bookings created: ${stats.totalBookingsCreated}`);
      console.log(`  Skipped (already imported): ${stats.skippedAlreadyImported}`);
      console.log(`  Skipped (Open status): ${stats.skippedOpenStatus}`);
      console.log(`  Skipped (Floating no swimmer): ${stats.skippedFloatingNoSwimmer}`);
      console.log(`  Errors: ${stats.errors}`);

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < records.length) {
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

// Run migration if script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  mapStatuses,
  mapInstructor,
  mapSessionType,
  getSwimmerId,
  checkAlreadyImported,
  createSession,
  createBooking,
  migrateSession,
  runMigration,
  stats
};