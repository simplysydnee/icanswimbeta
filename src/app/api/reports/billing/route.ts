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

    // Query purchase orders with CORRECT column names
    const { data: purchaseOrders, error } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        swimmer_id,
        coordinator_id,
        po_type,
        authorization_number,
        sessions_authorized,
        sessions_booked,
        sessions_used,
        start_date,
        end_date,
        status,
        notes,
        billing_status,
        billed_amount_cents,
        paid_amount_cents,
        billed_at,
        paid_at,
        invoice_number,
        payment_reference,
        billing_notes,
        due_date,
        created_at,
        updated_at,
        swimmer:swimmers(id, first_name, last_name, payment_type)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Billing query error:', error);
      throw error;
    }

    // Calculate stats with structure expected by BillingReport component
    const poStatus = {
      pending: purchaseOrders?.filter(po => po.status === 'pending').length || 0,
      in_progress: purchaseOrders?.filter(po => po.status === 'in_progress').length || 0,
      approved: purchaseOrders?.filter(po => po.status === 'approved').length || 0,
      completed: purchaseOrders?.filter(po => po.status === 'completed').length || 0,
      expired: purchaseOrders?.filter(po => po.status === 'expired').length || 0,
    };

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

    const totalBilled = purchaseOrders?.reduce((sum, po) => sum + (po.billed_amount_cents || 0), 0) || 0;
    const totalPaid = purchaseOrders?.reduce((sum, po) => sum + (po.paid_amount_cents || 0), 0) || 0;
    const totalOutstanding = totalBilled - totalPaid;
    const totalOverdue = purchaseOrders?.reduce((sum, po) => {
      if (po.billing_status === 'billed' && po.due_date && new Date(po.due_date) < new Date()) {
        const billed = po.billed_amount_cents || 0;
        const paid = po.paid_amount_cents || 0;
        return sum + (billed - paid);
      }
      return sum;
    }, 0) || 0;

    // For now, return empty objects for byFundingSource, byCoordinator, and problemPOs
    // These would need more complex queries to populate
    const byFundingSource: Record<string, any> = {};
    const byCoordinator: Record<string, any> = {};
    const problemPOs: any[] = [];

    const stats = {
      poStatus,
      billingStatus,
      financial: {
        totalBilled: totalBilled / 100, // Convert cents to dollars
        totalPaid: totalPaid / 100,
        totalOutstanding: totalOutstanding / 100,
        totalOverdue: totalOverdue / 100,
      },
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