const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtxlamkrhdfwtmaubfrc.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserById(userId) {
  console.log(`Checking user by ID: ${userId}`);

  // Get user by ID
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) {
    console.error('Auth error:', userError);
    return;
  }

  if (!user) {
    console.error(`User with ID ${userId} not found`);
    return;
  }

  console.log(`Found user: ${user.user.id} (${user.user.email})`);

  // Check profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.user.id)
    .single();

  if (profileError) {
    console.error('Profile error:', profileError);
  } else {
    console.log('Profile:', profile);
  }

  // Check user_roles table
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.user.id);

  if (rolesError) {
    console.error('Roles error:', rolesError);
  } else {
    console.log('Roles:', roles);
  }
}

async function updateUserRoleById(userId, newRole) {
  console.log(`Updating user ${userId} to role: ${newRole}`);

  // Get user by ID
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) {
    console.error('Auth error:', userError);
    return;
  }

  if (!user) {
    console.error(`User with ID ${userId} not found`);
    return;
  }

  console.log(`Found user: ${user.user.id} (${user.user.email})`);

  // Update or insert in user_roles table
  const { data: existingRole, error: checkError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('role', newRole)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Check error:', checkError);
  }

  if (existingRole) {
    console.log(`User already has role ${newRole}`);
  } else {
    // Delete existing roles and insert new one
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user.user.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
    }

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.user.id,
        role: newRole,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log(`Successfully updated user role to ${newRole}`);
    }
  }
}

// Get user ID from command line
const userId = process.argv[2];
const action = process.argv[3];
const role = process.argv[4];

if (!userId) {
  console.log('Usage: node check-user-role.js <userId> [check|update <role>]');
  console.log('Example: node check-user-role.js e765688c-1b72-41a4-a771-68366ae3a041 check');
  console.log('Example: node check-user-role.js e765688c-1b72-41a4-a771-68366ae3a041 update admin');
  process.exit(1);
}

if (action === 'update' && role) {
  updateUserRoleById(userId, role);
} else {
  checkUserById(userId);
}