const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugStatusMismatch() {
  console.log('=== DEBUGGING STATUS MISMATCH ===\n');

  // Get all swimmers with assessments
  const { data: assessments, error: assError } = await supabase
    .from('assessment_reports')
    .select('swimmer_id');

  if (assError) {
    console.error(`Error: ${assError.message}`);
    return;
  }

  const swimmersWithAssessments = [...new Set(assessments.map(a => a.swimmer_id))];
  console.log(`Swimmers with assessments: ${swimmersWithAssessments.length}`);

  // Get status for these swimmers
  const { data: swimmers, error: swimmersError } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name, assessment_status')
    .in('id', swimmersWithAssessments);

  if (swimmersError) {
    console.error(`Error: ${swimmersError.message}`);
    return;
  }

  console.log(`Fetched ${swimmers.length} swimmers from database\n`);

  // Check status distribution
  const statusCounts = {};
  swimmers.forEach(s => {
    const status = s.assessment_status || 'null';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  console.log('Status distribution for swimmers with assessments:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // Find mismatches
  const mismatches = swimmers.filter(s => s.assessment_status !== 'completed');
  console.log(`\nSwimmers with assessments but status ≠ 'completed': ${mismatches.length}`);

  if (mismatches.length > 0) {
    console.log('\nFirst 10 mismatches:');
    mismatches.slice(0, 10).forEach(s => {
      console.log(`  ${s.first_name} ${s.last_name} (${s.id}): ${s.assessment_status}`);
    });

    // Try to update these specifically
    console.log('\nAttempting to fix these mismatches...');
    const mismatchIds = mismatches.map(s => s.id);

    const { error: fixError } = await supabase
      .from('swimmers')
      .update({ assessment_status: 'completed' })
      .in('id', mismatchIds);

    if (fixError) {
      console.error(`Fix error: ${fixError.message}`);
    } else {
      console.log(`✅ Fixed ${mismatchIds.length} mismatches`);
    }
  } else {
    console.log('\n✅ All swimmers with assessments have status="completed"');
  }

  // Final check
  console.log('\n=== FINAL CHECK ===');
  const { count: totalSwimmers } = await supabase
    .from('swimmers')
    .select('*', { count: 'exact', head: true });

  const { count: completedCount } = await supabase
    .from('swimmers')
    .select('*', { count: 'exact', head: true })
    .eq('assessment_status', 'completed');

  console.log(`Total swimmers: ${totalSwimmers}`);
  console.log(`Swimmers with 'completed' status: ${completedCount}`);
  console.log(`Swimmers with assessments: ${swimmersWithAssessments.length}`);
  console.log(`Expected 'completed': ${swimmersWithAssessments.length}`);
  console.log(`Actual 'completed': ${completedCount}`);
  console.log(`Difference: ${swimmersWithAssessments.length - completedCount}`);
}

debugStatusMismatch().catch(console.error);