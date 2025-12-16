import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const swimmerId = params.id;

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
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isParent = swimmer.parent_id === user.id;
    const isAdmin = userRole?.role === 'admin';

    // Check if user is instructor who taught this swimmer
    let isInstructor = false;
    if (userRole?.role === 'instructor') {
      const { data: taughtSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('instructor_id', user.id)
        .in('id', supabase
          .from('bookings')
          .select('session_id')
          .eq('swimmer_id', swimmerId)
        )
        .limit(1)
        .single();

      isInstructor = !!taughtSession;
    }

    if (!isParent && !isAdmin && !isInstructor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get swimmer's current level and all skills for that level
    const { data: currentLevel } = await supabase
      .from('swim_levels')
      .select('*')
      .eq('id', swimmer.current_level_id)
      .single();

    // Get all skills for current level
    const { data: levelSkills } = await supabase
      .from('skills')
      .select('*')
      .eq('level_id', swimmer.current_level_id)
      .order('sequence', { ascending: true });

    // Get swimmer's skill progress
    const { data: swimmerSkills } = await supabase
      .from('swimmer_skills')
      .select('*')
      .eq('swimmer_id', swimmerId);

    // Combine data
    const skillsWithProgress = levelSkills?.map(skill => {
      const swimmerSkill = swimmerSkills?.find(ss => ss.skill_id === skill.id);
      return {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        sequence: skill.sequence,
        status: swimmerSkill?.status || 'not_started',
        dateMastered: swimmerSkill?.date_mastered,
        instructorNotes: swimmerSkill?.instructor_notes,
        updatedAt: swimmerSkill?.updated_at,
      };
    }) || [];

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const swimmerId = params.id;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is instructor or admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['instructor', 'admin'])
      .single();

    if (!userRole) {
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
        const { data, error } = await supabase
          .from('swimmer_skills')
          .update({
            status,
            instructor_notes: instructorNotes,
            date_mastered: status === 'mastered' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
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
        const { data, error } = await supabase
          .from('swimmer_skills')
          .insert({
            swimmer_id: swimmerId,
            skill_id: skillId,
            status,
            instructor_notes: instructorNotes,
            date_mastered: status === 'mastered' ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (error) {
          errors.push({ skillId, error: error.message });
        } else {
          results.push(data);
        }
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      updated: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });

  } catch (error) {
    console.error('Unexpected error in swimmer skills PATCH API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}