import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - List purchase orders (with filters)
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

    return NextResponse.json({ data: filteredData });
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