import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  notifyCoordinatorPendingRenewalPO,
  sendCoordinatorRenewalEmail,
} from '@/lib/email/pos-notifications';

export const dynamic = 'force-dynamic';

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

    // Optional admin overrides — when present, send the edited content verbatim.
    let overrides: { subject?: string; html?: string } = {};
    try {
      const raw = await request.text();
      if (raw) overrides = JSON.parse(raw);
    } catch {
      // Empty or non-JSON body → fall through to auto-generated send.
    }
    const hasOverrides = typeof overrides.subject === 'string'
      && overrides.subject.length > 0
      && typeof overrides.html === 'string'
      && overrides.html.length > 0;

    // Fetch PO with swimmer + coordinator info
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        id, po_type, status, swimmer_id,
        sessions_authorized, start_date, end_date, notes,
        swimmer:swimmers(
          id, first_name, last_name,
          funding_coordinator_name, funding_coordinator_email
        )
      `)
      .eq('id', params.id)
      .single();

    if (poError || !po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 });
    }

    const swimmer = Array.isArray(po.swimmer) ? po.swimmer[0] : po.swimmer;
    const coordinatorName = swimmer?.funding_coordinator_name?.trim() || 'Coordinator';
    const coordinatorEmail = swimmer?.funding_coordinator_email?.trim();

    if (!coordinatorEmail) {
      return NextResponse.json(
        { error: 'No coordinator email on file for this swimmer' },
        { status: 400 }
      );
    }

    if (hasOverrides) {
      await sendCoordinatorRenewalEmail({
        to: coordinatorEmail,
        subject: overrides.subject!,
        html: overrides.html!,
      });
    } else {
      // Auto-generated send — backward compatible.
      await notifyCoordinatorPendingRenewalPO(params.id);
    }

    // Update notes with sent timestamp
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const existingNotes = po.notes || '';
    const updatedNotes = existingNotes
      ? `${existingNotes}\nRenewal email sent ${dateStr}`
      : `Renewal email sent ${dateStr}`;

    await supabase
      .from('purchase_orders')
      .update({ notes: updatedNotes })
      .eq('id', params.id);

    return NextResponse.json({
      success: true,
      coordinatorName,
      coordinatorEmail,
    });
  } catch (error) {
    console.error('Error sending renewal email:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
