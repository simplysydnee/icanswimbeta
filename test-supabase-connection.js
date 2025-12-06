// Test Supabase connection with current keys
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jtqlamkrhdfwtmaubfrc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzkzODcsImV4cCI6MjA4MDAxNTM4N30.52ZlN5oL7O9nbdm8yFZVvLbe6aHgh0JOESs-oGIWUM0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('Testing Supabase connection...')

  try {
    // Test 1: Simple query to public table
    const { data: levels, error: queryError } = await supabase
      .from('swim_levels')
      .select('*')
      .limit(1)

    if (queryError) {
      console.error('Query error:', queryError)
    } else {
      console.log('✅ Query successful, found', levels?.length || 0, 'swim levels')
    }

    // Test 2: Auth signup (simulate what the app does)
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'

    console.log('\nTesting auth signup with email:', testEmail)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    })

    if (authError) {
      console.error('❌ Auth signup error:', authError.message)
      console.error('Auth error details:', authError)
    } else {
      console.log('✅ Auth signup successful!')
      console.log('User created:', authData.user?.email)

      // Clean up: delete test user if created
      if (authData.user) {
        console.log('Test user created, would need service role to delete')
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testConnection()