import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: any
) {
  try {
    const { params } = await context.params;
    const swimmerId = params.id;
    const supabase = await createClient();

    if (!swimmerId) {
      return NextResponse.json(
        { error: 'Swimmer ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this swimmer
    const { data: swimmer } = await supabase
      .from('swimmers')
      .select('parent_id')
      .eq('id', swimmerId)
      .single();

    if (!swimmer) {
      return NextResponse.json({ error: 'Swimmer not found' }, { status: 404 });
    }

    // Check access: parent, instructor, or admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isParent = swimmer.parent_id === user.id;
    const isAdmin = userRoles?.some(role => role.role === 'admin') || false;
    const isInstructor = userRoles?.some(role => role.role === 'instructor') || false;

    if (!isParent && !isAdmin && !isInstructor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch swimmer details with assessment info
    const { data: swimmerDetails, error: swimmerError } = await supabase
      .from('swimmers')
      .select(`
        id, first_name, last_name, swim_goals, strengths_interests,
        comfortable_in_water, previous_swim_lessons, diagnosis,
        has_medical_conditions, medical_conditions_description,
        has_allergies, allergies_description, communication_type,
        toilet_trained, current_level_id,
        swim_levels (id, name, display_name, color)
      `)
      .eq('id', swimmerId)
      .single();

    if (swimmerError) {
      console.error('Error fetching swimmer details:', swimmerError);
      return NextResponse.json(
        { error: 'Error fetching swimmer details' },
        { status: 500 }
      );
    }

    // Fetch completed assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        id, scheduled_date, completed_at, instructor_notes, status,
        profiles!completed_by (full_name)
      `)
      .eq('swimmer_id', swimmerId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assessmentError) {
      console.error('Error fetching assessment:', assessmentError);
      // Don't return error here - it's okay if no assessment exists
    }

    return NextResponse.json({
      swimmer: swimmerDetails,
      assessment: assessment || null
    });

  } catch (error) {
    console.error('Error in assessment-info API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}