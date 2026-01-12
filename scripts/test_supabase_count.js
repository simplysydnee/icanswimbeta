const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabaseCount() {
  console.log('Testing Supabase swimmer counts...\n');

  // Test 1: Get count with count: 'exact'
  console.log('Test 1: Getting exact count...');
  const { count, error: countError } = await supabase
    .from('swimmers')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(`Count error: ${countError.message}`);
  } else {
    console.log(`Total swimmers in database: ${count}`);
  }

  // Test 2: Try with limit 2000
  console.log('\nTest 2: Fetching with limit 2000...');
  const { data: swimmers1, error: error1 } = await supabase
    .from('swimmers')
    .select('id')
    .limit(2000);

  if (error1) {
    console.error(`Error with limit 2000: ${error1.message}`);
  } else {
    console.log(`Fetched ${swimmers1.length} swimmers with limit 2000`);
  }

  // Test 3: Try with range
  console.log('\nTest 3: Fetching with range 0-1999...');
  const { data: swimmers2, error: error2 } = await supabase
    .from('swimmers')
    .select('id')
    .range(0, 1999);

  if (error2) {
    console.error(`Error with range: ${error2.message}`);
  } else {
    console.log(`Fetched ${swimmers2.length} swimmers with range 0-1999`);
  }

  // Test 4: Try with no limit (default)
  console.log('\nTest 4: Fetching with no limit (default)...');
  const { data: swimmers3, error: error3 } = await supabase
    .from('swimmers')
    .select('id');

  if (error3) {
    console.error(`Error with no limit: ${error3.message}`);
  } else {
    console.log(`Fetched ${swimmers3.length} swimmers with no limit`);
  }
}

testSupabaseCount()
  .then(() => {
    console.log('\nTest complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
  });