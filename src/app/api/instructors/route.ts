import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use service role key to bypass RLS for public instructor listing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // First get user IDs with instructor role from user_roles table
    console.log('Fetching instructor user IDs from user_roles table...');
    const { data: instructorRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'instructor');

    if (rolesError) {
      console.error('Error fetching instructor roles:', rolesError);
      return NextResponse.json({ error: 'Failed to fetch instructor roles' }, { status: 500 });
    }

    const instructorIds = instructorRoles?.map(role => role.user_id) || [];

    if (instructorIds.length === 0) {
      console.log('No instructors found in user_roles table');
      return NextResponse.json([]);
    }

    // Then get profiles for those IDs with display_on_team = true
    console.log('Fetching instructor profiles for IDs:', instructorIds);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .eq('display_on_team', true)
      .eq('is_active', true)
      .in('id', instructorIds);

    if (profilesError) {
      console.error('Error fetching instructor profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch instructor profiles' }, { status: 500 });
    }

    const instructorList = profiles || [];

    // Sort by full_name client-side
    instructorList.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    console.log('Instructor list after processing:', instructorList);

    // Transform snake_case to camelCase
    const transformedData = instructorList.map(profile => ({
      id: profile.id,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      email: profile.email,
    }));

    console.log('Transformed data:', transformedData);
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Unexpected error in instructors API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}