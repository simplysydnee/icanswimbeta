import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Types for our response
interface SwimLevel {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  sequence: number;
}

interface SwimmerSkill {
  id: string;
  name: string;
  description?: string;
  sequence: number;
  level: SwimLevel;
  status: 'not_started' | 'in_progress' | 'mastered';
  dateMastered?: string;
  dateStarted?: string;
  instructorNotes?: string;
  updatedAt?: string;
}

interface SwimmerTarget {
  id: string;
  swimmer_id: string;
  target_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  date_started?: string;
  date_met?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface SwimmerStrategy {
  id: string;
  swimmer_id: string;
  strategy_name: string;
  is_used: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ProgressResponse {
  swimmerId: string;
  currentLevel: SwimLevel | null;
  skills: SwimmerSkill[];
  targets: SwimmerTarget[];
  strategies: SwimmerStrategy[];
  totalSkills?: number;
  masteredSkills?: number;
  inProgressSkills?: number;
  totalTargets?: number;
  completedTargets?: number;
  totalStrategies?: number;
  usedStrategies?: number;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  console.log('=== PROGRESS API CALLED ===');

  try {
    const params = await context.params;
    const swimmerId = params.id;
    console.log('Swimmer ID:', swimmerId);

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
    const isInstructor = userRoles?.some(role => role.role === 'instructor') || false;

    if (!isParent && !isAdmin && !isInstructor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get swimmer's current level and all skills for that level
    let currentLevel: any = null;
    let currentLevelSkills: any[] = [];
    let nextLevel: any = null;
    let nextLevelSkills: any[] = [];

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

      // Get all skills for current level
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('level_id', swimmer.current_level_id)
        .order('sequence', { ascending: true });

      if (skillsError) {
        console.error('Error fetching skills:', skillsError);
      } else {
        console.log('Current level skills count:', skillsData?.length || 0);
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

        // Get skills for next level if it exists
        if (nextLevel) {
          const { data: nextSkillsData, error: nextSkillsError } = await supabase
            .from('skills')
            .select('*')
            .eq('level_id', nextLevel.id)
            .order('sequence', { ascending: true });

          if (nextSkillsError) {
            console.error('Error fetching next level skills:', nextSkillsError);
          } else {
            console.log('Next level skills count:', nextSkillsData?.length || 0);
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
        // Get all skills for the first level
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('*')
          .eq('level_id', currentLevel.id)
          .order('sequence', { ascending: true });

        if (skillsError) {
          console.error('Error fetching skills (fallback):', skillsError);
        } else {
          console.log('First level skills count:', skillsData?.length || 0);
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
            .select('*')
            .eq('level_id', nextLevel.id)
            .order('sequence', { ascending: true });

          if (nextSkillsError) {
            console.error('Error fetching next level skills (fallback branch):', nextSkillsError);
          } else {
            console.log('Next level skills count (fallback branch):', nextSkillsData?.length || 0);
            nextLevelSkills = nextSkillsData || [];
          }
        }
      }
    }

    // Combine skills from current and next level
    // Add level data to each skill
    const allSkills = [
      ...currentLevelSkills.map(skill => ({
        ...skill,
        level: currentLevel
      })),
      ...nextLevelSkills.map(skill => ({
        ...skill,
        level: nextLevel
      }))
    ];

    // Get swimmer's skill progress
    const { data: swimmerSkills } = await supabase
      .from('swimmer_skills')
      .select('*')
      .eq('swimmer_id', swimmerId);

    // Combine skill data with progress
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

    // Get swimmer's targets
    const { data: targets, error: targetsError } = await supabase
      .from('swimmer_targets')
      .select('*')
      .eq('swimmer_id', swimmerId)
      .order('created_at', { ascending: false });

    if (targetsError) {
      console.error('Error fetching targets:', targetsError);
    }

    // Get swimmer's strategies
    const { data: strategies, error: strategiesError } = await supabase
      .from('swimmer_strategies')
      .select('*')
      .eq('swimmer_id', swimmerId)
      .order('created_at', { ascending: false });

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError);
    }

    // Calculate statistics
    const totalSkills = skillsWithProgress.length;
    const masteredSkills = skillsWithProgress.filter(s => s.status === 'mastered').length;
    const inProgressSkills = skillsWithProgress.filter(s => s.status === 'in_progress').length;
    const totalTargets = targets?.length || 0;
    const completedTargets = targets?.filter(t => t.status === 'completed').length || 0;
    const totalStrategies = strategies?.length || 0;
    const usedStrategies = strategies?.filter(s => s.is_used).length || 0;

    console.log('=== PROGRESS API RESPONSE ===');
    console.log('- Skills count:', totalSkills);
    console.log('- Mastered skills:', masteredSkills);
    console.log('- In progress skills:', inProgressSkills);
    console.log('- Targets count:', totalTargets);
    console.log('- Completed targets:', completedTargets);
    console.log('- Strategies count:', totalStrategies);
    console.log('- Used strategies:', usedStrategies);

    const response: ProgressResponse = {
      swimmerId,
      currentLevel,
      skills: skillsWithProgress,
      targets: targets || [],
      strategies: strategies || [],
      totalSkills,
      masteredSkills,
      inProgressSkills,
      totalTargets,
      completedTargets,
      totalStrategies,
      usedStrategies,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('=== PROGRESS API ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error?.stack);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  console.log('=== PROGRESS PATCH API CALLED ===');

  try {
    const params = await context.params;
    const swimmerId = params.id;
    console.log('Swimmer ID:', swimmerId);

    if (!swimmerId) {
      return NextResponse.json({ error: 'Swimmer ID is required' }, { status: 400 });
    }

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
    console.log('PATCH body:', body);

    const { skills, targets, strategies } = body;
    const results = {
      skills: { updated: 0, errors: [] as any[] },
      targets: { updated: 0, errors: [] as any[] },
      strategies: { updated: 0, errors: [] as any[] },
    };

    let levelPromoted = false;
    let newLevel = null;

    // Update skills if provided
    if (skills && Array.isArray(skills)) {
      for (const skillUpdate of skills) {
        const { skillId, status, instructorNotes } = skillUpdate;

        if (!skillId || !status) {
          results.skills.errors.push({ skillId, error: 'Missing skillId or status' });
          continue;
        }

        // Validate skill exists
        const { data: skill } = await supabase
          .from('skills')
          .select('id')
          .eq('id', skillId)
          .single();

        if (!skill) {
          results.skills.errors.push({ skillId, error: 'Skill not found' });
          continue;
        }

        // Check if record exists
        const { data: existingRecord } = await supabase
          .from('swimmer_skills')
          .select('id, status, date_started')
          .eq('swimmer_id', swimmerId)
          .eq('skill_id', skillId)
          .single();

        try {
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

            const { error } = await supabase
              .from('swimmer_skills')
              .update(updateData)
              .eq('id', existingRecord.id);

            if (error) {
              results.skills.errors.push({ skillId, error: error.message });
            } else {
              results.skills.updated++;
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

            const { error } = await supabase
              .from('swimmer_skills')
              .insert(insertData);

            if (error) {
              results.skills.errors.push({ skillId, error: error.message });
            } else {
              results.skills.updated++;
            }
          }
        } catch (error: any) {
          results.skills.errors.push({ skillId, error: error.message });
        }
      }
    }

    // Update targets if provided
    if (targets && Array.isArray(targets)) {
      for (const targetUpdate of targets) {
        const { targetId, status, notes } = targetUpdate;

        if (!targetId) {
          results.targets.errors.push({ targetId, error: 'Missing targetId' });
          continue;
        }

        try {
          const updateData: any = {
            updated_at: new Date().toISOString(),
          };

          if (status !== undefined) {
            updateData.status = status;

            // Set date_met when status changes to 'completed'
            if (status === 'completed') {
              updateData.date_met = new Date().toISOString();
            }

            // Set date_started when status changes to 'in_progress' and date_started is not set
            if (status === 'in_progress') {
              // First check if date_started is already set
              const { data: existingTarget } = await supabase
                .from('swimmer_targets')
                .select('date_started')
                .eq('id', targetId)
                .single();

              if (!existingTarget?.date_started) {
                updateData.date_started = new Date().toISOString();
              }
            }
          }

          if (notes !== undefined) {
            updateData.notes = notes;
          }

          const { error } = await supabase
            .from('swimmer_targets')
            .update(updateData)
            .eq('id', targetId)
            .eq('swimmer_id', swimmerId);

          if (error) {
            results.targets.errors.push({ targetId, error: error.message });
          } else {
            results.targets.updated++;
          }
        } catch (error: any) {
          results.targets.errors.push({ targetId, error: error.message });
        }
      }
    }

    // Update strategies if provided
    if (strategies && Array.isArray(strategies)) {
      for (const strategyUpdate of strategies) {
        const { strategyId, is_used, notes } = strategyUpdate;

        if (!strategyId) {
          results.strategies.errors.push({ strategyId, error: 'Missing strategyId' });
          continue;
        }

        try {
          const updateData: any = {
            updated_at: new Date().toISOString(),
          };

          if (is_used !== undefined) {
            updateData.is_used = is_used;
          }

          if (notes !== undefined) {
            updateData.notes = notes;
          }

          const { error } = await supabase
            .from('swimmer_strategies')
            .update(updateData)
            .eq('id', strategyId)
            .eq('swimmer_id', swimmerId);

          if (error) {
            results.strategies.errors.push({ strategyId, error: error.message });
          } else {
            results.strategies.updated++;
          }
        } catch (error: any) {
          results.strategies.errors.push({ strategyId, error: error.message });
        }
      }
    }

    // Check for level promotion if skills were updated
    if (results.skills.updated > 0) {
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
      success: results.skills.errors.length === 0 &&
               results.targets.errors.length === 0 &&
               results.strategies.errors.length === 0,
      results,
      levelPromoted,
      newLevel,
    });

  } catch (error: any) {
    console.error('=== PROGRESS PATCH API ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error?.stack);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}