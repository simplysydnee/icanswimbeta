const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cWxhbWtyaGRmd3RtYXViZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzkzODcsImV4cCI6MjA4MDAxNTM4N30.52ZlN5oL7O9nbdm8yFZVvLbe6aHgh0JOESs-oGIWUM0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDbData() {
  console.log('=== CHECKING DATABASE DATA ===\n');

  try {
    // 1. Get swimmers
    console.log('1. Getting swimmers...');
    const { data: swimmers, error: swimmersError } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, current_level_id')
      .limit(5);

    if (swimmersError) {
      console.log(`❌ Error getting swimmers: ${swimmersError.message}`);
      return;
    }

    console.log(`✅ Found ${swimmers.length} swimmer(s):`);
    swimmers.forEach((swimmer, i) => {
      console.log(`   ${i + 1}. ${swimmer.first_name} ${swimmer.last_name}`);
      console.log(`      ID: ${swimmer.id}`);
      console.log(`      Current Level ID: ${swimmer.current_level_id || 'None'}`);
    });

    // 2. Check Alex Johnson specifically
    const alex = swimmers.find(s => s.first_name === 'Alex' && s.last_name === 'Johnson');
    if (!alex) {
      console.log('\n❌ Alex Johnson not found in first 5 swimmers');
      return;
    }

    console.log(`\n2. Checking Alex Johnson (ID: ${alex.id})...`);

    // 3. Check if Alex has a valid level
    if (!alex.current_level_id) {
      console.log('❌ Alex Johnson has no current_level_id');
      return;
    }

    console.log(`   Current level ID: ${alex.current_level_id}`);

    // 4. Check if level exists
    const { data: level, error: levelError } = await supabase
      .from('swim_levels')
      .select('id, name, display_name, color, sequence')
      .eq('id', alex.current_level_id)
      .single();

    if (levelError) {
      console.log(`❌ Error fetching level: ${levelError.message}`);
      console.log(`   Code: ${levelError.code}, Details: ${levelError.details}`);
      return;
    }

    if (!level) {
      console.log(`❌ Level not found for ID: ${alex.current_level_id}`);
      return;
    }

    console.log(`✅ Level found: ${level.name} (${level.display_name})`);
    console.log(`   Color: ${level.color}, Sequence: ${level.sequence}`);

    // 5. Check skills for this level
    console.log(`\n3. Checking skills for ${level.name} level...`);
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, description, sequence, level_id')
      .eq('level_id', alex.current_level_id)
      .order('sequence', { ascending: true });

    if (skillsError) {
      console.log(`❌ Error fetching skills: ${skillsError.message}`);
      return;
    }

    console.log(`✅ Found ${skills.length} skill(s) for ${level.name} level:`);
    skills.forEach((skill, i) => {
      console.log(`   ${i + 1}. ${skill.name} (ID: ${skill.id})`);
      console.log(`      Description: ${skill.description || 'None'}`);
      console.log(`      Sequence: ${skill.sequence}`);
    });

    // 6. Check swimmer_skills for Alex
    console.log(`\n4. Checking swimmer_skills for Alex Johnson...`);
    const { data: swimmerSkills, error: swimmerSkillsError } = await supabase
      .from('swimmer_skills')
      .select('skill_id, status, date_started, date_mastered, instructor_notes')
      .eq('swimmer_id', alex.id);

    if (swimmerSkillsError) {
      console.log(`❌ Error fetching swimmer_skills: ${swimmerSkillsError.message}`);
      // This might be okay if table doesn't exist or has no data
    } else {
      console.log(`✅ Found ${swimmerSkills?.length || 0} swimmer_skill record(s):`);
      if (swimmerSkills && swimmerSkills.length > 0) {
        swimmerSkills.forEach((ss, i) => {
          console.log(`   ${i + 1}. Skill ID: ${ss.skill_id}, Status: ${ss.status}`);
          if (ss.date_started) console.log(`      Started: ${ss.date_started}`);
          if (ss.date_mastered) console.log(`      Mastered: ${ss.date_mastered}`);
        });
      } else {
        console.log('   No swimmer_skills records found (this is okay - means no progress tracked yet)');
      }
    }

    // 7. Test the actual query the API uses
    console.log(`\n5. Testing API query pattern...`);

    // Get skills with level data using join
    const { data: skillsWithLevel, error: joinError } = await supabase
      .from('skills')
      .select(`
        id,
        name,
        description,
        sequence,
        level_id,
        swim_levels!inner (
          id,
          name,
          display_name,
          color,
          sequence
        )
      `)
      .eq('level_id', alex.current_level_id)
      .order('sequence', { ascending: true });

    if (joinError) {
      console.log(`❌ Error with joined query: ${joinError.message}`);
      console.log(`   Hint: The 'swim_levels!inner' syntax might not be supported`);
    } else {
      console.log(`✅ Joined query returned ${skillsWithLevel?.length || 0} skill(s)`);
      if (skillsWithLevel && skillsWithLevel.length > 0) {
        const firstSkill = skillsWithLevel[0];
        console.log(`   First skill level data:`, firstSkill.swim_levels);
      }
    }

    console.log('\n=== DATABASE CHECK COMPLETE ===');
    console.log('\nSummary:');
    console.log(`- Swimmer: ${alex.first_name} ${alex.last_name}`);
    console.log(`- Level: ${level.name} (ID: ${level.id})`);
    console.log(`- Skills for level: ${skills.length}`);
    console.log(`- Swimmer skills tracked: ${swimmerSkills?.length || 0}`);

  } catch (err) {
    console.log(`❌ Unexpected error: ${err.message}`);
    console.log(err.stack);
  }
}

checkDbData();