#!/usr/bin/env node

/**
 * Script to add instructors using Supabase admin client directly
 *
 * Usage: node scripts/add_instructors.js
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY environment variables
 */

import { createClient } from '@supabase/supabase-js';

// List of instructors to add
const INSTRUCTORS = [
  { full_name: 'Megan', email: 'megan.instructor@icanswim209.com' },
  { full_name: 'Brooke', email: 'brooke.instructor@icanswim209.com' },
  { full_name: 'Stephanie', email: 'stephanie.instructor@icanswim209.com' },
  { full_name: 'Sutton', email: 'sutton@icanswim209.com' },
  { full_name: 'Alexis', email: 'alexis.instructor@icanswim209.com' },
  { full_name: 'Alyah', email: 'alyah.instructor@icanswim209.com' },
  { full_name: 'Jennifer', email: 'jennifer.instructor@icanswim209.com' },
  { full_name: 'Jada', email: 'jada.instructor@icanswim209.com' },
  { full_name: 'Desiree', email: 'desiree.instructor@icanswim209.com' },
  { full_name: 'Lina', email: 'lina.instructor@icanswim209.com' }
];

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY environment variables are required');
  console.error('Set them in your .env.local file or export them before running this script');
  console.error('You can run: export $(cat .env.local | xargs) && node scripts/add_instructors.js');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function addInstructor(instructor) {
  console.log(`Adding instructor: ${instructor.full_name} (${instructor.email})...`);

  try {
    // 1. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some((u) => u.email === instructor.email);

    if (userExists) {
      console.log(`⚠️  User with email ${instructor.email} already exists, skipping...`);
      return { success: false, error: 'User already exists', skipped: true };
    }

    // 2. Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: instructor.email,
      email_confirm: true,
      user_metadata: { full_name: instructor.full_name }
    });

    if (createError || !newUser.user) {
      console.error(`❌ Error creating auth user: ${createError?.message}`);
      return { success: false, error: createError?.message };
    }

    const userId = newUser.user.id;

    // 3. Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: instructor.email,
        full_name: instructor.full_name,
        title: null,
        bio: null,
        phone: null,
        pay_rate_cents: 2500, // Default $25/hour
        employment_type: 'hourly',
        staff_type: 'instructor',
        display_on_team: true,
        display_order: 100,
        credentials: [],
        avatar_url: null,
        is_active: true
      });

    if (profileError) {
      console.error(`❌ Error creating profile: ${profileError.message}`);
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false, error: profileError.message };
    }

    // 4. Assign instructor role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'instructor'
      });

    if (roleError) {
      console.error(`❌ Error assigning role: ${roleError.message}`);
      // Cleanup
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false, error: roleError.message };
    }

    // 5. Send password reset email
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: instructor.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://icanswim209.com'}/reset-password`
      }
    });

    if (resetError) {
      console.log(`⚠️  Instructor created but password reset email failed to send: ${resetError.message}`);
    } else {
      console.log(`📧 Password reset email sent to ${instructor.email}`);
    }

    console.log(`✅ Success: ${instructor.full_name} created (User ID: ${userId})`);
    return {
      success: true,
      data: { user_id: userId, email_sent: !resetError }
    };

  } catch (error) {
    console.error(`❌ Unexpected error adding ${instructor.full_name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting instructor creation process...');
  console.log(`📋 Total instructors to add: ${INSTRUCTORS.length}`);
  console.log('---');

  const results = [];
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // Add instructors sequentially to avoid rate limiting
  for (const instructor of INSTRUCTORS) {
    const result = await addInstructor(instructor);
    results.push({ instructor, result });

    if (result.success) {
      successCount++;
    } else if (result.skipped) {
      skippedCount++;
    } else {
      failureCount++;
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('---');
  console.log('📊 Summary:');
  console.log(`✅ Successfully created: ${successCount} instructors`);
  console.log(`⚠️  Skipped (already exist): ${skippedCount} instructors`);
  console.log(`❌ Failed to create: ${failureCount} instructors`);

  if (failureCount > 0) {
    console.log('\n📝 Failed instructors:');
    results
      .filter(r => !r.result.success && !r.result.skipped)
      .forEach(r => {
        console.log(`   - ${r.instructor.full_name} (${r.instructor.email}): ${r.result.error}`);
      });
  }

  // Verify by checking database
  console.log('\n🔍 Verifying instructor creation...');
  await verifyInstructors();
}

async function verifyInstructors() {
  try {
    // Get all instructor names
    const instructorNames = INSTRUCTORS.map(i => i.full_name);

    // Query profiles table
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, is_active')
      .in('full_name', instructorNames)
      .order('full_name');

    if (error) {
      console.error('Error querying profiles:', error.message);
      return;
    }

    console.log(`\n📊 Found ${profiles.length} instructor profiles:`);
    console.log('----------------------------------------');
    profiles.forEach(profile => {
      console.log(`• ${profile.full_name} (${profile.email}) - ${profile.is_active ? 'Active' : 'Inactive'} - ID: ${profile.id.substring(0, 8)}...`);
    });

    // Check for missing instructors
    const foundNames = profiles.map(p => p.full_name);
    const missingNames = instructorNames.filter(name => !foundNames.includes(name));

    if (missingNames.length > 0) {
      console.log(`\n⚠️  Missing instructors: ${missingNames.join(', ')}`);
    }

    console.log('\nTo verify further, run this SQL query in Supabase SQL Editor:');
    console.log(`
    SELECT id, full_name, email, is_active FROM profiles
    WHERE full_name IN ('Megan', 'Brooke', 'Stephanie', 'Sutton', 'Alexis', 'Alyah', 'Jennifer', 'Jada', 'Desiree', 'Lina')
    ORDER BY full_name;
    `);

  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});