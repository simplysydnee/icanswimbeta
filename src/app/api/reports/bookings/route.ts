import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error('Error fetching user roles:', roleError);
      return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 });
    }

    const isAdmin = userRoles?.some(role => role.role === 'admin') || false;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get all bookings with related data
    let query = supabase
      .from('bookings')
      .select(`
        id,
        status,
        created_at,
        canceled_at,
        cancel_reason,
        swimmer:swimmers(id, first_name, last_name, payment_type),
        session:sessions(id, start_time, instructor_id)
      `);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    // Calculate stats
    const total = bookings?.length || 0;
    const confirmed = bookings?.filter(b => b.status === 'confirmed').length || 0;
    const completed = bookings?.filter(b => b.status === 'completed').length || 0;
    const cancelled = bookings?.filter(b => b.status === 'cancelled').length || 0;
    const noShow = bookings?.filter(b => b.status === 'no_show').length || 0;


    // Group by date for chart
    const byDate: Record<string, number> = {};
    bookings?.forEach(b => {
      const date = new Date(b.created_at).toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    });

    return NextResponse.json({
      total,
      byStatus: { confirmed, completed, cancelled, noShow },
      byDate: Object.entries(byDate).map(([date, count]) => ({ date, count })),
      bookings
    });
  } catch (error: any) {
    console.error('Bookings report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}