import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  console.log('=== ASSESSMENT-INFO API CALLED ===');

  try {
    const params = await context.params;
    const swimmerId = params.id;
    console.log('Swimmer ID:', swimmerId);
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

    // Fetch swimmer details with assessment info (simplified query)
    const { data: swimmerDetails, error: swimmerError } = await supabase
      .from('swimmers')
      .select('*')
      .eq('id', swimmerId)
      .single();

    if (swimmerError) {
      console.error('Error fetching swimmer details:', swimmerError);
      return NextResponse.json(
        { error: 'Error fetching swimmer details' },
        { status: 500 }
      );
    }

    // Fetch completed assessment (simplified query)
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
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

  } catch (error: any) {
    console.error('=== ASSESSMENT-INFO API ERROR ===');
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