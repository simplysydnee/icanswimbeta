// Assessment Migration Script
// Migrates ~962 Initial Assessment records from Airtable CSV to Supabase

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Load environment variables
require('dotenv').config({ path: '.env.migrate_assessments' });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CSV_FILE_PATH = process.env.CSV_FILE_PATH || '/mnt/user-data/uploads/Initial_Assessment_Reports-Grid_view.csv';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '9307a07c-1dd4-4c32-8b17-324b0910b3c3'; // Default admin ID

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Migration statistics
const stats = {
  totalRecords: 0,
  processed: 0,
  migrated: 0,
  skipped: 0,
  errors: 0,
  errorDetails: []
};

// Helper function to log with timestamp
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Helper function to map swim skill values
function mapSwimSkillValue(value) {
  if (!value) return 'No';

  const lowerValue = value.toLowerCase().trim();
  if (lowerValue.includes('emerging')) return 'Emerging Skill';
  if (lowerValue === 'yes' || lowerValue === 'y') return 'Yes';
  if (lowerValue === 'no' || lowerValue === 'n') return 'No';
  if (lowerValue === 'na' || lowerValue === 'n/a') return 'N/A';

  return 'No'; // Default
}

// Helper function to map roadblock status
function mapRoadblockStatus(value) {
  if (!value) return 'Not a current area of focus';

  const lowerValue = value.toLowerCase().trim();
  if (lowerValue.includes('needs') || lowerValue.includes('address')) return 'Needs to be addressed';
  if (lowerValue.includes('not') || lowerValue.includes('focus')) return 'Not a current area of focus';

  return 'Not a current area of focus'; // Default
}

// Function to check and add missing columns
async function ensureTableColumns() {
  log('Checking assessment_reports table structure...');

  try {
    // Check if columns exist
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'assessment_reports')
      .eq('table_schema', 'public');

    if (error) {
      log(`Error checking table columns: ${error.message}`);
      return false;
    }

    const existingColumns = columns.map(col => col.column_name);
    const missingColumns = [];

    // Check for required columns
    if (!existingColumns.includes('instructor_name')) {
      missingColumns.push('instructor_name TEXT');
    }
    if (!existingColumns.includes('goals')) {
      missingColumns.push('goals JSONB');
    }
    if (!existingColumns.includes('pos_data')) {
      missingColumns.push('pos_data JSONB');
    }
    if (!existingColumns.includes('airtable_record_id')) {
      missingColumns.push('airtable_record_id TEXT UNIQUE');
    }

    if (missingColumns.length > 0) {
      log(`Adding missing columns: ${missingColumns.join(', ')}`);

      log('Missing columns detected. Please run the SQL script to add them:');
    log('  node scripts/run_sql.js scripts/add_assessment_columns.sql');
    log('');
    log('Or manually execute the SQL in Supabase SQL Editor:');
    missingColumns.forEach(col => {
      log(`  ALTER TABLE assessment_reports ADD COLUMN IF NOT EXISTS ${col};`);
    });
    log('');
    log('After adding the columns, run this migration script again.');
    return false;
    } else {
      log('All required columns exist in assessment_reports table.');
    }

    return true;
  } catch (error) {
    log(`Error ensuring table columns: ${error.message}`);
    return false;
  }
}

// Function to lookup swimmer by Airtable record ID
async function findSwimmerByAirtableId(airtableRecordId) {
  if (!airtableRecordId) return null;

  try {
    const { data, error } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, assessment_status')
      .eq('airtable_record_id', airtableRecordId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No swimmer found
      }
      throw error;
    }

    return data;
  } catch (error) {
    log(`Error finding swimmer for Airtable ID ${airtableRecordId}: ${error.message}`);
    return null;
  }
}

// Function to create assessment report
async function createAssessmentReport(row, swimmer) {
  try {
    // Parse assessment date
    let assessmentDate = new Date();
    if (row['Date of assessment']) {
      const dateStr = row['Date of assessment'];
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        assessmentDate = parsedDate;
      }
    }

    // Build swim_skills JSONB
    const swimSkills = {
      "walks_in_water": mapSwimSkillValue(row['Walks in water']),
      "swims_with_equipment": mapSwimSkillValue(row['Swims with equipment']),
      "swims_with_approved_pdf": mapSwimSkillValue(row['Swims with approved PDF']),
      "swims_with_floaties": mapSwimSkillValue(row['Swims with floaties']),
      "front_float": mapSwimSkillValue(row['Front float']),
      "back_float": mapSwimSkillValue(row['Back float']),
      "changing_directions": mapSwimSkillValue(row['Changing directions']),
      "rollovers": mapSwimSkillValue(row['Rollovers']),
      "blowing_bubbles": mapSwimSkillValue(row['Blowing bubbles']),
      "submerging": mapSwimSkillValue(row['Submerging']),
      "jumping_in": mapSwimSkillValue(row['Jumping in']),
      "side_breathing": mapSwimSkillValue(row['Side breathing']),
      "streamline": mapSwimSkillValue(row['Streamline']),
      "front_crawl": mapSwimSkillValue(row['Front crawl']),
      "back_crawl": mapSwimSkillValue(row['Back crawl']),
      "elementary_backstroke": mapSwimSkillValue(row['Elementary backstroke']),
      "breaststroke": mapSwimSkillValue(row['Breaststroke']),
      "butterfly": mapSwimSkillValue(row['Butterfly']),
      "side_stroke": mapSwimSkillValue(row['Side stroke']),
      "sculling": mapSwimSkillValue(row['Sculling']),
      "treading_water": mapSwimSkillValue(row['Treading water']),
      "survival_float": mapSwimSkillValue(row['Survival float']),
      "enters_safely": mapSwimSkillValue(row['Enters safely']),
      "exits_safely": mapSwimSkillValue(row['Exits safely'])
    };

    // Build roadblocks JSONB
    const roadblocks = {
      "safety": {
        "status": mapRoadblockStatus(row['Safety']),
        "intervention": row['Safety intervention'] || null
      },
      "water_properties": {
        "status": mapRoadblockStatus(row['Water properties']),
        "intervention": row['Water properties intervention'] || null
      },
      "interpreting_touch": {
        "status": mapRoadblockStatus(row['Interpreting touch']),
        "intervention": row['Interpreting touch intervention'] || null
      },
      "managing_submerging": {
        "status": mapRoadblockStatus(row['Managing submerging']),
        "intervention": row['Managing submerging intervention'] || null
      },
      "ways_of_processing": {
        "status": mapRoadblockStatus(row['Ways of processing']),
        "intervention": row['Ways of processing intervention'] || null
      },
      "excessive_drinking": {
        "status": mapRoadblockStatus(row['Excessive drinking']),
        "intervention": row['Excessive drinking intervention'] || null
      },
      "body_breath_control": {
        "status": mapRoadblockStatus(row['Body/breath control']),
        "intervention": row['Body/breath control intervention'] || null
      },
      "inability_go_on_back": {
        "status": mapRoadblockStatus(row['Inability to go on back']),
        "intervention": row['Inability to go on back intervention'] || null
      },
      "seeking_sensory_input": {
        "status": mapRoadblockStatus(row['Seeking sensory input']),
        "intervention": row['Seeking sensory input intervention'] || null
      },
      "struggles_follow_plan": {
        "status": mapRoadblockStatus(row['Struggles to follow plan']),
        "intervention": row['Struggles to follow plan intervention'] || null
      },
      "engagement_difficulties": {
        "status": mapRoadblockStatus(row['Engagement difficulties']),
        "intervention": row['Engagement difficulties intervention'] || null
      },
      "reactive": {
        "status": mapRoadblockStatus(row['Reactive']),
        "intervention": row['Reactive intervention'] || null
      },
      "rigidity": {
        "status": mapRoadblockStatus(row['Rigidity']),
        "intervention": row['Rigidity intervention'] || null
      },
      "stroke_performance": {
        "status": mapRoadblockStatus(row['Stroke performance']),
        "intervention": row['Stroke performance intervention'] || null
      }
    };

    // Build goals JSONB
    const goals = {
      "swim_skills": row["Goal(s) for Swim Skills"] || null,
      "safety": row["Goal(s) for Safety"] || null
    };

    // Build POS data JSONB
    const posData = {
      "pos_date_submitted": row['POS date submitted'] || null,
      "pos_auth_number": row['Auth #'] || null,
      "pos_date_for_lessons": row['POS date for lessons'] || null,
      "pos_request": row['POS request'] || null,
      "pos_tracking": row['POS tracking'] || null,
      "pos_notes": row['POS notes'] || null
    };

    // Check if assessment already exists for this swimmer and date
    const { data: existingAssessment, error: checkError } = await supabase
      .from('assessment_reports')
      .select('id')
      .eq('swimmer_id', swimmer.id)
      .eq('assessment_date', assessmentDate.toISOString().split('T')[0])
      .single();

    if (!checkError && existingAssessment) {
      log(`Assessment already exists for swimmer ${swimmer.id} on ${assessmentDate.toISOString().split('T')[0]}`);
      return { skipped: true, reason: 'Duplicate assessment date' };
    }

    // Create assessment report
    const { data: assessmentReport, error: insertError } = await supabase
      .from('assessment_reports')
      .insert({
        swimmer_id: swimmer.id,
        instructor_id: ADMIN_USER_ID, // Use admin as default instructor
        instructor_name: row['Instructor Name'] || 'Unknown Instructor',
        assessment_date: assessmentDate.toISOString().split('T')[0],
        strengths: row["Description of Swimmer's Strengths"] || 'No strengths recorded',
        challenges: row["Description of Swimmer's Challenges or Concerns"] || 'No challenges recorded',
        swim_skills: swimSkills,
        roadblocks: roadblocks,
        swim_skills_goals: row["Goal(s) for Swim Skills"] || null,
        safety_goals: row["Goal(s) for Safety"] || null,
        goals: goals,
        pos_data: posData,
        approval_status: 'approved', // Assume approved for migrated assessments
        created_by: ADMIN_USER_ID,
        airtable_record_id: row['Record ID'] || null
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create assessment report: ${insertError.message}`);
    }

    log(`Created assessment report ${assessmentReport.id} for swimmer ${swimmer.first_name} ${swimmer.last_name}`);

    // Update swimmer assessment status
    const { error: updateError } = await supabase
      .from('swimmers')
      .update({
        assessment_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', swimmer.id);

    if (updateError) {
      log(`Warning: Failed to update swimmer assessment status: ${updateError.message}`);
    } else {
      log(`Updated swimmer ${swimmer.id} assessment status to 'completed'`);
    }

    return { success: true, assessmentReport };

  } catch (error) {
    throw error;
  }
}

// Main migration function
async function migrateAssessments() {
  log('Starting assessment migration...');

  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    log(`Error: CSV file not found at ${CSV_FILE_PATH}`);
    log('Please set CSV_FILE_PATH in .env.migrate_assessments');
    return;
  }

  // Ensure table has required columns
  const tableReady = await ensureTableColumns();
  if (!tableReady) {
    log('Error: Failed to prepare assessment_reports table');
    return;
  }

  // Read CSV file
  log(`Reading CSV file: ${CSV_FILE_PATH}`);

  try {
    const records = [];

    // Read CSV using csv-parser
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => {
          records.push(row);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    stats.totalRecords = records.length;
    log(`Found ${stats.totalRecords} records to process`);

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      stats.processed++;

      log(`Processing record ${i + 1}/${records.length}: ${row['Client Name'] || 'Unknown'}`);

      try {
        // Get Airtable record ID from "Record ID (from Client Name)" column
        const airtableRecordId = row['Record ID (from Client Name)'] || row['Record ID'];

        if (!airtableRecordId) {
          stats.skipped++;
          stats.errorDetails.push({
            record: row['Client Name'] || `Record ${i + 1}`,
            error: 'No Airtable record ID found'
          });
          log(`Skipped: No Airtable record ID for ${row['Client Name'] || 'record'}`);
          continue;
        }

        // Find swimmer by Airtable record ID
        const swimmer = await findSwimmerByAirtableId(airtableRecordId);

        if (!swimmer) {
          stats.skipped++;
          stats.errorDetails.push({
            record: row['Client Name'] || `Record ${i + 1}`,
            airtableRecordId,
            error: 'Swimmer not found in Supabase'
          });
          log(`Skipped: Swimmer not found for Airtable ID ${airtableRecordId}`);
          continue;
        }

        // Create assessment report
        const result = await createAssessmentReport(row, swimmer);

        if (result.skipped) {
          stats.skipped++;
          log(`Skipped: ${result.reason}`);
        } else {
          stats.migrated++;
          log(`Successfully migrated assessment for ${swimmer.first_name} ${swimmer.last_name}`);
        }

      } catch (error) {
        stats.errors++;
        stats.errorDetails.push({
          record: row['Client Name'] || `Record ${i + 1}`,
          error: error.message
        });
        log(`Error processing record: ${error.message}`);
      }

      // Progress update every 50 records
      if ((i + 1) % 50 === 0) {
        log(`Progress: ${i + 1}/${records.length} records processed`);
      }
    }

    // Print summary
    log('\n=== MIGRATION SUMMARY ===');
    log(`Total records: ${stats.totalRecords}`);
    log(`Processed: ${stats.processed}`);
    log(`Successfully migrated: ${stats.migrated}`);
    log(`Skipped: ${stats.skipped}`);
    log(`Errors: ${stats.errors}`);

    if (stats.errors > 0) {
      log('\n=== ERROR DETAILS ===');
      stats.errorDetails.forEach((detail, index) => {
        log(`${index + 1}. ${detail.record}: ${detail.error}`);
      });
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      errorDetails: stats.errorDetails
    };

    const reportPath = path.join(__dirname, 'migration_report_assessments.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\nDetailed report saved to: ${reportPath}`);

  } catch (error) {
    log(`Fatal error: ${error.message}`);
    console.error(error);
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateAssessments().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateAssessments };