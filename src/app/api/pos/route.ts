import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const dynamic = 'force-dynamic';

interface FundingSourceStats {
  id: string;
  name: string;
  code: string;
  activePOs: number;
  pendingPOs: number;
  billedAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  overdueCount: number;
}

// GET - List purchase orders (with filters) and stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const swimmerId = searchParams.get('swimmer_id');
    const coordinatorId = searchParams.get('coordinator_id');
    const search = searchParams.get('search');
    const month = searchParams.get('month'); // yyyy-MM format

    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        swimmer:swimmers(id, first_name, last_name, date_of_birth, parent_id),
        funding_source:funding_sources(id, name, short_name, type),
        coordinator:profiles!coordinator_id(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      if (status === 'pending_all') {
        query = query.in('status', ['pending', 'approved_pending_auth']);
      } else {
        query = query.eq('status', status);
      }
    }

    if (swimmerId) {
      query = query.eq('swimmer_id', swimmerId);
    }

    if (coordinatorId) {
      query = query.eq('coordinator_id', coordinatorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching POs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by search (swimmer name) if provided
    let filteredData = data;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = data?.filter(po =>
        po.swimmer?.first_name?.toLowerCase().includes(searchLower) ||
        po.swimmer?.last_name?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate stats by funding source
    const fundingSourceStats: Record<string, FundingSourceStats> = {};
    let overallStats = {
      total: 0,
      pending: 0,
      needAuth: 0,
      active: 0,
      completed: 0,
      expired: 0,
      cancelled: 0,
      unbilled: 0,
      billed: 0,
      paid: 0,
      partial: 0,
      overdue: 0,
      disputed: 0,
      totalBilled: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    };

    // Set up month filter for billing amounts
    let monthStart: Date | null = null;
    let monthEnd: Date | null = null;
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      monthStart = startOfMonth(new Date(year, monthNum - 1));
      monthEnd = endOfMonth(new Date(year, monthNum - 1));
    }

    data?.forEach(po => {
      // Overall stats
      overallStats.total++;
      if (po.status === 'pending') overallStats.pending++;
      if (po.status === 'approved_pending_auth') overallStats.needAuth++;
      if (po.status === 'active') overallStats.active++;
      if (po.status === 'completed') overallStats.completed++;
      if (po.status === 'expired') overallStats.expired++;
      if (po.status === 'cancelled') overallStats.cancelled++;

      if (po.billing_status === 'unbilled') overallStats.unbilled++;
      if (po.billing_status === 'billed') overallStats.billed++;
      if (po.billing_status === 'paid') overallStats.paid++;
      if (po.billing_status === 'partial') overallStats.partial++;
      if (po.billing_status === 'overdue') overallStats.overdue++;
      if (po.billing_status === 'disputed') overallStats.disputed++;

      // Funding source stats
      const fsId = po.funding_source?.id || 'private_pay';
      const fsName = po.funding_source?.name || 'Private Pay';
      const fsCode = po.funding_source?.short_name || 'PP';

      if (!fundingSourceStats[fsId]) {
        fundingSourceStats[fsId] = {
          id: fsId,
          name: fsName,
          code: fsCode,
          activePOs: 0,
          pendingPOs: 0,
          billedAmount: 0,
          paidAmount: 0,
          outstandingBalance: 0,
          overdueCount: 0
        };
      }

      // Count by status
      if (po.status === 'in_progress' || po.status === 'approved' || po.status === 'active') {
        fundingSourceStats[fsId].activePOs++;
      }
      if (po.status === 'pending' || po.status === 'approved_pending_auth') {
        fundingSourceStats[fsId].pendingPOs++;
      }

      // Billing amounts (filter by selected month if provided)
      let includeBilling = true;
      if (monthStart && monthEnd && po.billed_at) {
        includeBilling = isWithinInterval(new Date(po.billed_at), { start: monthStart, end: monthEnd });
      }

      if (includeBilling) {
        const billedAmount = po.billed_amount_cents || 0;
        const paidAmount = po.paid_amount_cents || 0;
        const outstanding = billedAmount - paidAmount;

        fundingSourceStats[fsId].billedAmount += billedAmount;
        fundingSourceStats[fsId].paidAmount += paidAmount;
        fundingSourceStats[fsId].outstandingBalance += outstanding;

        overallStats.totalBilled += billedAmount;
        overallStats.totalPaid += paidAmount;
        overallStats.totalOutstanding += outstanding;
      }

      // Overdue count
      if (po.billing_status === 'overdue') {
        fundingSourceStats[fsId].overdueCount++;
      }
    });

    const fundingSourceStatsArray = Object.values(fundingSourceStats);

    return NextResponse.json({
      data: filteredData,
      stats: overallStats,
      fundingSourceStats: fundingSourceStatsArray
    });
  } catch (error) {
    console.error('POS GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      swimmer_id,
      funding_source_id,
      coordinator_id,
      po_type,
      sub_code,
      sessions_authorized,
      start_date,
      end_date,
      assessment_id,
      parent_po_id,
      notes
    } = body;

    // Validate required fields
    if (!swimmer_id || !funding_source_id || !po_type || !start_date || !end_date) {
      return NextResponse.json({
        error: 'Missing required fields: swimmer_id, funding_source_id, po_type, start_date, end_date'
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert({
        swimmer_id,
        funding_source_id,
        coordinator_id,
        po_type,
        sub_code: po_type === 'assessment' ? 'ASMT' : sub_code,
        sessions_authorized: po_type === 'assessment' ? 1 : (sessions_authorized || 12),
        sessions_booked: 0,
        sessions_used: 0,
        start_date,
        end_date,
        assessment_id,
        parent_po_id,
        notes,
        status: 'pending'
      })
      .select(`
        *,
        swimmer:swimmers(id, first_name, last_name),
        funding_source:funding_sources(id, name, short_name)
      `)
      .single();

    if (error) {
      console.error('Error creating PO:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('POS POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}