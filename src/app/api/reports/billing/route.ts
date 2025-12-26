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

    // Calculate stats with CORRECT field names
    const stats = {
      total_pos: purchaseOrders?.length || 0,
      active_pos: purchaseOrders?.filter(po => po.status === 'approved' || po.status === 'in_progress').length || 0,
      pending_pos: purchaseOrders?.filter(po => po.status === 'pending').length || 0,

      // Session stats
      total_sessions_authorized: purchaseOrders?.reduce((sum, po) => sum + (po.sessions_authorized || 0), 0) || 0,
      total_sessions_used: purchaseOrders?.reduce((sum, po) => sum + (po.sessions_used || 0), 0) || 0,
      total_sessions_booked: purchaseOrders?.reduce((sum, po) => sum + (po.sessions_booked || 0), 0) || 0,

      // Billing stats
      total_billed_cents: purchaseOrders?.reduce((sum, po) => sum + (po.billed_amount_cents || 0), 0) || 0,
      total_paid_cents: purchaseOrders?.reduce((sum, po) => sum + (po.paid_amount_cents || 0), 0) || 0,
      outstanding_cents: purchaseOrders?.reduce((sum, po) => {
        const billed = po.billed_amount_cents || 0;
        const paid = po.paid_amount_cents || 0;
        return sum + (billed - paid);
      }, 0) || 0,

      // Billing status counts
      unbilled: purchaseOrders?.filter(po => !po.billing_status || po.billing_status === 'unbilled').length || 0,
      billed: purchaseOrders?.filter(po => po.billing_status === 'billed').length || 0,
      paid: purchaseOrders?.filter(po => po.billing_status === 'paid').length || 0,
      overdue: purchaseOrders?.filter(po =>
        po.billing_status === 'billed' &&
        po.due_date &&
        new Date(po.due_date) < new Date()
      ).length || 0,
    };

    return NextResponse.json({
      purchase_orders: purchaseOrders || [],
      stats,
      month,
      year
    });
  } catch (error: any) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}