// Test service role key connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found.');
  process.exit(1);
}

console.log('Testing service role key connection...');
console.log('URL:', supabaseUrl);
console.log('Key starts with:', supabaseServiceKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test 1: Simple query to profiles table
    console.log('\n1. Testing query to profiles table...');
    const { data: profiles, error: queryError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(2);

    if (queryError) {
      console.error('❌ Query error:', queryError.message);
      console.error('Full error:', queryError);
    } else {
      console.log('✅ Query successful!');
      console.log('Found', profiles?.length || 0, 'profiles');
      if (profiles && profiles.length > 0) {
        profiles.forEach(p => console.log(`   - ${p.email} (${p.full_name})`));
      }
    }

    // Test 2: Check if sutton@icanswim209.com exists
    console.log('\n2. Checking for sutton@icanswim209.com...');
    const { data: suttonProfile, error: suttonError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'sutton@icanswim209.com')
      .maybeSingle();

    if (suttonError) {
      console.error('❌ Error checking for Sutton:', suttonError.message);
    } else if (suttonProfile) {
      console.log('✅ Sutton profile found!');
      console.log('   ID:', suttonProfile.id);
      console.log('   Name:', suttonProfile.full_name);
      console.log('   Email:', suttonProfile.email);
    } else {
      console.log('❌ Sutton profile not found.');
    }

    // Test 3: Check admin users in user_roles
    console.log('\n3. Checking admin users in user_roles table...');
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin')
      .limit(5);

    if (rolesError) {
      console.error('❌ Error checking admin roles:', rolesError.message);
    } else {
      console.log(`✅ Found ${adminRoles?.length || 0} admin users`);
      if (adminRoles && adminRoles.length > 0) {
        // Get profile info for each admin
        for (const role of adminRoles) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', role.user_id)
            .single()
            .catch(() => ({ data: null }));

          if (profile) {
            console.log(`   - ${profile.email} (${profile.full_name})`);
          } else {
            console.log(`   - User ID: ${role.user_id}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();