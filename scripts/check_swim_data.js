const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSwimData() {
  console.log('=== CHECKING SWIM DATA ===\n');

  // 1. Check swim levels
  console.log('1. Swim levels:');
  console.log('   SELECT * FROM swim_levels ORDER BY sequence;');

  const { data: swimLevels, error: levelsError } = await supabase
    .from('swim_levels')
    .select('*')
    .order('sequence');

  if (levelsError) {
    console.error(`   Error: ${levelsError.message}\n`);
  } else {
    console.log('\n   Results:');
    swimLevels.forEach((level, i) => {
      console.log(`   ${i + 1}. ${level.name} (id: ${level.id}, sequence: ${level.sequence})`);
      console.log(`      description: ${level.description || 'N/A'}`);
      console.log(`      created_at: ${level.created_at}`);
    });
    console.log('');
  }

  // 2. Check existing skills per level
  console.log('2. Skills per level:');
  console.log('   SELECT sl.name as level, s.name as skill_name, s.id as skill_id');
  console.log('   FROM skills s');
  console.log('   JOIN swim_levels sl ON s.level_id = sl.id');
  console.log('   ORDER BY sl.sequence, s.sequence;');

  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select(`
      id,
      name,
      sequence,
      level_id,
      swim_levels!inner (
        name,
        sequence
      )
    `)
    .order('sequence', { foreignTable: 'swim_levels' })
    .order('sequence');

  if (skillsError) {
    console.error(`   Error: ${skillsError.message}\n`);
  } else {
    console.log('\n   Results:');

    // Group by level
    const skillsByLevel = {};
    skills.forEach(skill => {
      const levelName = skill.swim_levels.name;
      if (!skillsByLevel[levelName]) {
        skillsByLevel[levelName] = [];
      }
      skillsByLevel[levelName].push({
        id: skill.id,
        name: skill.name,
        sequence: skill.sequence
      });
    });

    Object.entries(skillsByLevel).forEach(([levelName, levelSkills]) => {
      console.log(`   ${levelName}:`);
      levelSkills.forEach(skill => {
        console.log(`     - ${skill.name} (id: ${skill.id}, sequence: ${skill.sequence})`);
      });
    });
    console.log('');
  }

  // 3. Check swimmer_skills structure
  console.log('3. Swimmer skills table structure:');
  console.log('   SELECT column_name, data_type');
  console.log('   FROM information_schema.columns');
  console.log('   WHERE table_name = \'swimmer_skills\';');

  // We can't query information_schema directly via Supabase client
  // Let's try to get a sample row to understand the structure
  console.log('\n   Note: Cannot query information_schema directly via Supabase client.');
  console.log('   Getting sample data instead...\n');

  const { data: sampleSwimmerSkills, error: sampleError } = await supabase
    .from('swimmer_skills')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error(`   Error: ${sampleError.message}\n`);
  } else if (sampleSwimmerSkills && sampleSwimmerSkills.length > 0) {
    console.log('   Sample row structure:');
    const sample = sampleSwimmerSkills[0];
    Object.entries(sample).forEach(([key, value]) => {
      console.log(`     ${key}: ${value} (type: ${typeof value})`);
    });
  } else {
    console.log('   No data found in swimmer_skills table.');
  }

  console.log('\n=== CHECK COMPLETE ===');
}

checkSwimData().catch(console.error);