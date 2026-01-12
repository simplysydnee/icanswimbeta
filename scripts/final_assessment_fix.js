const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function finalAssessmentFix() {
  console.log('=== FINAL ASSESSMENT STATUS FIX ===\n');

  // Step 1: Get all unique swimmers with assessments
  console.log('1. Finding all swimmers with assessment reports...');
  const { data: assessments, error: assError } = await supabase
    .from('assessment_reports')
    .select('swimmer_id');

  if (assError) {
    console.error(`Error: ${assError.message}`);
    return;
  }

  const uniqueSwimmerIds = [...new Set(assessments.map(a => a.swimmer_id))];
  console.log(`   Found ${uniqueSwimmerIds.length} unique swimmers with assessments\n`);

  // Step 2: Update ALL these swimmers to 'completed'
  console.log('2. Updating all swimmers with assessments to "completed"...');

  // Update in one query for efficiency
  const { error: updateError } = await supabase
    .from('swimmers')
    .update({ assessment_status: 'completed' })
    .in('id', uniqueSwimmerIds);

  if (updateError) {
    console.error(`   Update error: ${updateError.message}`);

    // Fallback: Update in batches
    console.log('   Trying batch update...');
    const batchSize = 100;
    let updated = 0;

    for (let i = 0; i < uniqueSwimmerIds.length; i += batchSize) {
      const batch = uniqueSwimmerIds.slice(i, i + batchSize);

      const { error: batchError } = await supabase
        .from('swimmers')
        .update({ assessment_status: 'completed' })
        .in('id', batch);

      if (batchError) {
        console.error(`   Batch ${i/batchSize + 1} error: ${batchError.message}`);
      } else {
        updated += batch.length;
        console.log(`   Batch ${i/batchSize + 1}: Updated ${batch.length} swimmers`);
      }
    }
    console.log(`   Total updated: ${updated} swimmers\n`);
  } else {
    console.log(`   ✅ Updated ${uniqueSwimmerIds.length} swimmers\n`);
  }

  // Step 3: Verify the fix
  console.log('3. Verifying the fix...');

  // Get current status distribution
  const { data: allSwimmers, error: swimmersError } = await supabase
    .from('swimmers')
    .select('id, assessment_status');

  if (swimmersError) {
    console.error(`   Error: ${swimmersError.message}`);
    return;
  }

  // Count statuses
  const statusCounts = {};
  allSwimmers.forEach(s => {
    const status = s.assessment_status || 'null';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  console.log('   Current status distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`     ${status}: ${count}`);
  });

  // Check for mismatches
  const swimmersWithAssessmentsSet = new Set(uniqueSwimmerIds);
  const mismatches = allSwimmers.filter(s =>
    swimmersWithAssessmentsSet.has(s.id) && s.assessment_status !== 'completed'
  );

  if (mismatches.length > 0) {
    console.log(`\n   ⚠️  Found ${mismatches.length} swimmers with assessments but wrong status`);
    console.log('   First 5 mismatches:');
    mismatches.slice(0, 5).forEach(s => {
      console.log(`     ${s.id}: status=${s.assessment_status}`);
    });
  } else {
    console.log('\n   ✅ All swimmers with assessments have status="completed"');
  }

  // Final summary
  console.log('\n=== FINAL SUMMARY ===');
  console.log(`Total assessment reports: ${assessments.length}`);
  console.log(`Unique swimmers with assessments: ${uniqueSwimmerIds.length}`);
  console.log(`Swimmers marked 'completed': ${statusCounts['completed'] || 0}`);
  console.log(`Swimmers marked 'not_scheduled': ${statusCounts['not_scheduled'] || 0}`);

  if (uniqueSwimmerIds.length === (statusCounts['completed'] || 0)) {
    console.log('\n✅ PERFECT MATCH! All swimmers with assessments are correctly marked.');
  } else {
    console.log(`\n⚠️  MISMATCH: ${uniqueSwimmerIds.length} swimmers with assessments vs ${statusCounts['completed'] || 0} marked completed`);
  }
}

finalAssessmentFix().catch(console.error);