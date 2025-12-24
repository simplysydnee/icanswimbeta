import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  context: any
) {
  try {
    const { params } = await context.params
    const swimmerId = params.id

    if (!swimmerId) {
      return NextResponse.json({ error: 'Swimmer ID is required' }, { status: 400 });
    }
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this swimmer
    const { data: swimmer } = await supabase
      .from('swimmers')
      .select('parent_id, current_level_id')
      .eq('id', swimmerId)
      .single();

    if (!swimmer) {
      return NextResponse.json({ error: 'Swimmer not found' }, { status: 404 });
    }

    // Check access: parent, instructor who taught them, or admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRole = userRoles?.[0];
    const isParent = swimmer.parent_id === user.id;
    const isAdmin = userRoles?.some(role => role.role === 'admin') || false;

    // Check if user is instructor
    const isInstructor = userRoles?.some(role => role.role === 'instructor') || false;

    if (!isParent && !isAdmin && !isInstructor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get swimmer's current level and all skills for that level
    let currentLevel = null;
    let currentLevelSkills = [];
    let nextLevel = null;
    let nextLevelSkills = [];

    if (swimmer.current_level_id) {
      console.log('Swimmer has current_level_id:', swimmer.current_level_id);
      const { data: levelData, error: levelError } = await supabase
        .from('swim_levels')
        .select('*')
        .eq('id', swimmer.current_level_id);

      if (levelError) {
        console.error('Error fetching level:', levelError);
      }
      console.log('Level data:', levelData);

      currentLevel = levelData?.[0] || null;
      console.log('Current level:', currentLevel);

      // Get all skills for current level WITH level data
      const { data: skillsData, error: skillsError } = await supabase
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
        .eq('level_id', swimmer.current_level_id)
        .order('sequence', { ascending: true });

      if (skillsError) {
        console.error('Error fetching skills with join:', skillsError);
        // Fallback to simple query
        const { data: simpleSkillsData } = await supabase
          .from('skills')
          .select('*')
          .eq('level_id', swimmer.current_level_id)
          .order('sequence', { ascending: true });

        if (simpleSkillsData) {
          console.log('Using fallback query (no join)');
          currentLevelSkills = simpleSkillsData.map(skill => ({
            ...skill,
            swim_levels: currentLevel
          }));
        }
      } else {
        console.log('Current level skills count (with join):', skillsData?.length || 0);
        currentLevelSkills = skillsData || [];
      }

      // Get the next level (one level above current)
      if (currentLevel) {
        console.log('Getting next level for sequence:', currentLevel.sequence);
        const { data: nextLevelData, error: nextLevelError } = await supabase
          .from('swim_levels')
          .select('*')
          .gt('sequence', currentLevel.sequence)
          .order('sequence', { ascending: true })
          .limit(1);

        if (nextLevelError) {
          console.error('Error fetching next level:', nextLevelError);
        }
        console.log('Next level data:', nextLevelData);

        nextLevel = nextLevelData?.[0] || null;
        console.log('Next level:', nextLevel);

        // Get skills for next level if it exists WITH level data
        if (nextLevel) {
          const { data: nextSkillsData, error: nextSkillsError } = await supabase
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
            .eq('level_id', nextLevel.id)
            .order('sequence', { ascending: true });

          if (nextSkillsError) {
            console.error('Error fetching next level skills with join:', nextSkillsError);
            // Fallback to simple query
            const { data: simpleNextSkillsData } = await supabase
              .from('skills')
              .select('*')
              .eq('level_id', nextLevel.id)
              .order('sequence', { ascending: true });

            if (simpleNextSkillsData) {
              console.log('Using fallback query for next level skills (no join)');
              nextLevelSkills = simpleNextSkillsData.map(skill => ({
                ...skill,
                swim_levels: nextLevel
              }));
            }
          } else {
            console.log('Next level skills count (with join):', nextSkillsData?.length || 0);
            nextLevelSkills = nextSkillsData || [];
          }
        }
      } else {
        console.log('Current level is null, cannot get next level');
      }
    } else {
      console.log('Swimmer has no current_level_id, using first level');
      // If swimmer has no current level, use the first level (White level)
      const { data: firstLevelData } = await supabase
        .from('swim_levels')
        .select('*')
        .order('sequence', { ascending: true })
        .limit(1);
      currentLevel = firstLevelData?.[0] || null;
      console.log('First level (fallback):', currentLevel);

      if (currentLevel) {
        // Get all skills for the first level WITH level data
        const { data: skillsData, error: skillsError } = await supabase
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
          .eq('level_id', currentLevel.id)
          .order('sequence', { ascending: true });

        if (skillsError) {
          console.error('Error fetching skills with join (fallback):', skillsError);
          // Fallback to simple query
          const { data: simpleSkillsData } = await supabase
            .from('skills')
            .select('*')
            .eq('level_id', currentLevel.id)
            .order('sequence', { ascending: true });

          if (simpleSkillsData) {
            console.log('Using fallback query (no join) for first level');
            currentLevelSkills = simpleSkillsData.map(skill => ({
              ...skill,
              swim_levels: currentLevel
            }));
          }
        } else {
          console.log('First level skills count (with join):', skillsData?.length || 0);
          currentLevelSkills = skillsData || [];
        }

        // Get the next level (one level above first)
        const { data: nextLevelData } = await supabase
          .from('swim_levels')
          .select('*')
          .gt('sequence', currentLevel.sequence)
          .order('sequence', { ascending: true })
          .limit(1);
        nextLevel = nextLevelData?.[0] || null;
        console.log('Next level (from first):', nextLevel);

        // Get skills for next level if it exists
        if (nextLevel) {
          const { data: nextSkillsData, error: nextSkillsError } = await supabase
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
            .eq('level_id', nextLevel.id)
            .order('sequence', { ascending: true });

          if (nextSkillsError) {
            console.error('Error fetching next level skills with join (fallback branch):', nextSkillsError);
            // Fallback to simple query
            const { data: simpleNextSkillsData } = await supabase
              .from('skills')
              .select('*')
              .eq('level_id', nextLevel.id)
              .order('sequence', { ascending: true });

            if (simpleNextSkillsData) {
              console.log('Using fallback query for next level skills (no join, fallback branch)');
              nextLevelSkills = simpleNextSkillsData.map(skill => ({
                ...skill,
                swim_levels: nextLevel
              }));
            }
          } else {
            console.log('Next level skills count (with join, fallback branch):', nextSkillsData?.length || 0);
            nextLevelSkills = nextSkillsData || [];
          }
        }
      }
    }

    // Combine skills from current and next level
    // Transform skills to have consistent 'level' property
    const transformSkillWithLevel = (skill: any, fallbackLevel: any) => {
      // If skill has swim_levels from join, use that
      if (skill.swim_levels) {
        return {
          ...skill,
          level: skill.swim_levels
        };
      }
      // Otherwise use fallback level
      return {
        ...skill,
        level: fallbackLevel
      };
    };

    const allSkills = [
      ...currentLevelSkills.map(skill => transformSkillWithLevel(skill, currentLevel)),
      ...nextLevelSkills.map(skill => transformSkillWithLevel(skill, nextLevel))
    ];

    // Get swimmer's skill progress
    const { data: swimmerSkills } = await supabase
      .from('swimmer_skills')
      .select('*')
      .eq('swimmer_id', swimmerId);

    // Combine data
    const skillsWithProgress = allSkills.map(skill => {
      const swimmerSkill = swimmerSkills?.find(ss => ss.skill_id === skill.id);
      return {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        sequence: skill.sequence,
        level: skill.level,
        status: swimmerSkill?.status || 'not_started',
        dateMastered: swimmerSkill?.date_mastered,
        dateStarted: swimmerSkill?.date_started,
        instructorNotes: swimmerSkill?.instructor_notes,
        updatedAt: swimmerSkill?.updated_at,
      };
    }) || [];

    console.log('Final response:');
    console.log('- Current level:', currentLevel);
    console.log('- Skills count:', skillsWithProgress.length);
    console.log('- First skill level:', skillsWithProgress[0]?.level);
    console.log('- All skills:', skillsWithProgress.map(s => ({
      name: s.name,
      level: s.level?.name,
      levelId: s.level?.id,
      status: s.status
    })));

    return NextResponse.json({
      swimmerId,
      currentLevel,
      skills: skillsWithProgress,
      totalSkills: skillsWithProgress.length,
      masteredSkills: skillsWithProgress.filter(s => s.status === 'mastered').length,
      inProgressSkills: skillsWithProgress.filter(s => s.status === 'in_progress').length,
    });

  } catch (error) {
    console.error('Unexpected error in swimmer skills API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: any
) {
  const { params } = await context.params
  const swimmerId = params.id
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is instructor or admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['instructor', 'admin']);

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'Instructor access required' }, { status: 403 });
    }

    const body = await request.json();
    const { skills } = body;

    if (!skills || !Array.isArray(skills)) {
      return NextResponse.json({ error: 'Skills array required' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const skillUpdate of skills) {
      const { skillId, status, instructorNotes } = skillUpdate;

      if (!skillId || !status) {
        errors.push({ skillId, error: 'Missing skillId or status' });
        continue;
      }

      // Validate skill exists
      const { data: skill } = await supabase
        .from('skills')
        .select('id')
        .eq('id', skillId)
        .single();

      if (!skill) {
        errors.push({ skillId, error: 'Skill not found' });
        continue;
      }

      // Check if record exists
      const { data: existingRecord } = await supabase
        .from('swimmer_skills')
        .select('id')
        .eq('swimmer_id', swimmerId)
        .eq('skill_id', skillId)
        .single();

      let result;
      if (existingRecord) {
        // Update existing
        const updateData: any = {
          status,
          instructor_notes: instructorNotes,
          updated_at: new Date().toISOString(),
        };

        // Set date_mastered when status changes to 'mastered'
        if (status === 'mastered' && existingRecord.status !== 'mastered') {
          updateData.date_mastered = new Date().toISOString();
        }

        // Clear date_mastered if status changes from 'mastered' to something else
        if (status !== 'mastered' && existingRecord.status === 'mastered') {
          updateData.date_mastered = null;
        }

        // Set date_started when status changes to 'in_progress' and date_started is not set
        if (status === 'in_progress' && existingRecord.status !== 'in_progress' && !existingRecord.date_started) {
          updateData.date_started = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('swimmer_skills')
          .update(updateData)
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (error) {
          errors.push({ skillId, error: error.message });
        } else {
          results.push(data);
        }
      } else {
        // Create new
        const insertData: any = {
          swimmer_id: swimmerId,
          skill_id: skillId,
          status,
          instructor_notes: instructorNotes,
        };

        // Set date_mastered if status is 'mastered'
        if (status === 'mastered') {
          insertData.date_mastered = new Date().toISOString();
        }

        // Set date_started if status is 'in_progress'
        if (status === 'in_progress') {
          insertData.date_started = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('swimmer_skills')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          errors.push({ skillId, error: error.message });
        } else {
          results.push(data);
        }
      }
    }

    // Check for level progression after updating skills
    let levelPromoted = false;
    let newLevel = null;

    if (results.length > 0) {
      // Get swimmer's current level
      const { data: swimmerData } = await supabase
        .from('swimmers')
        .select('current_level_id')
        .eq('id', swimmerId)
        .single();

      if (swimmerData?.current_level_id) {
        // Get all skills for current level
        const { data: currentLevelSkills } = await supabase
          .from('skills')
          .select('id')
          .eq('level_id', swimmerData.current_level_id);

        if (currentLevelSkills && currentLevelSkills.length > 0) {
          // Get swimmer's skill progress for current level
          const { data: swimmerSkillsForLevel } = await supabase
            .from('swimmer_skills')
            .select('skill_id, status')
            .eq('swimmer_id', swimmerId)
            .in('skill_id', currentLevelSkills.map(skill => skill.id));

          // Check if all skills in current level are mastered
          const allSkillsMastered = currentLevelSkills.every(currentSkill => {
            const swimmerSkill = swimmerSkillsForLevel?.find(ss => ss.skill_id === currentSkill.id);
            return swimmerSkill?.status === 'mastered';
          });

          if (allSkillsMastered) {
            // Get the next level
            const { data: currentLevelData } = await supabase
              .from('swim_levels')
              .select('sequence')
              .eq('id', swimmerData.current_level_id);

            const currentLevel = currentLevelData?.[0];
            if (currentLevel) {
              const { data: nextLevelData } = await supabase
                .from('swim_levels')
                .select('*')
                .gt('sequence', currentLevel.sequence)
                .order('sequence', { ascending: true })
                .limit(1);
              const nextLevel = nextLevelData?.[0];

              if (nextLevel) {
                // Promote swimmer to next level
                await supabase
                  .from('swimmers')
                  .update({ current_level_id: nextLevel.id })
                  .eq('id', swimmerId);

                levelPromoted = true;
                newLevel = nextLevel;
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      updated: results.length,
      levelPromoted,
      newLevel,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });

  } catch (error) {
    console.error('Unexpected error in swimmer skills PATCH API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}