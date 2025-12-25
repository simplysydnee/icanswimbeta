import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users with instructor role
    const { data: instructorRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'instructor');

    const instructorIds = instructorRoles?.map(r => r.user_id) || [];

    const { data: instructors, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, pay_rate_cents, employment_type, created_at')
      .in('id', instructorIds)
      .order('full_name');

    if (error) throw error;

    return NextResponse.json({ instructors });
  } catch (error: any) {
    console.error('Error in team API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}