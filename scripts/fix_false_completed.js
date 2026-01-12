const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFalseCompleted() {
  console.log('=== FIXING FALSE COMPLETED STATUS ===\n');

  // Get all swimmers with assessment_status='completed'
  const { data: completedSwimmers, error: completedError } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name, assessment_status')
    .eq('assessment_status', 'completed');

  if (completedError) {
    console.error(`Error: ${completedError.message}`);
    return;
  }

  // Get all swimmers with assessment reports
  const { data: assessments, error: assError } = await supabase
    .from('assessment_reports')
    .select('swimmer_id');

  if (assError) {
    console.error(`Error: ${assError.message}`);
    return;
  }

  const swimmersWithAssessments = new Set(assessments.map(a => a.swimmer_id));

  // Find swimmers marked completed but without assessments
  const completedWithoutAssessments = completedSwimmers.filter(
    s => !swimmersWithAssessments.has(s.id)
  );

  console.log(`Found ${completedWithoutAssessments.length} swimmers marked 'completed' without assessment reports\n`);

  if (completedWithoutAssessments.length === 0) {
    console.log('✅ No fixes needed.');
    return;
  }

  // Show what we're fixing
  console.log('Swimmers to update:');
  completedWithoutAssessments.forEach(s => {
    console.log(`  ${s.first_name} ${s.last_name} (${s.id})`);
  });

  // Update them to 'not_scheduled'
  const idsToUpdate = completedWithoutAssessments.map(s => s.id);

  console.log('\nUpdating to assessment_status="not_scheduled"...');
  const { error: updateError } = await supabase
    .from('swimmers')
    .update({ assessment_status: 'not_scheduled' })
    .in('id', idsToUpdate);

  if (updateError) {
    console.error(`Update error: ${updateError.message}`);
  } else {
    console.log(`✅ Updated ${idsToUpdate.length} swimmers to 'not_scheduled'`);
  }

  // Final verification
  console.log('\n=== FINAL STATUS ===');

  const { data: finalStats, error: statsError } = await supabase
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
  } else if (finalStats) {
    console.log('Swimmers by assessment_status:');
    Object.entries(finalStats).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Check consistency
    const completedCount = finalStats['completed'] || 0;
    const assessmentCount = swimmersWithAssessments.size;

    if (completedCount === assessmentCount) {
      console.log(`\n✅ Perfect! ${completedCount} swimmers completed = ${assessmentCount} assessments`);
    } else {
      console.log(`\n⚠️  Mismatch: ${completedCount} completed vs ${assessmentCount} assessments`);
    }
  }
}

fixFalseCompleted().catch(console.error);