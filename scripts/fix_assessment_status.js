const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAssessmentStatus() {
  console.log('=== FIXING SWIMMER ASSESSMENT STATUS ===\n');

  // 1. Get all swimmers with assessments
  console.log('Finding swimmers with assessment reports...');
  const { data: assessments, error: assError } = await supabase
    .from('assessment_reports')
    .select('swimmer_id');

  if (assError) {
    console.error(`Error getting assessments: ${assError.message}`);
    return;
  }

  const swimmerIds = [...new Set(assessments.map(a => a.swimmer_id))];
  console.log(`Found ${swimmerIds.length} swimmers with assessments\n`);

  // 2. Update all these swimmers to 'completed'
  console.log('Updating swimmers to assessment_status="completed"...');

  // Update in batches to avoid timeout
  const batchSize = 100;
  let updated = 0;

  for (let i = 0; i < swimmerIds.length; i += batchSize) {
    const batch = swimmerIds.slice(i, i + batchSize);

    const { error: updateError } = await supabase
      .from('swimmers')
      .update({ assessment_status: 'completed' })
      .in('id', batch);

    if (updateError) {
      console.error(`Error updating batch ${i/batchSize + 1}: ${updateError.message}`);
    } else {
      updated += batch.length;
      console.log(`  Updated batch ${i/batchSize + 1}: ${batch.length} swimmers (total: ${updated})`);
    }
  }

  console.log(`\n✅ Updated ${updated} swimmers to assessment_status='completed'`);

  // 3. Verify the fix
  console.log('\n=== VERIFICATION ===');

  const { data: swimmerStats, error: statsError } = await supabase
    .from('swimmers')
    .select('assessment_status')
    .then(({ data, error }) => {
      if (error) throw error;

      const counts = {};
      data?.forEach(s => {
        const status = s.assessment_status || 'null';
        counts[status] = (counts[status] || 0) + 1;
      });

      return { data: counts, error: null };
    });

  if (statsError) {
    console.error(`Error: ${statsError.message}`);
  } else if (swimmerStats) {
    console.log('Swimmers by assessment_status after fix:');
    Object.entries(swimmerStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  }

  // 4. Check for any mismatches
  console.log('\nChecking for assessment/swimmer mismatches...');

  // Get all swimmers
  const { data: allSwimmers, error: swimmersError } = await supabase
    .from('swimmers')
    .select('id, assessment_status');

  if (swimmersError) {
    console.error(`Error: ${swimmersError.message}`);
    return;
  }

  const swimmersWithAssessments = new Set(swimmerIds);
  const mismatches = allSwimmers.filter(s =>
    swimmersWithAssessments.has(s.id) && s.assessment_status !== 'completed'
  );

  if (mismatches.length > 0) {
    console.log(`⚠️  Found ${mismatches.length} swimmers with assessments but wrong status:`);
    mismatches.slice(0, 10).forEach(s => {
      console.log(`  ${s.id}: status=${s.assessment_status}`);
    });
  } else {
    console.log('✅ All swimmers with assessments have status="completed"');
  }
}

fixAssessmentStatus().catch(console.error);