// Run fixed migration
console.log('🚀 Running fixed migration (v2.1)...');
console.log('====================================\n');

// Load environment variables
require('dotenv').config({ path: '.env.migration' });

// Run the migration
const migration = require('./airtable_migration_v2.js');
migration.runMigration().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});