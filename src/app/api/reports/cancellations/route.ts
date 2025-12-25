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

    // Get cancelled bookings
    let query = supabase
      .from('bookings')
      .select(`
        id,
        status,
        created_at,
        canceled_at,
        cancel_reason,
        swimmer:swimmers(id, first_name, last_name),
        session:sessions(id, start_time)
      `)
      .eq('status', 'cancelled');

    if (startDate) {
      query = query.gte('canceled_at', startDate);
    }
    if (endDate) {
      query = query.lte('canceled_at', endDate);
    }

    const { data: cancellations, error } = await query;

    if (error) throw error;

    // Get total bookings for rate calculation
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    // Calculate late cancellations (< 24 hours before session)
    const lateCancellations = cancellations?.filter(c => {
      if (!c.canceled_at || !c.session?.start_time) return false;
      const cancelTime = new Date(c.canceled_at);
      const sessionTime = new Date(c.session.start_time);
      const hoursBeforeSession = (sessionTime.getTime() - cancelTime.getTime()) / (1000 * 60 * 60);
      return hoursBeforeSession < 24 && hoursBeforeSession > 0;
    }).length || 0;

    // By swimmer
    const bySwimmer: Record<string, { name: string; count: number }> = {};
    cancellations?.forEach(c => {
      if (c.swimmer) {
        const name = `${c.swimmer.first_name} ${c.swimmer.last_name}`;
        if (!bySwimmer[c.swimmer.id]) {
          bySwimmer[c.swimmer.id] = { name, count: 0 };
        }
        bySwimmer[c.swimmer.id].count++;
      }
    });

    // By reason
    const byReason: Record<string, number> = {};
    cancellations?.forEach(c => {
      const reason = c.cancel_reason || 'Not specified';
      byReason[reason] = (byReason[reason] || 0) + 1;
    });

    // By date for trend
    const byDate: Record<string, number> = {};
    cancellations?.forEach(c => {
      if (c.canceled_at) {
        const date = new Date(c.canceled_at).toISOString().split('T')[0];
        byDate[date] = (byDate[date] || 0) + 1;
      }
    });

    const totalCancellations = cancellations?.length || 0;
    const cancellationRate = totalBookings ? ((totalCancellations / totalBookings) * 100).toFixed(1) : 0;

    return NextResponse.json({
      total: totalCancellations,
      totalBookings,
      cancellationRate,
      lateCancellations,
      regularCancellations: totalCancellations - lateCancellations,
      bySwimmer: Object.values(bySwimmer).sort((a, b) => b.count - a.count),
      byReason,
      byDate: Object.entries(byDate).map(([date, count]) => ({ date, count })),
      cancellations
    });
  } catch (error: any) {
    console.error('Cancellations report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}