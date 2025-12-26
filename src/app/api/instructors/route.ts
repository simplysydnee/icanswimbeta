import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Query instructors from user_roles table with profile join
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        profile:profiles(id, full_name, avatar_url, email)
      `)
      .eq('role', 'instructor');

    if (roleError) {
      console.error('Error fetching instructors from user_roles:', roleError);
      return NextResponse.json({ error: 'Failed to fetch instructors' }, { status: 500 });
    }

    const instructorList = roleData
      ?.map(r => {
        // Handle case where profile might be an array
        const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
        return profile;
      })
      .filter(Boolean) || [];

    // Sort by full_name client-side
    instructorList.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    // Transform snake_case to camelCase
    const transformedData = instructorList.map(profile => ({
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