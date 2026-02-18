// List all admin users with details
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllAdmins() {
  console.log('Listing all admin users...\n');

  try {
    // Get all admin roles
    console.log('1. Fetching admin roles from user_roles table...');
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });

    if (rolesError) {
      console.error('❌ Error fetching admin roles:', rolesError.message);
      return;
    }

    console.log(`✅ Found ${adminRoles.length} admin role assignments.\n`);

    // Get profile details for each admin
    const adminDetails = [];

    for (const role of adminRoles) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, title, created_at, updated_at')
        .eq('id', role.user_id)
        .maybeSingle();

      if (profileError) {
        console.error(`❌ Error fetching profile for user ${role.user_id}:`, profileError.message);
        adminDetails.push({
          user_id: role.user_id,
          email: 'Unknown',
          full_name: 'Profile not found',
          has_profile: false,
          role_assigned: role.created_at
        });
      } else if (profile) {
        adminDetails.push({
          user_id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone,
          title: profile.title,
          has_profile: true,
          profile_created: profile.created_at,
          role_assigned: role.created_at
        });
      } else {
        adminDetails.push({
          user_id: role.user_id,
          email: 'No profile',
          full_name: 'Profile missing',
          has_profile: false,
          role_assigned: role.created_at
        });
      }
    }

    // Display results
    console.log('2. Admin User Details:');
    console.log('='.repeat(80));

    adminDetails.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.email}`);
      console.log(`   User ID: ${admin.user_id}`);
      console.log(`   Name: ${admin.full_name}`);

      if (admin.has_profile) {
        console.log(`   Title: ${admin.title || 'Not set'}`);
        console.log(`   Phone: ${admin.phone || 'Not set'}`);
        console.log(`   Profile Created: ${admin.profile_created}`);
      } else {
        console.log(`   ❌ PROFILE MISSING - User exists in roles but not in profiles table`);
      }

      console.log(`   Admin Role Assigned: ${admin.role_assigned}`);
    });

    console.log('\n' + '='.repeat(80));

    // Summary
    const withProfiles = adminDetails.filter(a => a.has_profile).length;
    const withoutProfiles = adminDetails.filter(a => !a.has_profile).length;

    console.log(`\nSummary:`);
    console.log(`- Total admin role assignments: ${adminDetails.length}`);
    console.log(`- Users with profiles: ${withProfiles}`);
    console.log(`- Users missing profiles: ${withoutProfiles}`);

    // Key emails to check
    const keyEmails = [
      'sutton@icanswim209.com',
      'asira@gotoss.com',
      'admin@test.com',
      'info@icanswim209.com',
      'lauren@icanswim209.com'
    ];

    console.log(`\nKey email checks:`);
    keyEmails.forEach(email => {
      const found = adminDetails.find(a => a.email === email);
      if (found) {
        console.log(`✅ ${email} - Admin role assigned`);
      } else {
        console.log(`❌ ${email} - NOT found in admin list`);
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
listAllAdmins();