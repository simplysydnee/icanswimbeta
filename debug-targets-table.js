const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTargetsTable() {
  console.log('Debugging swimmer_targets table...\n');

  // Check if table exists by trying to query it
  console.log('=== 1. Checking if swimmer_targets table exists ===');
  try {
    const { data, error } = await supabase
      .from('swimmer_targets')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error querying swimmer_targets table:', error);

      // Check error code to see if table doesn't exist
      if (error.code === '42P01') { // PostgreSQL "relation does not exist"
        console.log('\n❌ Table "swimmer_targets" does not exist!');
        console.log('This is why updateTargetStatus is failing.');

        // Check what tables exist with "target" in the name
        console.log('\n=== Checking for similar tables ===');
        const { data: allTables, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .ilike('table_name', '%target%');

        if (tablesError) {
          console.error('Error checking tables:', tablesError);
        } else if (allTables && allTables.length > 0) {
          console.log('Tables with "target" in name:');
          allTables.forEach(table => {
            console.log(`- ${table.table_name}`);
          });
        } else {
          console.log('No tables with "target" in name found.');
        }
      }
    } else {
      console.log('✅ swimmer_targets table exists!');
      console.log(`Found ${data?.length || 0} records`);

      if (data && data.length > 0) {
        console.log('Sample record:', data[0]);
        console.log('Columns:', Object.keys(data[0]));
      }
    }
  } catch (error) {
    console.error('Exception checking table:', error.message);
  }

  // Check for swimmer_skills table (alternative)
  console.log('\n=== 2. Checking swimmer_skills table ===');
  try {
    const { data, error } = await supabase
      .from('swimmer_skills')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error querying swimmer_skills:', error);
    } else {
      console.log('✅ swimmer_skills table exists!');
      console.log(`Found ${data?.length || 0} records`);

      if (data && data.length > 0) {
        console.log('Sample record:', data[0]);
        console.log('Columns:', Object.keys(data[0]));
      }
    }
  } catch (error) {
    console.error('Exception checking swimmer_skills:', error.message);
  }

  // Check migrations for target-related tables
  console.log('\n=== 3. Checking migrations directory ===');
  const fs = require('fs');
  const path = require('path');
  const migrationsDir = path.join(__dirname, 'supabase/migrations');

  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .filter(file => file.toLowerCase().includes('target'));

    console.log(`Found ${migrationFiles.length} migration files with "target":`);
    migrationFiles.forEach(file => {
      console.log(`- ${file}`);

      // Read first few lines of each file
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const lines = content.split('\n').slice(0, 10).join('\n');
      console.log(`  Preview: ${lines.substring(0, 100)}...`);
    });
  }

  // Test the updateTargetStatus logic
  console.log('\n=== 4. Testing update logic ===');

  // Get a swimmer ID
  const { data: swimmers, error: swimmersError } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name')
    .limit(1);

  if (swimmersError || !swimmers || swimmers.length === 0) {
    console.error('No swimmers found:', swimmersError);
    return;
  }

  const swimmer = swimmers[0];
  console.log(`Using swimmer: ${swimmer.first_name} ${swimmer.last_name} (${swimmer.id})`);

  // Get an instructor ID
  const { data: instructors, error: instructorsError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'instructor')
    .limit(1);

  if (instructorsError || !instructors || instructors.length === 0) {
    console.error('No instructors found:', instructorsError);
    return;
  }

  const instructorId = instructors[0].user_id;
  console.log(`Using instructor ID: ${instructorId}`);

  // Try to insert a test target
  console.log('\n=== 5. Testing target insertion ===');
  try {
    const testData = {
      swimmer_id: swimmer.id,
      target_name: 'Test Target',
      status: 'in_progress',
      updated_by: instructorId,
      updated_at: new Date().toISOString(),
      notes: 'Test note',
      created_at: new Date().toISOString()
    };

    console.log('Attempting to insert:', testData);

    const { data, error } = await supabase
      .from('swimmer_targets')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);

      // Try with a different table name
      console.log('\n=== 6. Trying alternative table names ===');
      const alternativeTables = ['targets', 'swimmer_target', 'target', 'goals', 'swimmer_goals'];

      for (const tableName of alternativeTables) {
        console.log(`Trying table: ${tableName}`);
        const { error: altError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!altError) {
          console.log(`✅ Table "${tableName}" exists!`);
          console.log('The TargetsTab might be using the wrong table name.');
          break;
        }
      }
    } else {
      console.log('✅ Insert successful! Data:', data);

      // Clean up test data
      await supabase
        .from('swimmer_targets')
        .delete()
        .eq('id', data.id);
      console.log('✅ Test data cleaned up');
    }
  } catch (error) {
    console.error('Exception during test:', error.message);
  }
}

debugTargetsTable().catch(console.error);