import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // ========== STEP 1: Authentication ==========
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ========== STEP 2: Authorization ==========
    // Check if user is admin using user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // ========== STEP 3: Fetch Funding Sources ==========
    const { data, error } = await supabase
      .from('funding_sources')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching funding sources:', error);
      return NextResponse.json(
        { error: `Failed to fetch funding sources: ${error.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 4: Return Response ==========
    return NextResponse.json({
      fundingSources: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Get funding sources error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}