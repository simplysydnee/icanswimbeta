const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAssessmentData() {
  console.log('=== ASSESSMENT DATA CHECK ===\n');

  // 1. Count assessments
  console.log('1. Total assessments:');
  const { count: totalAssessments, error: countError } = await supabase
    .from('assessment_reports')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(`Error: ${countError.message}`);
  } else {
    console.log(`   ${totalAssessments} assessment reports\n`);
  }

  // 2. Sample assessment with swimmer
  console.log('2. Sample assessments with swimmer info:');
  const { data: sampleAssessments, error: sampleError } = await supabase
    .from('assessment_reports')
    .select(`
      assessment_date,
      swimmer:swimmers(first_name, last_name),
      swim_skills
    `)
    .limit(5);

  if (sampleError) {
    console.error(`Error: ${sampleError.message}`);
  } else if (sampleAssessments && sampleAssessments.length > 0) {
    sampleAssessments.forEach((ar, i) => {
      const swimmer = ar.swimmer;
      const swimSkills = ar.swim_skills || {};
      console.log(`   ${i + 1}. ${swimmer?.first_name} ${swimmer?.last_name}`);
      console.log(`      Date: ${ar.assessment_date}`);
      console.log(`      Front Float: ${swimSkills.front_float || 'N/A'}`);
      console.log(`      Back Float: ${swimSkills.back_float || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('   No assessment reports found\n');
  }

  // 3. Swimmers by assessment status
  console.log('3. Swimmers by assessment_status:');
  const { data: swimmerStats, error: statsError } = await supabase
    .from('swimmers')
    .select('assessment_status')
    .then(({ data, error }) => {
      if (error) throw error;

      // Group manually since Supabase doesn't support GROUP BY directly
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
    Object.entries(swimmerStats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log('');
  }

  // 4. Additional check: Assessments per swimmer
  console.log('4. Assessments per swimmer distribution:');
  const { data: assessmentsPerSwimmer, error: apsError } = await supabase
    .from('assessment_reports')
    .select('swimmer_id')
    .then(({ data, error }) => {
      if (error) throw error;

      // Count assessments per swimmer
      const counts = {};
      data?.forEach(a => {
        counts[a.swimmer_id] = (counts[a.swimmer_id] || 0) + 1;
      });

      // Group by count
      const distribution = {};
      Object.values(counts).forEach(count => {
        distribution[count] = (distribution[count] || 0) + 1;
      });

      return { data: distribution, error: null };
    });

  if (apsError) {
    console.error(`Error: ${apsError.message}`);
  } else if (assessmentsPerSwimmer) {
    console.log('   Assessments per swimmer:');
    Object.entries(assessmentsPerSwimmer).forEach(([count, swimmers]) => {
      console.log(`   ${count} assessment(s): ${swimmers} swimmer(s)`);
    });
  }
}

checkAssessmentData().catch(console.error);