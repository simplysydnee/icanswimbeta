// Check if admin@test.com exists and has admin role
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jtqlamkrhdfwtmaubfrc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzkzODcsImV4cCI6MjA4MDAxNTM4N30.52ZlN5oL7O9nbdm8yFZVvLbe6aHgh0JOESs-oGIWUM0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAdminUser() {
  console.log('Checking admin user...')

  try {
    // First, try to sign in with the credentials
    console.log('\n1. Testing sign in with admin@test.com...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: '12345678'
    })

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message)
    } else {
      console.log('✅ Sign in successful!')
      console.log('User ID:', signInData.user.id)
      console.log('Email:', signInData.user.email)
    }

    // Check if user exists in auth.users (we need service role for this, but let's try)
    console.log('\n2. Checking user_roles table for admin users...')
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'admin')

    if (rolesError) {
      console.log('❌ Error querying user_roles:', rolesError.message)
    } else {
      console.log(`✅ Found ${rolesData.length} admin users in user_roles table:`)
      rolesData.forEach((role, i) => {
        console.log(`  ${i+1}. User ID: ${role.user_id}, Role: ${role.role}`)
      })
    }

    // Check profiles table
    console.log('\n3. Checking profiles table...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    if (profilesError) {
      console.log('❌ Error querying profiles:', profilesError.message)
    } else {
      console.log(`✅ Found ${profilesData.length} profiles:`)
      profilesData.forEach((profile, i) => {
        console.log(`  ${i+1}. ID: ${profile.id}, Email: ${profile.email}, Role: ${profile.role}`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkAdminUser()