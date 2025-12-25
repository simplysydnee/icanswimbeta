import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const allowedFields = ['hours_worked', 'status', 'notes', 'admin_notes'];
    const updateData: any = {};

    if (body.hoursWorked !== undefined) {
      if (body.hoursWorked < 0) {
        return NextResponse.json({ error: 'Hours worked cannot be negative' }, { status: 400 });
      }
      updateData.hours_worked = body.hoursWorked;
    }

    if (body.status && !['pending', 'approved', 'rejected'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.adminNotes !== undefined) {
      updateData.admin_notes = body.adminNotes;
    }

    const { data, error } = await supabase
      .from('time_entries')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ timeEntry: data });
  } catch (error: any) {
    console.error('Error updating time entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}