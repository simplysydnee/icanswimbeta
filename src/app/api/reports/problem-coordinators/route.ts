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

    // Get top problem coordinators using the database function
    const { data: problemCoordinators, error: problemError } = await supabase
      .rpc('get_top_problem_coordinators');

    if (problemError) {
      console.error('Error fetching problem coordinators:', problemError);
      // Fallback to direct query if function doesn't exist yet
      return await getProblemCoordinatorsFallback(supabase);
    }

    return NextResponse.json(problemCoordinators || []);
  } catch (error: any) {
    console.error('Problem coordinators report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getProblemCoordinatorsFallback(supabase: any) {
  try {
    // Fallback query if the database function doesn't exist
    const { data: swimmers, error: swimmersError } = await supabase
      .from('swimmers')
      .select(`
        id,
        vmrc_coordinator_name,
        vmrc_coordinator_email,
        purchase_orders(
          id,
          status,
          submitted_at,
          approved_at,
          billing_status,
          billed_amount_cents,
          paid_amount_cents
        )
      `)
      .eq('is_vmrc_client', true)
      .not('vmrc_coordinator_name', 'is', null);

    if (swimmersError) throw swimmersError;

    // Group by coordinator
    const coordinatorsMap: Record<string, any> = {};

    swimmers.forEach((swimmer: any) => {
      const coordinatorKey = `${swimmer.vmrc_coordinator_name}|${swimmer.vmrc_coordinator_email}`;

      if (!coordinatorsMap[coordinatorKey]) {
        coordinatorsMap[coordinatorKey] = {
          coordinator_name: swimmer.vmrc_coordinator_name,
          coordinator_email: swimmer.vmrc_coordinator_email,
          swimmer_count: 0,
          overdue_pos: 0,
          avg_response_days: 0,
          total_pending: 0,
          total_overdue_balance_cents: 0,
          pos_list: []
        };
      }

      const coordinator = coordinatorsMap[coordinatorKey];
      coordinator.swimmer_count++;

      if (swimmer.purchase_orders) {
        swimmer.purchase_orders.forEach((po: any) => {
          coordinator.pos_list.push(po);

          if (po.status === 'pending') {
            coordinator.total_pending++;
            if (po.submitted_at) {
              const daysPending = (new Date().getTime() - new Date(po.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
              if (daysPending > 14) {
                coordinator.overdue_pos++;
              }
              coordinator.avg_response_days += daysPending;
            }
          } else if (po.status === 'approved' && po.submitted_at && po.approved_at) {
            const responseDays = (new Date(po.approved_at).getTime() - new Date(po.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
            coordinator.avg_response_days += responseDays;
          }

          if (po.billing_status === 'overdue') {
            coordinator.total_overdue_balance_cents += (po.billed_amount_cents || 0) - (po.paid_amount_cents || 0);
          }
        });
      }
    });

    // Convert map to array, calculate averages, and filter problem coordinators
    const allCoordinators = Object.values(coordinatorsMap).map((coordinator: any) => {
      const totalResponses = coordinator.pos_list.filter((po: any) =>
        po.status === 'approved' || (po.status === 'pending' && po.submitted_at)
      ).length;

      const avgResponseDays = totalResponses > 0 ?
        coordinator.avg_response_days / totalResponses : 0;

      return {
        ...coordinator,
        avg_response_days: avgResponseDays
      };
    });

    // Filter to only problem coordinators and sort by severity
    const problemCoordinators = allCoordinators
      .filter((coordinator: any) => {
        return coordinator.overdue_pos > 0 ||
          coordinator.avg_response_days > 14 ||
          coordinator.total_overdue_balance_cents > 0;
      })
      .sort((a: any, b: any) => {
        // Sort by severity: overdue POs first, then response time, then overdue balance
        if (a.overdue_pos !== b.overdue_pos) return b.overdue_pos - a.overdue_pos;
        if (a.avg_response_days !== b.avg_response_days) return b.avg_response_days - a.avg_response_days;
        return b.total_overdue_balance_cents - a.total_overdue_balance_cents;
      })
      .slice(0, 5); // Top 5

    return NextResponse.json(problemCoordinators);
  } catch (error: any) {
    console.error('Fallback problem coordinators error:', error);
    throw error;
  }
}