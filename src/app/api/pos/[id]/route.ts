import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - Get single purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        swimmer:swimmers(id, first_name, last_name, date_of_birth, parent_id,
          parent:profiles!parent_id(full_name, email, phone)),
        funding_source:funding_sources(id, name, short_name, type),
        coordinator:profiles!coordinator_id(id, full_name, email)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching PO:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('POS GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update purchase order (approve, add auth number, etc.)
export async function PATCH(
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
    const {
      status,
      authorization_number,
      sessions_booked,
      sessions_used,
      lesson_dates,
      notes,
      cancellation_reason,
      // Billing fields
      billing_status,
      billed_amount_cents,
      paid_amount_cents,
      billed_at,
      paid_at,
      invoice_number,
      payment_reference,
      billing_notes,
      due_date
    } = body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};

    if (status !== undefined) updateData.status = status;
    if (authorization_number !== undefined) updateData.authorization_number = authorization_number;
    if (sessions_booked !== undefined) updateData.sessions_booked = sessions_booked;
    if (sessions_used !== undefined) updateData.sessions_used = sessions_used;
    if (lesson_dates !== undefined) updateData.lesson_dates = lesson_dates;
    if (notes !== undefined) updateData.notes = notes;
    if (cancellation_reason !== undefined) updateData.cancellation_reason = cancellation_reason;

    // Billing fields
    if (billing_status !== undefined) updateData.billing_status = billing_status;
    if (billed_amount_cents !== undefined) updateData.billed_amount_cents = billed_amount_cents;
    if (paid_amount_cents !== undefined) updateData.paid_amount_cents = paid_amount_cents;
    if (billed_at !== undefined) updateData.billed_at = billed_at;
    if (paid_at !== undefined) updateData.paid_at = paid_at;
    if (invoice_number !== undefined) updateData.invoice_number = invoice_number;
    if (payment_reference !== undefined) updateData.payment_reference = payment_reference;
    if (billing_notes !== undefined) updateData.billing_notes = billing_notes;
    if (due_date !== undefined) updateData.due_date = due_date;

    // If approving with auth number, set status to active
    if (authorization_number && status === 'active') {
      updateData.status = 'active';
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        swimmer:swimmers(id, first_name, last_name),
        funding_source:funding_sources(id, name, short_name)
      `)
      .single();

    if (error) {
      console.error('Error updating PO:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('POS PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Cancel/delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete - set status to cancelled
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'cancelled',
        cancellation_reason: 'Cancelled by user'
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling PO:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Purchase order cancelled' });
  } catch (error) {
    console.error('POS DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}