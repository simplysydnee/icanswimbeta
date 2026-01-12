const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findInstructor() {
  console.log('Looking for instructors in profiles table...\n');

  // Try to find any instructor
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, staff_type, full_name')
    .eq('staff_type', 'instructor')
    .limit(5);

  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (profiles && profiles.length > 0) {
    console.log(`Found ${profiles.length} instructors:`);
    profiles.forEach(p => console.log(`  ${p.id} - ${p.email} (${p.staff_type})`));

    // Use first instructor as default
    console.log(`\nUsing first instructor as default: ${profiles[0].id} (${profiles[0].email})`);
    return profiles[0].id;
  } else {
    console.log('No instructors found. Looking for any profile...');

    const { data: anyProfile, error: anyError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(1);

    if (anyError) {
      console.error(`Error: ${anyError.message}`);
      return null;
    }

    if (anyProfile && anyProfile.length > 0) {
      console.log(`Found profile: ${anyProfile[0].id} (${anyProfile[0].email})`);
      return anyProfile[0].id;
    } else {
      console.log('No profiles found in database.');
      return null;
    }
  }
}

findInstructor().catch(console.error);