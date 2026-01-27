// Check existing imported records
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.migration' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkExisting() {
  console.log('Checking existing imported records...');

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Check sessions with airtable_record_id
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('airtable_record_id')
      .not('airtable_record_id', 'is', null);

    if (sessionsError) {
      console.error(`Error checking sessions: ${sessionsError.message}`);
      return;
    }

    console.log(`Found ${sessions?.length || 0} sessions with airtable_record_id`);

    // Check bookings count
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);

    if (bookingsError) {
      console.error(`Error checking bookings: ${bookingsError.message}`);
    } else {
      console.log(`Total bookings in database: ${bookings?.length || 0}`);
    }

    // Show first few airtable_record_id values
    if (sessions && sessions.length > 0) {
      console.log('\nFirst 10 airtable_record_id values:');
      sessions.slice(0, 10).forEach((session, i) => {
        console.log(`${i + 1}. ${session.airtable_record_id}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkExisting();