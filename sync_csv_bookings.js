// CSV Booking Sync Script
// Synchronizes historical booking data from Airtable CSV export with Supabase database
// Dry-run mode available for testing

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Load environment variables
require('dotenv').config({ path: '.env.migration' });

// Configuration
const CSV_FILE_PATH = process.env.CSV_FILE_PATH || '/Users/sydnee/Documents/Individual Sessions-Daily Schedule (3).csv';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Instructor mapping (CSV name → Supabase UUID)
const INSTRUCTOR_MAPPING = {
  'Sutton': '00fbcc63-4fe9-4069-b03c-4476e2b26aa8',      // Sutton Lucas
  'Stephanie': 'af2c2885-ff59-4ccb-890f-3b09150c7876',   // Stephanie
  'Jada': 'f4c0461c-6e2c-4c46-b663-0005535fe67f',        // Jada
  'Jennifer': '5433b1ee-95cd-4887-bcac-c92ae26b26b4',    // Jennifer
  'Alyah': 'bd9e85d8-8c37-45ee-9333-19ec30127118',       // Alyah
  'Lauren': '1a79854a-1d69-4a47-affc-82de7956511a',      // Lauren
  'Megan': '6ecfee52-a52e-4274-bbd8-b7c8360cb4a7',       // Megan
  'Lina': '85db05a3-ef17-4bf3-ae31-1ca172cbc073',        // Lina
  'Alexis': 'b8e1ac20-451d-4f54-a13c-64331e3738fe',      // Alexis
  'Brooke': '8f0a0731-3ded-4540-a982-c284334dfec2',      // Brooke
  'Desiree': 'b54af6c0-aa0e-4602-bd35-7848babb1196'      // Desiree
};

// Status mapping (CSV Booking Status → Supabase statuses)
function mapStatuses(csvStatus, hasClient) {
  const status = (csvStatus || '').trim();

  switch (status) {
    case 'Attended':
      return { session: 'completed', booking: 'completed' };
    case 'Booked':
    case 'Confirmed':
      return { session: 'booked', booking: 'confirmed' };
    case 'No-Show':
      return { session: 'completed', booking: 'no_show' };
    case 'Closed':
      if (hasClient) {
        return { session: 'cancelled', booking: 'cancelled' };
      } else {
        return { session: 'cancelled', booking: null }; // No booking for empty client
      }
    case 'Open':
      return { session: 'available', booking: null }; // No booking needed
    case 'Floating':
      return { session: 'available', booking: 'confirmed' };
    default:
      // Default to booked/confirmed for unknown statuses
      return { session: 'booked', booking: 'confirmed' };
  }
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Migration statistics
const stats = {
  totalRows: 0,
  totalProcessed: 0,
  sessionsCreated: 0,
  sessionsUpdated: 0,
  bookingsCreated: 0,
  bookingsUpdated: 0,
  errors: 0,
  errorDetails: [],
  skippedNoClient: 0,
  skippedInvalidInstructor: 0,
  skippedInvalidDate: 0,
  skippedOpenStatus: 0,
  skippedClosedNoClient: 0
};

// Timezone conversion: PST to UTC (CSV times are in PST)
function convertPSTtoUTC(dateStr) {
  // Parse "1/26/2026 1:00pm" format
  const [datePart, timePart] = dateStr.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  let [time, modifier] = timePart.toLowerCase().split(/(am|pm)/);
  const [hours, minutes] = time.split(':').map(Number);

  let hour = hours;
  if (modifier === 'pm' && hour !== 12) hour += 12;
  if (modifier === 'am' && hour === 12) hour = 0;

  // Create Date object in PST (America/Los_Angeles)
  const pstDate = new Date(year, month - 1, day, hour, minutes || 0);

  // Convert to UTC
  const utcDate = new Date(pstDate.toISOString());
  return utcDate;
}

// Parse CSV file
function parseCSV(filePath) {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`📊 Parsed ${records.length} rows from CSV`);
    if (records.length > 0) {
      console.log('Columns:', Object.keys(records[0]));
    }
    stats.totalRows = records.length;
    return records;
  } catch (error) {
    console.error(`❌ Error parsing CSV: ${error.message}`);
    process.exit(1);
  }
}

// Find existing session by time and instructor
async function findSession(startTime, instructorId, location = 'Modesto') {
  try {
    // Allow ±5 minute tolerance for time matching
    const toleranceSeconds = 300;
    const startTimeLower = new Date(startTime.getTime() - toleranceSeconds * 1000).toISOString();
    const startTimeUpper = new Date(startTime.getTime() + toleranceSeconds * 1000).toISOString();

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('location', location)
      .gte('start_time', startTimeLower)
      .lte('start_time', startTimeUpper)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`❌ Error finding session: ${error.message}`);
    return null;
  }
}

// Find existing session by airtable_record_id
async function findSessionByRecordId(recordId) {
  if (!recordId) return null;

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('airtable_record_id', recordId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`❌ Error finding session by record ID ${recordId}: ${error.message}`);
    return null;
  }
}

// Find existing booking by session and swimmer
async function findBooking(sessionId, swimmerId) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('session_id', sessionId)
      .eq('swimmer_id', swimmerId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`❌ Error finding booking: ${error.message}`);
    return null;
  }
}

// Find existing booking by airtable_record_id
async function findBookingByRecordId(recordId) {
  if (!recordId) return null;

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('airtable_record_id', recordId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`❌ Error finding booking by record ID ${recordId}: ${error.message}`);
    return null;
  }
}

// Validate swimmer exists
async function validateSwimmer(swimmerId) {
  if (!swimmerId) return false;

  try {
    const { data, error } = await supabase
      .from('swimmers')
      .select('id')
      .eq('id', swimmerId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error(`❌ Error validating swimmer ${swimmerId}: ${error.message}`);
    return false;
  }
}

// Get swimmer parent_id
async function getSwimmerParentId(swimmerId) {
  if (!swimmerId) return null;

  try {
    const { data, error } = await supabase
      .from('swimmers')
      .select('parent_id')
      .eq('id', swimmerId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0].parent_id : null;
  } catch (error) {
    console.error(`❌ Error fetching swimmer parent_id ${swimmerId}: ${error.message}`);
    return null;
  }
}

// Process a single CSV row
async function processRow(row, index, dryRun = true) {
  stats.totalProcessed++;

  try {
    const recordId = (row['Record ID'] || `row-${index}`).trim();
    const csvStatus = row['Booking Status'];
    const instructorName = row['Instructor'];
    const clientName = row['Client'];
    const swimmerId = row['Supabase ID (from Client) 2']?.trim();
    const hasClient = swimmerId && swimmerId.length > 0;

    console.log(`\n📝 Processing row ${index + 1}: ${recordId}`);
    console.log(`   Status: ${csvStatus}, Instructor: ${instructorName}, Client: ${clientName || 'None'}`);

    // Skip if no instructor mapping
    const instructorId = INSTRUCTOR_MAPPING[instructorName];
    if (!instructorId) {
      stats.skippedInvalidInstructor++;
      console.log(`   ⏭️ Skipping - No instructor mapping for "${instructorName}"`);
      return;
    }

    // Parse dates
    const startDateStr = row['\uFEFF1.Start Date'];
    const endDateStr = row['End Date'];

    if (!startDateStr) {
      stats.skippedInvalidDate++;
      console.log(`   ⏭️ Skipping - No start date`);
      return;
    }

    const startTime = convertPSTtoUTC(startDateStr);
    const endTime = endDateStr ? convertPSTtoUTC(endDateStr) : new Date(startTime.getTime() + 30 * 60 * 1000);

    if (isNaN(startTime.getTime())) {
      stats.skippedInvalidDate++;
      console.log(`   ⏭️ Skipping - Invalid date format: ${startDateStr}`);
      return;
    }

    // Map statuses
    const statuses = mapStatuses(csvStatus, hasClient);

    // Skip Open status (no booking needed)
    if (csvStatus === 'Open') {
      stats.skippedOpenStatus++;
      console.log(`   ⏭️ Skipping Open status - session would be marked as 'available'`);
      return;
    }

    // Skip Closed with no client
    if (csvStatus === 'Closed' && !hasClient) {
      stats.skippedClosedNoClient++;
      console.log(`   ⏭️ Skipping Closed status with no client - session would be marked as 'cancelled'`);
      return;
    }

    // Validate swimmer if present
    if (hasClient) {
      const swimmerExists = await validateSwimmer(swimmerId);
      if (!swimmerExists) {
        stats.skippedNoClient++;
        console.log(`   ⏭️ Skipping - Swimmer ${swimmerId} not found in database`);
        return;
      }
    }

    // Find or create session
    let session = await findSessionByRecordId(recordId);
    let sessionAction = 'found';

    if (!session) {
      // Fall back to time/instructor matching
      session = await findSession(startTime, instructorId);
    }

    if (!session) {
      // Create new session
      const sessionData = {
        instructor_id: instructorId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: 'Modesto',
        status: statuses.session,
        max_capacity: 1,
        booking_count: hasClient && statuses.booking ? 1 : 0,
        session_type: 'lesson',
        price_cents: 7500,
        is_full: hasClient && statuses.booking ? true : false,
        airtable_record_id: recordId
      };

      if (!dryRun) {
        const { data, error } = await supabase
          .from('sessions')
          .insert(sessionData)
          .select()
          .single();

        if (error) throw error;
        session = data;
        stats.sessionsCreated++;
      } else {
        session = { id: `dry-run-session-${index}`, ...sessionData };
        stats.sessionsCreated++;
      }
      sessionAction = 'created';
    } else {
      // Update existing session if needed
      const needsUpdate = session.status !== statuses.session;
      if (needsUpdate && !dryRun) {
        const { error } = await supabase
          .from('sessions')
          .update({ status: statuses.session })
          .eq('id', session.id);

        if (error) throw error;
        stats.sessionsUpdated++;
        sessionAction = 'updated';
      } else if (needsUpdate) {
        stats.sessionsUpdated++;
        sessionAction = 'updated (dry run)';
      }
    }

    console.log(`   ✅ Session ${sessionAction}: ${session.id}, status: ${statuses.session}`);

    // Handle bookings if applicable
    if (hasClient && statuses.booking) {
      let booking = await findBookingByRecordId(recordId);
      let bookingAction = 'found';

      if (!booking) {
        // Fall back to session/swimmer matching
        booking = await findBooking(session.id, swimmerId);
      }

      if (!booking) {
        // Create new booking
        const parentId = await getSwimmerParentId(swimmerId);
        const bookingData = {
          session_id: session.id,
          swimmer_id: swimmerId,
          status: statuses.booking,
          booking_type: 'lesson',
          parent_id: parentId,
          airtable_record_id: recordId,
          billing_amount_cents: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (!dryRun) {
          const { data, error } = await supabase
            .from('bookings')
            .insert(bookingData)
            .select()
            .single();

          if (error) throw error;
          booking = data;
          stats.bookingsCreated++;
        } else {
          booking = { id: `dry-run-booking-${index}`, ...bookingData };
          stats.bookingsCreated++;
        }
        bookingAction = 'created';
      } else {
        // Update existing booking if needed
        const needsUpdate = booking.status !== statuses.booking;
        if (needsUpdate && !dryRun) {
          const { error } = await supabase
            .from('bookings')
            .update({
              status: statuses.booking,
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          if (error) throw error;
          stats.bookingsUpdated++;
          bookingAction = 'updated';
        } else if (needsUpdate) {
          stats.bookingsUpdated++;
          bookingAction = 'updated (dry run)';
        }
      }

      console.log(`   ✅ Booking ${bookingAction}: ${booking.id}, status: ${statuses.booking}`);
    }

  } catch (error) {
    stats.errors++;
    stats.errorDetails.push({
      row: index + 1,
      error: error.message,
      data: row
    });
    console.error(`   ❌ Error processing row ${index + 1}: ${error.message}`);
  }
}

// Main function
async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--dryrun');
  const limit = process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1];
  const offset = process.argv.find(arg => arg.startsWith('--offset='))?.split('=')[1];

  console.log('🚀 CSV Booking Sync Script');
  console.log(`📁 CSV File: ${CSV_FILE_PATH}`);
  console.log(`🔧 Mode: ${dryRun ? 'DRY RUN - No changes will be made' : 'LIVE - Changes will be written'}`);
  console.log('=' .repeat(50));

  // Parse CSV
  const rows = parseCSV(CSV_FILE_PATH);

  // Apply offset and limit if specified
  let rowsToProcess = rows;
  if (offset) {
    const offsetNum = parseInt(offset);
    rowsToProcess = rowsToProcess.slice(offsetNum);
  }
  if (limit) {
    rowsToProcess = rowsToProcess.slice(0, parseInt(limit));
  }

  // Process rows
  const startIndex = offset ? parseInt(offset) : 0;
  for (let i = 0; i < rowsToProcess.length; i++) {
    const originalIndex = startIndex + i;
    await processRow(rowsToProcess[i], originalIndex, dryRun);

    // Progress indicator
    if ((i + 1) % 50 === 0) {
      console.log(`\n📊 Progress: ${originalIndex + 1}/${rows.length} rows processed (${i + 1}/${rowsToProcess.length} in this batch)`);
    }
  }

  // Print summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 SYNC SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total CSV rows: ${stats.totalRows}`);
  console.log(`Rows processed: ${stats.totalProcessed}`);
  console.log(`\n📅 Sessions:`);
  console.log(`  Created: ${stats.sessionsCreated}`);
  console.log(`  Updated: ${stats.sessionsUpdated}`);
  console.log(`\n📋 Bookings:`);
  console.log(`  Created: ${stats.bookingsCreated}`);
  console.log(`  Updated: ${stats.bookingsUpdated}`);
  console.log(`\n⏭️ Skipped:`);
  console.log(`  No client: ${stats.skippedNoClient}`);
  console.log(`  Invalid instructor: ${stats.skippedInvalidInstructor}`);
  console.log(`  Invalid date: ${stats.skippedInvalidDate}`);
  console.log(`  Open status: ${stats.skippedOpenStatus}`);
  console.log(`  Closed no client: ${stats.skippedClosedNoClient}`);
  console.log(`\n❌ Errors: ${stats.errors}`);

  if (stats.errors > 0 && stats.errorDetails.length > 0) {
    console.log('\nError Details (first 5):');
    stats.errorDetails.slice(0, 5).forEach(err => {
      console.log(`  Row ${err.row}: ${err.error}`);
    });
  }

  if (dryRun) {
    console.log('\n💡 DRY RUN COMPLETE - No changes were made to the database');
    console.log('   Run without --dry-run flag to execute changes');
  } else {
    console.log('\n✅ SYNC COMPLETE - Changes have been written to database');
  }

  // Check for missing instructor mappings
  const instructorNames = [...new Set(rows.map(r => r['Instructor']))];
  const missingMappings = instructorNames.filter(name => !INSTRUCTOR_MAPPING[name]);
  if (missingMappings.length > 0) {
    console.log('\n⚠️  Missing instructor mappings:');
    missingMappings.forEach(name => console.log(`  - ${name}`));
  }
}

// Run script
main().catch(error => {
  console.error(`❌ Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});