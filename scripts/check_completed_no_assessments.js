const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompletedNoAssessments() {
  console.log('=== CHECKING SWIMMERS MARKED COMPLETED WITHOUT ASSESSMENTS ===\n');

  // Get all swimmers with assessment_status='completed'
  const { data: completedSwimmers, error: completedError } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name, assessment_status')
    .eq('assessment_status', 'completed');

  if (completedError) {
    console.error(`Error: ${completedError.message}`);
    return;
  }

  console.log(`Total swimmers with assessment_status='completed': ${completedSwimmers.length}`);

  // Get all swimmers with assessment reports
  const { data: assessments, error: assError } = await supabase
    .from('assessment_reports')
    .select('swimmer_id');

  if (assError) {
    console.error(`Error: ${assError.message}`);
    return;
  }

  const swimmersWithAssessments = new Set(assessments.map(a => a.swimmer_id));
  console.log(`Total swimmers with assessment reports: ${swimmersWithAssessments.size}\n`);

  // Find swimmers marked completed but without assessments
  const completedWithoutAssessments = completedSwimmers.filter(
    s => !swimmersWithAssessments.has(s.id)
  );

  console.log(`Swimmers marked 'completed' but without assessment reports: ${completedWithoutAssessments.length}`);

  if (completedWithoutAssessments.length > 0) {
    console.log('\nFirst 10 examples:');
    completedWithoutAssessments.slice(0, 10).forEach(s => {
      console.log(`  ${s.first_name} ${s.last_name} (${s.id})`);
    });

    // Ask if we should fix them
    console.log('\nDo you want to update these swimmers to "not_scheduled"?');
    console.log('Run: node scripts/fix_false_completed.js');
  } else {
    console.log('✅ All swimmers marked "completed" have assessment reports.');
  }
}

checkCompletedNoAssessments().catch(console.error);