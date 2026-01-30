const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnrollmentStatus() {
  console.log('Checking enrollment status distribution...');

  const { data, error } = await supabase
    .from('swimmers')
    .select('enrollment_status')
    .not('enrollment_status', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const counts = {};
  data.forEach(row => {
    counts[row.enrollment_status] = (counts[row.enrollment_status] || 0) + 1;
  });

  console.log('Enrollment Status Distribution:');
  Object.entries(counts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  console.log(`\nTotal swimmers: ${data.length}`);
}

checkEnrollmentStatus();