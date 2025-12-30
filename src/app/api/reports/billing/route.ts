import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Query purchase orders with all necessary joins
    const { data: purchaseOrders, error } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        swimmer_id,
        funding_source_id,
        coordinator_id,
        status,
        authorization_number,
        created_at,
        updated_at,
        billing_status,
        billed_amount_cents,
        paid_amount_cents,
        due_date,
        billed_at,
        paid_at,
        invoice_number,
        payment_reference,
        billing_notes,
        swimmer:swimmers(id, first_name, last_name, payment_type),
        funding_source:funding_sources(id, name, short_name),
        coordinator:coordinators(id, full_name, email, phone)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Billing query error:', error);
      throw error;
    }

    // Calculate basic stats
    const totalBilledCents = purchaseOrders?.reduce((sum, po) => sum + (po.billed_amount_cents || 0), 0) || 0;
    const totalPaidCents = purchaseOrders?.reduce((sum, po) => sum + (po.paid_amount_cents || 0), 0) || 0;
    const outstandingCents = totalBilledCents - totalPaidCents;

    // Calculate PO status counts
    const poStatus = {
      pending: purchaseOrders?.filter(po => po.status === 'pending').length || 0,
      in_progress: purchaseOrders?.filter(po => po.status === 'in_progress').length || 0,
      approved: purchaseOrders?.filter(po => po.status === 'approved').length || 0,
      completed: purchaseOrders?.filter(po => po.status === 'completed').length || 0,
      expired: purchaseOrders?.filter(po => po.status === 'expired').length || 0,
    };

    // Calculate billing status counts
    const billingStatus = {
      unbilled: purchaseOrders?.filter(po => !po.billing_status || po.billing_status === 'unbilled').length || 0,
      billed: purchaseOrders?.filter(po => po.billing_status === 'billed').length || 0,
      paid: purchaseOrders?.filter(po => po.billing_status === 'paid').length || 0,
      partial: purchaseOrders?.filter(po => po.billing_status === 'partial').length || 0,
      overdue: purchaseOrders?.filter(po =>
        po.billing_status === 'billed' &&
        po.due_date &&
        new Date(po.due_date) < new Date()
      ).length || 0,
      disputed: purchaseOrders?.filter(po => po.billing_status === 'disputed').length || 0,
    };

    // Calculate financial summary (convert cents to dollars)
    const financial = {
      totalBilled: totalBilledCents / 100,
      totalPaid: totalPaidCents / 100,
      totalOutstanding: outstandingCents / 100,
      totalOverdue: purchaseOrders?.reduce((sum, po) => {
        if (po.billing_status === 'billed' && po.due_date && new Date(po.due_date) < new Date()) {
          const billed = po.billed_amount_cents || 0;
          const paid = po.paid_amount_cents || 0;
          return sum + (billed - paid);
        }
        return sum;
      }, 0) / 100 || 0,
    };

    // Calculate funding source breakdown
    const byFundingSource: Record<string, any> = {};
    // Calculate coordinator breakdown
    const byCoordinator: Record<string, any> = {};
    // Calculate problem POs
    const problemPOs: any[] = [];

    if (purchaseOrders) {
      purchaseOrders.forEach(po => {
        // Funding source breakdown
        if (po.funding_source && po.funding_source.length > 0) {
          const fundingSource = po.funding_source[0];
          const fsKey = fundingSource.id;
          if (!byFundingSource[fsKey]) {
            byFundingSource[fsKey] = {
              name: fundingSource.name,
              shortName: fundingSource.short_name || fundingSource.name,
              poCount: 0,
              billed: 0,
              paid: 0,
              outstanding: 0,
            };
          }
          const fs = byFundingSource[fsKey];
          fs.poCount += 1;
          fs.billed += (po.billed_amount_cents || 0) / 100;
          fs.paid += (po.paid_amount_cents || 0) / 100;
          fs.outstanding += ((po.billed_amount_cents || 0) - (po.paid_amount_cents || 0)) / 100;
        }

        // Coordinator breakdown
        if (po.coordinator && po.coordinator.length > 0) {
          const coordinator = po.coordinator[0];
          const coordKey = coordinator.id;
          if (!byCoordinator[coordKey]) {
            byCoordinator[coordKey] = {
              name: coordinator.full_name || 'Unknown',
              email: coordinator.email || '',
              phone: coordinator.phone || '',
              totalPOs: 0,
              completedAuth: 0,
              pendingAuth: 0,
              completionRate: 0,
            };
          }
          const coord = byCoordinator[coordKey];
          coord.totalPOs += 1;
          // Simplified: count approved/completed as completed auth, pending/in_progress as pending
          if (po.status === 'approved' || po.status === 'completed') {
            coord.completedAuth += 1;
          } else if (po.status === 'pending' || po.status === 'in_progress') {
            coord.pendingAuth += 1;
          }
          // Calculate completion rate
          coord.completionRate = coord.totalPOs > 0
            ? Math.round((coord.completedAuth / coord.totalPOs) * 100)
            : 0;
        }

        // Problem POs (overdue or disputed with outstanding balance)
        const outstanding = ((po.billed_amount_cents || 0) - (po.paid_amount_cents || 0)) / 100;
        if ((po.billing_status === 'overdue' || po.billing_status === 'disputed') && outstanding > 0) {
          const swimmerName = po.swimmer && po.swimmer.length > 0
            ? `${po.swimmer[0].first_name} ${po.swimmer[0].last_name}`
            : 'Unknown Swimmer';

          const coordinatorName = po.coordinator && po.coordinator.length > 0
            ? po.coordinator[0].full_name || 'Unknown'
            : 'Unknown';
          const coordinatorEmail = po.coordinator && po.coordinator.length > 0
            ? po.coordinator[0].email || ''
            : '';
          const coordinatorPhone = po.coordinator && po.coordinator.length > 0
            ? po.coordinator[0].phone || ''
            : '';
          const fundingSourceName = po.funding_source && po.funding_source.length > 0
            ? po.funding_source[0].name || 'Unknown'
            : 'Unknown';

          let daysOverdue = 0;
          if (po.due_date && po.billing_status === 'overdue') {
            try {
              const dueDate = new Date(po.due_date);
              const today = new Date();
              daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
            } catch (error) {
              console.warn('Error parsing due date:', error);
            }
          }

          problemPOs.push({
            id: po.id,
            swimmerName,
            coordinatorName,
            coordinatorEmail,
            coordinatorPhone,
            amountOwed: outstanding,
            daysOverdue,
            fundingSourceName,
            status: po.status,
            billingStatus: po.billing_status,
            dueDate: po.due_date,
          });
        }
      });
    }

    const stats = {
      poStatus,
      billingStatus,
      financial,
      byFundingSource,
      byCoordinator,
      problemPOs,
    };

    // Calculate date range for the response
    const dateRange = {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };

    return NextResponse.json({
      month,
      year,
      dateRange,
      stats,
      totalPOs: purchaseOrders?.length || 0,
    });
  } catch (error: any) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}