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

    // Get instructor profiles directly from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .eq('role', 'instructor')
      .order('full_name', { ascending: true });

    if (profilesError) {
      console.error('Error fetching instructor profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch instructors' }, { status: 500 });
    }

    // Transform snake_case to camelCase
    const transformedData = (profiles || []).map(profile => ({
      id: profile.id,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      email: profile.email,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Unexpected error in instructors API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}