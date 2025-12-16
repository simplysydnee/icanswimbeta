// Script to execute migration using Supabase JavaScript client
// Run with: node execute-migration.js

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import readline from 'readline'

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service key')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY environment variables')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeMigration() {
  console.log('Starting migration execution...')
  console.log(`Supabase URL: ${supabaseUrl}`)

  try {
    // Read migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/014_rename_to_referral_requests.sql', 'utf8')

    console.log('Migration SQL loaded. Executing...')

    // Execute the migration using Supabase's rpc or direct SQL
    // Note: We need to use the service role key which has admin privileges
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('Error executing migration:', error)

      // Try alternative approach - execute SQL statements one by one
      console.log('Trying alternative approach...')
      await executeSQLStatements(migrationSQL)
    } else {
      console.log('Migration executed successfully!')
      console.log('Result:', data)
    }

  } catch (err) {
    console.error('Fatal error:', err)
  }
}

async function executeSQLStatements(sql) {
  // Split SQL by semicolons and execute each statement
  const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim()
    if (stmt.length === 0) continue

    console.log(`Executing statement ${i + 1}/${statements.length}: ${stmt.substring(0, 100)}...`)

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt + ';' })
      if (error) {
        console.error(`Error in statement ${i + 1}:`, error.message)
        // Continue with next statement
      } else {
        console.log(`Statement ${i + 1} executed successfully`)
      }
    } catch (err) {
      console.error(`Error executing statement ${i + 1}:`, err.message)
    }
  }
}

// Check if exec_sql function exists, if not create it
async function ensureExecSQLFunction() {
  console.log('Checking if exec_sql function exists...')

  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
    if (error && error.message.includes('function exec_sql(text) does not exist')) {
      console.log('Creating exec_sql function...')
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL })
      if (createError) {
        console.error('Error creating exec_sql function:', createError)
        return false
      }
      console.log('exec_sql function created successfully')
    }
    return true
  } catch (err) {
    console.error('Error checking exec_sql function:', err)
    return false
  }
}

// Main execution
async function main() {
  console.log('=== Supabase Migration Executor ===')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('This will execute database migration. Are you sure? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() === 'yes') {
      console.log('Proceeding with migration...')

      // First ensure we have the exec_sql function
      const hasFunction = await ensureExecSQLFunction()
      if (hasFunction) {
        await executeMigration()
      } else {
        console.error('Cannot proceed without exec_sql function')
      }
    } else {
      console.log('Migration cancelled')
    }

    rl.close()
  })
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { executeMigration }