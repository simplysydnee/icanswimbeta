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

    // Query profiles with display_on_team = true to get instructors
    console.log('Fetching instructors from profiles where display_on_team = true...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .eq('display_on_team', true)
      .eq('is_active', true);

    if (profilesError) {
      console.error('Error fetching instructors from profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch instructors' }, { status: 500 });
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