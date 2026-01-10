// Migration runner for v2 migration
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runMigration() {
  console.log('🚀 Airtable to Supabase Migration (v2)');
  console.log('=======================================\n');
  console.log('This migration will:');
  console.log('1. Migrate ~350 "Actively Enrolled ✅" clients');
  console.log('2. Set parent_id to NULL (will be linked later via parent_email)');
  console.log('3. Store parent_email for automatic linking when parents sign up');
  console.log('4. Update Airtable with migration tracking info\n');

  // Confirm migration
  console.log('⚠️  IMPORTANT: Database has been prepared with:');
  console.log('   - parent_id made nullable');
  console.log('   - parent_email column added');
  console.log('   - auto-link triggers created\n');

  const confirm = await askQuestion('Type "YES" to confirm and start migration: ');

  if (confirm.trim().toUpperCase() !== 'YES') {
    console.log('❌ Migration cancelled.');
    rl.close();
    return;
  }

  console.log('\n🚀 Starting migration...');
  console.log('=======================================\n');

  try {
    // Load and run the migration script
    require('dotenv').config({ path: '.env.migration' });
    const migration = require('./airtable_migration_v2.js');

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