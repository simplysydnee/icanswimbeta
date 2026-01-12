const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSQLQueries() {
  console.log('=== RUNNING SQL QUERIES ===\n');

  // 1. Count assessments
  console.log('1. Count assessments:');
  const { count: totalAssessments, error: countError } = await supabase
    .from('assessment_reports')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(`Error: ${countError.message}`);
  } else {
    console.log(`   SELECT COUNT(*) as total_assessments FROM assessment_reports;`);
    console.log(`   Result: ${totalAssessments} total_assessments\n`);
  }

  // 2. Sample assessment with swimmer
  console.log('2. Sample assessment with swimmer:');
  const { data: sampleData, error: sampleError } = await supabase
    .from('assessment_reports')
    .select(`
      assessment_date,
      swimmer:swimmers(first_name, last_name),
      swim_skills
    `)
    .limit(5);

  if (sampleError) {
    console.error(`Error: ${sampleError.message}`);
  } else {
    console.log(`   SELECT
      s.first_name, s.last_name,
      ar.assessment_date, ar.instructor_name,
      ar.swim_skills->>'front_float' as front_float,
      ar.swim_skills->>'back_float' as back_float
    FROM assessment_reports ar
    JOIN swimmers s ON ar.swimmer_id = s.id
    LIMIT 5;`);

    console.log('\n   Results:');
    sampleData.forEach((row, i) => {
      const swimmer = row.swimmer;
      const skills = row.swim_skills || {};
      console.log(`   ${i + 1}. ${swimmer?.first_name} ${swimmer?.last_name}`);
      console.log(`      assessment_date: ${row.assessment_date}`);
      console.log(`      front_float: ${skills.front_float || 'N/A'}`);
      console.log(`      back_float: ${skills.back_float || 'N/A'}`);
    });
    console.log('');
  }

  // 3. Swimmers by assessment status
  console.log('3. Swimmers by assessment status:');

  // Get all swimmers and group manually
  const { data: allSwimmers, error: swimmersError } = await supabase
    .from('swimmers')
    .select('assessment_status');

  if (swimmersError) {
    console.error(`Error: ${swimmersError.message}`);
  } else {
    console.log(`   SELECT assessment_status, COUNT(*)
    FROM swimmers
    GROUP BY assessment_status;`);

    const statusCounts = {};
    allSwimmers.forEach(s => {
      const status = s.assessment_status || 'null';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n   Results:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`      ${status}: ${count}`);
    });

    // Additional analysis
    console.log('\n   Additional analysis:');
    const totalSwimmers = allSwimmers.length;
    const completedCount = statusCounts['completed'] || 0;
    const notScheduledCount = statusCounts['not_scheduled'] || 0;

    console.log(`      Total swimmers: ${totalSwimmers}`);
    console.log(`      Completed: ${completedCount} (${((completedCount/totalSwimmers)*100).toFixed(1)}%)`);
    console.log(`      Not scheduled: ${notScheduledCount} (${((notScheduledCount/totalSwimmers)*100).toFixed(1)}%)`);

    // Check against assessments
    console.log(`      Assessments: ${totalAssessments}`);
    console.log(`      Swimmers per assessment: ${(totalSwimmers/totalAssessments).toFixed(2)}`);
  }
}

runSQLQueries().catch(console.error);