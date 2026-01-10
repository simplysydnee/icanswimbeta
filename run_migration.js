// Migration runner with interactive prompts
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🔧 Airtable to Supabase Migration Setup');
  console.log('=======================================\n');

  // Check if .env.migration exists
  const envPath = path.join(__dirname, '.env.migration');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('Found existing .env.migration file');
  }

  // Parse existing values
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (value && !value.includes('your_airtable_api_key_here')) {
        envVars[key] = value;
      }
    }
  });

  // Check for Airtable API key
  if (!envVars.AIRTABLE_API_KEY || envVars.AIRTABLE_API_KEY.includes('your_airtable_api_key_here')) {
    console.log('\n📋 Airtable API Key Required');
    console.log('============================');
    console.log('To get your Airtable API key:');
    console.log('1. Go to https://airtable.com/create/tokens');
    console.log('2. Create a new token with access to your base');
    console.log('3. Copy the token (starts with "pat")\n');

    const apiKey = await askQuestion('Enter your Airtable API key: ');
    envVars.AIRTABLE_API_KEY = apiKey.trim();
  }

  // Check for Supabase URL
  if (!envVars.SUPABASE_URL) {
    envVars.SUPABASE_URL = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
  }

  // Check for Supabase service role key
  if (!envVars.SUPABASE_SERVICE_ROLE_KEY) {
    envVars.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQzOTM4NywiZXhwIjoyMDgwMDE1Mzg3fQ.WZwib9oB_xAG8NUEK5DbQMopGcVcKwLsXHnblmXUgvc';
  }

  // Update .env.migration file
  const newEnvContent = `# Airtable to Supabase Migration Configuration

# Airtable Configuration
AIRTABLE_API_KEY=${envVars.AIRTABLE_API_KEY}

# Supabase Configuration
SUPABASE_URL=${envVars.SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${envVars.SUPABASE_SERVICE_ROLE_KEY}

# Optional: Admin user ID for created_by/approved_by fields
# ADMIN_USER_ID=uuid_of_admin_user_here`;

  fs.writeFileSync(envPath, newEnvContent);
  console.log('\n✅ Environment configuration saved to .env.migration');

  // Set environment variables for the migration
  process.env.AIRTABLE_API_KEY = envVars.AIRTABLE_API_KEY;
  process.env.SUPABASE_URL = envVars.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

  return envVars;
}

async function runMigration() {
  try {
    // Setup environment
    const envVars = await setupEnvironment();

    console.log('\n🔍 Verifying configuration...');
    console.log(`- Supabase URL: ${envVars.SUPABASE_URL.substring(0, 30)}...`);
    console.log(`- Airtable API Key: ${envVars.AIRTABLE_API_KEY.substring(0, 10)}...`);

    // Confirm migration
    console.log('\n⚠️  IMPORTANT: This will migrate ~350 actively enrolled clients');
    console.log('   from Airtable to Supabase. This operation cannot be undone.\n');

    const confirm = await askQuestion('Type "YES" to confirm and start migration: ');

    if (confirm.trim().toUpperCase() !== 'YES') {
      console.log('❌ Migration cancelled.');
      rl.close();
      return;
    }

    console.log('\n🚀 Starting migration...');
    console.log('=======================================\n');

    // Load and run the migration script
    require('dotenv').config({ path: '.env.migration' });
    const migration = require('./airtable_migration.js');

    // Run the migration
    await migration.runMigration();

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };