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
    const start = searchParams.get('start') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const end = searchParams.get('end') || new Date().toISOString();

    // Get coordinator billing data using the database function
    const { data: coordinatorData, error: coordinatorError } = await supabase
      .rpc('get_coordinator_authorization_metrics', {
        start_date: start,
        end_date: end
      });

    if (coordinatorError) {
      console.error('Error fetching coordinator billing:', coordinatorError);
      // Fallback to direct query if function doesn't exist yet
      return await getCoordinatorBillingFallback(supabase, start, end);
    }

    // Get swimmers with POS issues
    const { data: swimmersWithIssues, error: swimmersError } = await supabase
      .rpc('get_swimmers_with_pos_issues');

    // Calculate status breakdown
    const statusBreakdown = calculateStatusBreakdown(coordinatorData || []);

    // Calculate summary
    const summary = {
      total_coordinators: coordinatorData?.length || 0,
      total_overdue_pos: coordinatorData?.reduce((sum, c) => sum + (c.overdue_pos || 0), 0) || 0,
      total_overdue_balance: coordinatorData?.reduce((sum, c) => sum + (c.overdue_balance_cents || 0), 0) || 0,
      avg_response_days: coordinatorData?.reduce((sum, c) => sum + (c.avg_response_days || 0), 0) / (coordinatorData?.length || 1) || 0,
      total_pending_pos: coordinatorData?.reduce((sum, c) => sum + (c.pending_count || 0), 0) || 0
    };

    return NextResponse.json({
      coordinators: coordinatorData || [],
      swimmersWithIssues: swimmersWithIssues || [],
      summary,
      statusBreakdown
    });
  } catch (error: any) {
    console.error('Coordinator billing report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getCoordinatorBillingFallback(supabase: any, start: string, end: string) {
  try {
    // Fallback query if the database function doesn't exist
    const { data: swimmers, error: swimmersError } = await supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        vmrc_coordinator_name,
        vmrc_coordinator_email,
        vmrc_sessions_used,
        vmrc_sessions_authorized,
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
          total_pos: 0,
          approved_pos: 0,
          pending_pos: 0,
          overdue_pos: 0,
          avg_days_to_approve: 0,
          overdue_balance_cents: 0,
          approval_rate_percent: 0,
          pos_list: []
        };
      }

      const coordinator = coordinatorsMap[coordinatorKey];
      coordinator.swimmer_count++;

      if (swimmer.purchase_orders) {
        swimmer.purchase_orders.forEach((po: any) => {
          coordinator.total_pos++;
          coordinator.pos_list.push(po);

          if (po.status === 'approved') {
            coordinator.approved_pos++;
            if (po.submitted_at && po.approved_at) {
              const days = (new Date(po.approved_at).getTime() - new Date(po.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
              coordinator.avg_days_to_approve += days;
            }
          } else if (po.status === 'pending') {
            coordinator.pending_pos++;
            if (po.submitted_at) {
              const daysPending = (new Date().getTime() - new Date(po.submitted_at).getTime()) / (1000 * 60 * 60 * 24);
              if (daysPending > 14) {
                coordinator.overdue_pos++;
              }
            }
          }

          if (po.billing_status === 'overdue') {
            coordinator.overdue_balance_cents += (po.billed_amount_cents || 0) - (po.paid_amount_cents || 0);
          }
        });
      }
    });

    // Convert map to array and calculate final metrics
    const coordinatorData = Object.values(coordinatorsMap).map((coordinator: any) => {
      const avgDaysToApprove = coordinator.approved_pos > 0 ?
        coordinator.avg_days_to_approve / coordinator.approved_pos : 0;

      const approvalRate = coordinator.total_pos > 0 ?
        (coordinator.approved_pos / coordinator.total_pos) * 100 : 0;

      return {
        ...coordinator,
        avg_days_to_approve: avgDaysToApprove,
        approval_rate_percent: approvalRate
      };
    });

    // Get swimmers with POS issues
    const swimmersWithIssues = swimmers
      .filter((swimmer: any) => {
        const hasPendingPO = swimmer.purchase_orders?.some((po: any) => po.status === 'pending');
        const sessionsExceeded = swimmer.vmrc_sessions_used >= swimmer.vmrc_sessions_authorized - 2;
        const hasOverdueBalance = swimmer.purchase_orders?.some((po: any) => po.billing_status === 'overdue');
        return hasPendingPO || sessionsExceeded || hasOverdueBalance;
      })
      .map((swimmer: any) => {
        const pendingPO = swimmer.purchase_orders?.find((po: any) => po.status === 'pending');
        const overduePO = swimmer.purchase_orders?.find((po: any) => po.billing_status === 'overdue');

        return {
          swimmer_name: `${swimmer.first_name} ${swimmer.last_name}`,
          coordinator_name: swimmer.vmrc_coordinator_name,
          coordinator_email: swimmer.vmrc_coordinator_email,
          sessions_used: swimmer.vmrc_sessions_used,
          sessions_authorized: swimmer.vmrc_sessions_authorized,
          pos_status: pendingPO?.status || overduePO?.billing_status || 'none',
          pos_requested: pendingPO?.submitted_at || overduePO?.submitted_at,
          days_pending: pendingPO?.submitted_at ?
            (new Date().getTime() - new Date(pendingPO.submitted_at).getTime()) / (1000 * 60 * 60 * 24) : 0,
          overdue_balance_cents: overduePO ?
            (overduePO.billed_amount_cents || 0) - (overduePO.paid_amount_cents || 0) : 0
        };
      });

    // Calculate status breakdown
    const statusBreakdown = calculateStatusBreakdown(coordinatorData);

    // Calculate summary
    const summary = {
      total_coordinators: coordinatorData.length,
      total_overdue_pos: coordinatorData.reduce((sum, c) => sum + (c.overdue_pos || 0), 0),
      total_overdue_balance: coordinatorData.reduce((sum, c) => sum + (c.overdue_balance_cents || 0), 0),
      avg_response_days: coordinatorData.reduce((sum, c) => sum + (c.avg_days_to_approve || 0), 0) / coordinatorData.length || 0,
      total_pending_pos: coordinatorData.reduce((sum, c) => sum + (c.pending_pos || 0), 0)
    };

    return NextResponse.json({
      coordinators: coordinatorData,
      swimmersWithIssues,
      summary,
      statusBreakdown
    });
  } catch (error: any) {
    console.error('Fallback coordinator billing error:', error);
    throw error;
  }
}

function calculateStatusBreakdown(coordinatorData: any[]) {
  const statusCounts: Record<string, number> = {
    'approved': 0,
    'pending': 0,
    'overdue': 0,
    'expired': 0,
    'other': 0
  };

  coordinatorData.forEach((coordinator: any) => {
    // This is a simplified version - in the real implementation with the database function,
    // we would have actual status counts
    statusCounts.approved += coordinator.approved_pos || 0;
    statusCounts.pending += coordinator.pending_pos || 0;
    statusCounts.overdue += coordinator.overdue_pos || 0;
  });

  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  return Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
}