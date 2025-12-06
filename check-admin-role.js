// Script to check and add admin role
const { createClient } = require('@supabase/supabase-js');

// You need to set these environment variables or replace with your values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndAddAdminRole() {
  try {
    // First, check current session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Auth error:', userError.message);
      return;
    }

    if (!user) {
      console.log('No user logged in. Please log in first.');
      return;
    }

    console.log('Current user:', user.email);
    console.log('User ID:', user.id);

    // Check existing roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching roles:', rolesError.message);
      return;
    }

    console.log('Current roles:', roles);

    // Check if admin role exists
    const hasAdminRole = roles?.some(role => role.role === 'admin');

    if (hasAdminRole) {
      console.log('✅ User already has admin role');
    } else {
      console.log('❌ User does not have admin role');

      // Ask if we should add admin role
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Add admin role to this user? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          const { data, error } = await supabase
            .from('user_roles')
            .insert([
              { user_id: user.id, role: 'admin' }
            ]);

          if (error) {
            console.error('Error adding admin role:', error.message);
          } else {
            console.log('✅ Admin role added successfully');
          }
        } else {
          console.log('Skipping admin role addition');
        }

        readline.close();
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
checkAndAddAdminRole();