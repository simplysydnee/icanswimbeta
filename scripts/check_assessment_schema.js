const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('Checking assessment_reports table schema...\n');

  // Try to get one record to see structure
  const { data, error } = await supabase
    .from('assessment_reports')
    .select('*')
    .limit(1);

  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (data && data.length > 0) {
    console.log('First record structure:');
    console.log(JSON.stringify(data[0], null, 2));

    console.log('\nColumn names:');
    console.log(Object.keys(data[0]));
  } else {
    console.log('No records in assessment_reports table');
  }

  // Also check if table exists by trying to get count
  const { count, error: countError } = await supabase
    .from('assessment_reports')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(`\nCount error (table might not exist): ${countError.message}`);
  } else {
    console.log(`\nTotal records in assessment_reports: ${count}`);
  }
}

checkSchema().catch(console.error);