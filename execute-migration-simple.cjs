// Simple migration execution script using fetch
// Run with: node execute-migration-simple.cjs

const fs = require('fs')
const readline = require('readline')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing Supabase URL or service key')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY environment variables')
  process.exit(1)
}

async function executeSQL(sql) {
  console.log('Executing SQL via REST API...')

  try {
    // Use Supabase REST API to execute SQL
    // Note: This requires the sql endpoint to be enabled
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`HTTP ${response.status}: ${errorText}`)
      return false
    }

    console.log('SQL executed successfully')
    return true
  } catch (err) {
    console.error('Error executing SQL:', err.message)
    return false
  }
}

async function checkTableExists(tableName) {
  console.log(`Checking if table ${tableName} exists...`)

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Accept': 'application/json'
      }
    })

    if (response.status === 200) {
      console.log(`Table ${tableName} exists`)
      return true
    } else if (response.status === 404) {
      console.log(`Table ${tableName} does not exist`)
      return false
    } else {
      console.error(`Unexpected status ${response.status} checking table ${tableName}`)
      return false
    }
  } catch (err) {
    console.error(`Error checking table ${tableName}:`, err.message)
    return false
  }
}

async function main() {
  console.log('=== Supabase Table Rename Migration ===')
  console.log(`Project: ${SUPABASE_URL}`)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('This will rename referral tables. Are you sure? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log('Migration cancelled')
      rl.close()
      return
    }

    console.log('Proceeding with migration...')

    try {
      // Check current state
      const vmrcExists = await checkTableExists('vmrc_referral_requests')
      const fundingSourceExists = await checkTableExists('funding_source_referral_requests')
      const referralExists = await checkTableExists('referral_requests')

      console.log('\nCurrent state:')
      console.log(`- vmrc_referral_requests: ${vmrcExists ? 'EXISTS' : 'NOT FOUND'}`)
      console.log(`- funding_source_referral_requests: ${fundingSourceExists ? 'EXISTS' : 'NOT FOUND'}`)
      console.log(`- referral_requests: ${referralExists ? 'EXISTS' : 'NOT FOUND'}`)

      if (referralExists) {
        console.log('\nreferral_requests table already exists. No rename needed.')
      } else if (vmrcExists) {
        console.log('\nRenaming vmrc_referral_requests to referral_requests...')
        const renameSQL = 'ALTER TABLE public.vmrc_referral_requests RENAME TO referral_requests;'
        const success = await executeSQL(renameSQL)
        if (success) {
          console.log('Table renamed successfully')
        }
      } else if (fundingSourceExists) {
        console.log('\nRenaming funding_source_referral_requests to referral_requests...')
        const renameSQL = 'ALTER TABLE public.funding_source_referral_requests RENAME TO referral_requests;'
        const success = await executeSQL(renameSQL)
        if (success) {
          console.log('Table renamed successfully')
        }
      } else {
        console.log('\nNo referral table found to rename.')
      }

      // Create indexes
      console.log('\nCreating indexes...')
      const indexSQL = `
        CREATE INDEX IF NOT EXISTS idx_referral_requests_status ON public.referral_requests(status);
        CREATE INDEX IF NOT EXISTS idx_referral_requests_parent_token ON public.referral_requests(parent_token);
        CREATE INDEX IF NOT EXISTS idx_referral_requests_parent_email ON public.referral_requests(parent_email);
        CREATE INDEX IF NOT EXISTS idx_referral_requests_created_at ON public.referral_requests(created_at);
      `
      await executeSQL(indexSQL)

      console.log('\nMigration completed!')
      console.log('\nNext steps:')
      console.log('1. Verify the application works with the new table name')
      console.log('2. Update any remaining code references (especially in src/lib/api-client.ts)')
      console.log('3. Run tests to ensure everything works correctly')

    } catch (err) {
      console.error('Migration failed:', err)
    }

    rl.close()
  })
}

// Run the script
main()