// Simple SQL runner script
// Usage: node scripts/run_sql.js path/to/sqlfile.sql

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.migrate_assessments' });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase configuration');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.migrate_assessments');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runSQL(sqlFile) {
  console.log(`Running SQL file: ${sqlFile}`);

  try {
    // Read SQL file
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));

      try {
        // Try to use exec_sql function if it exists
        const { error } = await supabase.rpc('exec_sql', { sql: stmt });

        if (error) {
          console.error(`Error executing statement: ${error.message}`);

          // If exec_sql doesn't exist, try to create it
          if (error.message.includes('function exec_sql') && error.message.includes('does not exist')) {
            console.log('Creating exec_sql function...');
            const createFunctionSQL = `
              CREATE OR REPLACE FUNCTION exec_sql(sql text)
              RETURNS void AS $$
              BEGIN
                EXECUTE sql;
              END;
              $$ LANGUAGE plpgsql
              SECURITY DEFINER;
            `;

            const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
            if (createError) {
              console.error(`Failed to create exec_sql function: ${createError.message}`);
              console.log('Please run the SQL manually in Supabase SQL Editor.');
              break;
            } else {
              console.log('exec_sql function created successfully. Retrying statement...');
              // Retry the original statement
              const { error: retryError } = await supabase.rpc('exec_sql', { sql: stmt });
              if (retryError) {
                console.error(`Still failed after creating function: ${retryError.message}`);
              } else {
                console.log('Statement executed successfully on retry.');
              }
            }
          }
        } else {
          console.log('Statement executed successfully.');
        }
      } catch (stmtError) {
        console.error(`Error: ${stmtError.message}`);
      }
    }

    console.log('\nSQL execution completed.');

  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const sqlFile = process.argv[2];

  if (!sqlFile) {
    console.error('Usage: node scripts/run_sql.js path/to/sqlfile.sql');
    process.exit(1);
  }

  if (!fs.existsSync(sqlFile)) {
    console.error(`Error: SQL file not found: ${sqlFile}`);
    process.exit(1);
  }

  runSQL(sqlFile).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { runSQL };