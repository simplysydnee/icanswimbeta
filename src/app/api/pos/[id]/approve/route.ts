import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyParentPOSApproved } from '@/lib/email/pos-notifications';

export const dynamic = 'force-dynamic';

// POST - Approve a purchase order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { authorization_number, approve_pending_auth } = body;

    let newStatus: string;

    if (authorization_number) {
      // Full approval with auth number
      newStatus = 'active';
    } else if (approve_pending_auth) {
      // Approved but waiting for auth number
      newStatus = 'approved_pending_auth';
    } else {
      return NextResponse.json({
        error: 'Must provide authorization_number or set approve_pending_auth to true'
      }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      status: newStatus,
      coordinator_id: user.id
    };

    if (authorization_number) {
      updateData.authorization_number = authorization_number;
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        swimmer:swimmers(id, first_name, last_name, parent_id,
          parent:profiles!parent_id(full_name, email)),
        funding_source:funding_sources(id, name, short_name)
      `)
      .single();

    if (error) {
      console.error('Error approving PO:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send notification to parent
    if (data.swimmer?.parent?.email) {
      await notifyParentPOSApproved({
        swimmerName: `${data.swimmer.first_name} ${data.swimmer.last_name}`,
        swimmerDOB: data.swimmer.date_of_birth,
        parentName: data.swimmer.parent.full_name || 'Parent',
        parentEmail: data.swimmer.parent.email,
        fundingSource: data.funding_source?.name || 'Funding Source',
        poType: data.po_type,
        sessionsAuthorized: data.sessions_authorized,
        startDate: data.start_date,
        endDate: data.end_date,
        authorizationNumber: data.authorization_number
      });
    }

    return NextResponse.json({
      data,
      message: authorization_number
        ? 'Purchase order approved with authorization number'
        : 'Purchase order approved pending authorization number'
    });
  } catch (error) {
    console.error('POS approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}