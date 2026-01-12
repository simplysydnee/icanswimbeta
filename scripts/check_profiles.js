const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfiles() {
  console.log('Checking profiles table...\n');

  // Get first profile to see structure
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (profiles && profiles.length > 0) {
    console.log('First profile structure:');
    console.log(JSON.stringify(profiles[0], null, 2));

    console.log('\nColumn names:');
    console.log(Object.keys(profiles[0]));
  } else {
    console.log('No profiles found.');
  }

  // Get count
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(`Count error: ${countError.message}`);
  } else {
    console.log(`\nTotal profiles: ${count}`);
  }
}

checkProfiles().catch(console.error);