// Check if sutton@icanswim209.com exists and has admin role
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSutton() {
  console.log('Checking sutton@icanswim209.com status...\n');

  const suttonEmail = 'sutton@icanswim209.com';

  try {
    // Check profiles table
    console.log('1. Checking profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', suttonEmail)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error checking profile:', profileError.message);
    } else if (profile) {
      console.log('✅ Sutton profile found!');
      console.log('   ID:', profile.id);
      console.log('   Name:', profile.full_name);
      console.log('   Email:', profile.email);
      console.log('   Phone:', profile.phone || 'Not set');
      console.log('   Title:', profile.title || 'Not set');
    } else {
      console.log('❌ Sutton profile not found.');
    }

    // Check auth system
    console.log('\n2. Checking auth system...');
    try {
      // Try to get user by email (admin API)
      const { data: authData, error: authError } = await supabase.auth.admin.getUserByEmail(suttonEmail);

      if (authError) {
        console.error('❌ Error checking auth:', authError.message);
      } else if (authData && authData.user) {
        console.log('✅ Sutton auth user found!');
        console.log('   Auth ID:', authData.user.id);
        console.log('   Email confirmed:', authData.user.email_confirmed_at ? 'Yes' : 'No');
        console.log('   Created:', authData.user.created_at);
      } else {
        console.log('❌ Sutton not found in auth system.');
      }
    } catch (authErr) {
      console.error('❌ Auth check failed:', authErr.message);
    }

    // Check roles if profile exists
    if (profile) {
      console.log('\n3. Checking user roles...');
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id);

      if (rolesError) {
        console.error('❌ Error checking roles:', rolesError.message);
      } else if (roles && roles.length > 0) {
        console.log('✅ User roles found:');
        roles.forEach((role, index) => {
          console.log(`   ${index + 1}. ${role.role}`);
        });

        const isAdmin = roles.some(r => r.role === 'admin');
        if (isAdmin) {
          console.log('   ✅ User has admin role!');
        } else {
          console.log('   ❌ User does NOT have admin role.');
        }
      } else {
        console.log('❌ No roles assigned to user.');
      }
    }

    // List all admin users
    console.log('\n4. Listing all admin users...');
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error listing admins:', adminError.message);
    } else {
      console.log(`✅ Found ${adminRoles.length} admin users:`);

      for (const role of adminRoles) {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', role.user_id)
          .single()
          .catch(() => ({ data: null }));

        if (adminProfile) {
          console.log(`   - ${adminProfile.email} (${adminProfile.full_name})`);
        } else {
          console.log(`   - User ID: ${role.user_id} (profile not found)`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSutton();