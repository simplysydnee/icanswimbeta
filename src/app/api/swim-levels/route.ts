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

    // Fetch swim levels ordered by sequence
    const { data, error } = await supabase
      .from('swim_levels')
      .select('id, name, display_name, description, sequence')
      .order('sequence', { ascending: true });

    if (error) {
      console.error('Error fetching swim levels:', error);
      return NextResponse.json({ error: 'Failed to fetch swim levels' }, { status: 500 });
    }

    // Transform snake_case to camelCase
    const transformedData = (data || []).map(level => ({
      id: level.id,
      name: level.name,
      displayName: level.display_name,
      description: level.description,
      sequence: level.sequence,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Unexpected error in swim-levels API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}