import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query swimmers for this parent
    const { data, error } = await supabase
      .from('swimmers')
      .select(`
        id,
        parent_id,
        first_name,
        last_name,
        date_of_birth,
        enrollment_status,
        assessment_status,
        current_level_id,
        payment_type,
        is_vmrc_client,
        photo_url,
        vmrc_sessions_used,
        vmrc_sessions_authorized,
        swim_levels:current_level_id(name)
      `)
      .eq('parent_id', user.id);

    if (error) {
      console.error('Error fetching swimmers:', error);
      return NextResponse.json({ error: 'Failed to fetch swimmers' }, { status: 500 });
    }

    // Transform snake_case to camelCase
    const transformedData = data.map(swimmer => ({
      id: swimmer.id,
      parentId: swimmer.parent_id,
      firstName: swimmer.first_name,
      lastName: swimmer.last_name,
      dateOfBirth: swimmer.date_of_birth,
      enrollmentStatus: swimmer.enrollment_status,
      assessmentStatus: swimmer.assessment_status,
      currentLevelId: swimmer.current_level_id,
      currentLevelName: swimmer.swim_levels?.name || null,
      paymentType: swimmer.payment_type,
      isVmrcClient: swimmer.is_vmrc_client,
      photoUrl: swimmer.photo_url,
      vmrcSessionsUsed: swimmer.vmrc_sessions_used,
      vmrcSessionsAuthorized: swimmer.vmrc_sessions_authorized,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Unexpected error in swimmers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}