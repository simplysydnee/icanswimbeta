// Create an admin user for testing
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jtqlamkrhdfwtmaubfrc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzkzODcsImV4cCI6MjA4MDAxNTM4N30.52ZlN5oL7O9nbdm8yFZVvLbe6aHgh0JOESs-oGIWUM0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdminUser() {
  console.log('Creating admin user...')

  const adminEmail = 'admin@test.com'
  const adminPassword = 'TestPassword123!' // Stronger password
  const adminName = 'Admin Test User'

  try {
    // Step 1: Create user in Supabase Auth
    console.log(`\n1. Creating auth user: ${adminEmail}`)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: adminName
        }
      }
    })

    if (authError) {
      console.log('❌ Auth signup error:', authError.message)

      // If user already exists, try signing in to get the user ID
      if (authError.message.includes('already registered')) {
        console.log('User already exists, trying to sign in...')
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        })

        if (signInError) {
          console.log('❌ Sign in failed:', signInError.message)
          console.log('Please reset the password for admin@test.com in Supabase Dashboard')
          return
        }

        console.log('✅ Signed in to existing user')
        console.log('User ID:', signInData.user.id)
        await assignAdminRole(signInData.user.id)
        return
      }
      return
    }

    console.log('✅ Auth user created!')
    console.log('User ID:', authData.user?.id)
    console.log('Email:', authData.user?.email)

    if (!authData.user) {
      console.log('❌ No user object returned')
      return
    }

    // Step 2: Assign admin role
    await assignAdminRole(authData.user.id)

    console.log('\n✅ Admin user creation complete!')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('\nYou can now log in with these credentials')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function assignAdminRole(userId) {
  console.log(`\n2. Assigning admin role to user ${userId}...`)

  // Try to insert into user_roles table
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .insert([
      {
        user_id: userId,
        role: 'admin'
      }
    ])
    .select()

  if (roleError) {
    console.log('❌ Error assigning admin role:', roleError.message)
    console.log('You may need to manually insert into user_roles table:')
    console.log(`INSERT INTO user_roles (user_id, role) VALUES ('${userId}', 'admin');`)
  } else {
    console.log('✅ Admin role assigned successfully!')
  }

  // Also try to update profiles table
  console.log(`\n3. Updating profiles table...`)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: 'admin@test.com',
      full_name: 'Admin Test User',
      role: 'admin'
    })
    .select()

  if (profileError) {
    console.log('❌ Error updating profiles:', profileError.message)
  } else {
    console.log('✅ Profiles table updated!')
  }
}

createAdminUser()