const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicateAssessments() {
  console.log('=== CHECKING FOR DUPLICATE ASSESSMENTS ===\n');

  // Get all assessment reports with swimmer info
  const { data: assessments, error } = await supabase
    .from('assessment_reports')
    .select(`
      id,
      assessment_date,
      swimmer:swimmers(id, first_name, last_name)
    `)
    .order('assessment_date', { ascending: false });

  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  console.log(`Total assessment reports: ${assessments.length}`);

  // Group by swimmer
  const bySwimmer = {};
  assessments.forEach(a => {
    const swimmerId = a.swimmer?.id;
    if (!swimmerId) return;

    if (!bySwimmer[swimmerId]) {
      bySwimmer[swimmerId] = {
        swimmer: a.swimmer,
        assessments: []
      };
    }
    bySwimmer[swimmerId].assessments.push({
      id: a.id,
      date: a.assessment_date
    });
  });

  // Find swimmers with multiple assessments
  const swimmersWithMultiple = Object.entries(bySwimmer)
    .filter(([_, data]) => data.assessments.length > 1)
    .sort((a, b) => b[1].assessments.length - a[1].assessments.length);

  console.log(`\nSwimmers with multiple assessments: ${swimmersWithMultiple.length}`);

  if (swimmersWithMultiple.length > 0) {
    console.log('\nTop swimmers with most assessments:');
    swimmersWithMultiple.slice(0, 10).forEach(([swimmerId, data], i) => {
      const s = data.swimmer;
      console.log(`${i + 1}. ${s.first_name} ${s.last_name}: ${data.assessments.length} assessments`);
      data.assessments.forEach((a, j) => {
        console.log(`   ${j + 1}. ${a.date} (${a.id})`);
      });
      console.log('');
    });
  }

  // Summary statistics
  const assessmentCounts = {};
  Object.values(bySwimmer).forEach(data => {
    const count = data.assessments.length;
    assessmentCounts[count] = (assessmentCounts[count] || 0) + 1;
  });

  console.log('\n=== SUMMARY ===');
  console.log(`Total swimmers with assessments: ${Object.keys(bySwimmer).length}`);
  console.log(`Total assessment reports: ${assessments.length}`);
  console.log('\nAssessments per swimmer:');
  Object.entries(assessmentCounts).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([count, swimmers]) => {
    console.log(`  ${count} assessment(s): ${swimmers} swimmer(s)`);
  });

  // Calculate expected vs actual
  const totalSwimmers = Object.keys(bySwimmer).length;
  const totalAssessments = assessments.length;
  const expectedIfNoDuplicates = totalAssessments;
  const actualSwimmers = totalSwimmers;

  console.log(`\nExpected swimmers if no duplicates: ${expectedIfNoDuplicates}`);
  console.log(`Actual swimmers with assessments: ${actualSwimmers}`);
  console.log(`Difference (duplicates): ${expectedIfNoDuplicates - actualSwimmers}`);
}

checkDuplicateAssessments().catch(console.error);