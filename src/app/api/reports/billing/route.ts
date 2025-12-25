import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error in billing API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug: Test connection
    console.log('Billing API called, user:', user.email);

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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Calculate date range
    const now = new Date();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth(); // 0-indexed
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = startOfMonth(new Date(targetYear, targetMonth, 1));
    const endDate = endOfMonth(new Date(targetYear, targetMonth, 1));

    // Fetch purchase orders with related data
    const { data: purchaseOrders, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        swimmer:swimmers(
          id,
          first_name,
          last_name,
          parent_id,
          parent:profiles!swimmers_parent_id_fkey(
            full_name,
            email,
            phone
          )
        ),
        funding_source:funding_sources(
          id,
          name,
          short_name,
          code,
          price_cents
        ),
        coordinator:profiles!purchase_orders_coordinator_id_fkey(
          id,
          full_name,
          email,
          phone
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (poError) {
      console.error('Error fetching purchase orders:', poError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      // PO Status counts
      poStatus: {
        pending: 0,
        in_progress: 0,
        approved: 0,
        completed: 0,
        expired: 0
      },
      // Billing Status counts
      billingStatus: {
        unbilled: 0,
        billed: 0,
        paid: 0,
        partial: 0,
        overdue: 0,
        disputed: 0
      },
      // Financial totals
      financial: {
        totalBilled: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        totalOverdue: 0
      },
      // Funding source breakdown
      byFundingSource: {} as Record<string, {
        name: string;
        shortName: string;
        poCount: number;
        billed: number;
        paid: number;
        outstanding: number;
      }>,
      // Coordinator breakdown
      byCoordinator: {} as Record<string, {
        name: string;
        email: string;
        phone: string;
        totalPOs: number;
        completedAuth: number;
        pendingAuth: number;
        completionRate: number;
      }>,
      // Problem POs
      problemPOs: [] as Array<{
        id: string;
        swimmerName: string;
        coordinatorName: string;
        coordinatorEmail: string;
        coordinatorPhone: string;
        amountOwed: number;
        daysOverdue: number;
        fundingSourceName: string;
        status: string;
        billingStatus: string;
        dueDate: string | null;
      }>
    };

    // Process each purchase order
    purchaseOrders?.forEach(po => {
      // PO Status counts
      if (po.status && stats.poStatus.hasOwnProperty(po.status)) {
        stats.poStatus[po.status as keyof typeof stats.poStatus]++;
      }

      // Billing Status counts - check if billing_status column exists
      const billingStatus = (po as any).billing_status;
      if (billingStatus && stats.billingStatus.hasOwnProperty(billingStatus)) {
        stats.billingStatus[billingStatus as keyof typeof stats.billingStatus]++;
      }

      // Financial totals - check if billing columns exist
      const billed = (po as any).billed_amount_cents || 0;
      const paid = (po as any).paid_amount_cents || 0;
      const outstanding = billed - paid;

      stats.financial.totalBilled += billed;
      stats.financial.totalPaid += paid;
      stats.financial.totalOutstanding += outstanding;

      // Check if overdue - check if due_date column exists
      const dueDate = (po as any).due_date;
      if (dueDate && billingStatus === 'overdue') {
        try {
          const parsedDueDate = parseISO(dueDate);
          const today = new Date();
          const daysOverdue = Math.max(0, Math.floor((today.getTime() - parsedDueDate.getTime()) / (1000 * 60 * 60 * 24)));
          stats.financial.totalOverdue += outstanding;
          // Note: daysOverdue is calculated but not used in this section, only in problemPOs
        } catch (error) {
          console.warn('Error parsing due date:', error);
        }
      }

      // Funding source breakdown
      if (po.funding_source) {
        const fsKey = po.funding_source.id;
        if (!stats.byFundingSource[fsKey]) {
          stats.byFundingSource[fsKey] = {
            name: po.funding_source.name,
            shortName: po.funding_source.short_name || po.funding_source.name,
            poCount: 0,
            billed: 0,
            paid: 0,
            outstanding: 0
          };
        }
        stats.byFundingSource[fsKey].poCount++;
        stats.byFundingSource[fsKey].billed += billed;
        stats.byFundingSource[fsKey].paid += paid;
        stats.byFundingSource[fsKey].outstanding += outstanding;
      }

      // Coordinator breakdown
      if (po.coordinator) {
        const coordKey = po.coordinator.id;
        if (!stats.byCoordinator[coordKey]) {
          stats.byCoordinator[coordKey] = {
            name: po.coordinator.full_name || 'Unknown',
            email: po.coordinator.email || '',
            phone: po.coordinator.phone || '',
            totalPOs: 0,
            completedAuth: 0,
            pendingAuth: 0,
            completionRate: 0
          };
        }
        stats.byCoordinator[coordKey].totalPOs++;

        // Check if authorization is completed (has authorization_number)
        if (po.authorization_number) {
          stats.byCoordinator[coordKey].completedAuth++;
        } else {
          stats.byCoordinator[coordKey].pendingAuth++;
        }
      }

      // Problem POs (overdue or disputed with outstanding balance)
      if ((billingStatus === 'overdue' || billingStatus === 'disputed') && outstanding > 0) {
        const swimmerName = po.swimmer
          ? `${po.swimmer.first_name} ${po.swimmer.last_name}`
          : 'Unknown Swimmer';

        const coordinatorName = po.coordinator?.full_name || 'Unknown';
        const coordinatorEmail = po.coordinator?.email || '';
        const coordinatorPhone = po.coordinator?.phone || '';
        const fundingSourceName = po.funding_source?.name || 'Unknown';

        let daysOverdue = 0;
        if (dueDate && billingStatus === 'overdue') {
          try {
            const parsedDueDate = parseISO(dueDate);
            const today = new Date();
            daysOverdue = Math.max(0, Math.floor((today.getTime() - parsedDueDate.getTime()) / (1000 * 60 * 60 * 24)));
          } catch (error) {
            console.warn('Error parsing due date for problem PO:', error);
          }
        }

        stats.problemPOs.push({
          id: po.id,
          swimmerName,
          coordinatorName,
          coordinatorEmail,
          coordinatorPhone,
          amountOwed: outstanding / 100, // Convert cents to dollars
          daysOverdue,
          fundingSourceName,
          status: po.status,
          billingStatus: billingStatus || 'unknown',
          dueDate: dueDate || null
        });
      }
    });

    // Calculate completion rates for coordinators
    Object.keys(stats.byCoordinator).forEach(key => {
      const coord = stats.byCoordinator[key];
      coord.completionRate = coord.totalPOs > 0
        ? Math.round((coord.completedAuth / coord.totalPOs) * 100)
        : 0;
    });

    // Sort problem POs by days overdue (descending)
    stats.problemPOs.sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Convert financial totals to dollars
    const financialInDollars = {
      totalBilled: stats.financial.totalBilled / 100,
      totalPaid: stats.financial.totalPaid / 100,
      totalOutstanding: stats.financial.totalOutstanding / 100,
      totalOverdue: stats.financial.totalOverdue / 100
    };

    // Convert funding source amounts to dollars
    const byFundingSourceInDollars = Object.entries(stats.byFundingSource).reduce((acc, [key, data]) => {
      acc[key] = {
        ...data,
        billed: data.billed / 100,
        paid: data.paid / 100,
        outstanding: data.outstanding / 100
      };
      return acc;
    }, {} as typeof stats.byFundingSource);

    return NextResponse.json({
      month: targetMonth + 1,
      year: targetYear,
      dateRange: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      stats: {
        poStatus: stats.poStatus,
        billingStatus: stats.billingStatus,
        financial: financialInDollars,
        byFundingSource: byFundingSourceInDollars,
        byCoordinator: stats.byCoordinator,
        problemPOs: stats.problemPOs
      },
      totalPOs: purchaseOrders?.length || 0
    });

  } catch (error: any) {
    console.error('Error in billing report API:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}