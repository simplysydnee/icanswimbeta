import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
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
    const { action, startDate, endDate, instructorId } = body;

    if (!action || !startDate || !endDate) {
      return NextResponse.json({ error: 'action, startDate, and endDate are required' }, { status: 400 });
    }

    if (!['approve_all', 'mark_processed'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let query = supabase
      .from('time_entries')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    const { data: timeEntries, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (action === 'approve_all') {
      // Approve all pending entries
      const pendingEntries = timeEntries?.filter(entry => entry.status === 'pending') || [];

      if (pendingEntries.length === 0) {
        return NextResponse.json({ message: 'No pending entries to approve' });
      }

      const { error: updateError } = await supabase
        .from('time_entries')
        .update({ status: 'approved' })
        .in('id', pendingEntries.map(e => e.id));

      if (updateError) throw updateError;

      return NextResponse.json({
        message: `Approved ${pendingEntries.length} pending entries`,
        approvedCount: pendingEntries.length
      });
    } else if (action === 'mark_processed') {
      // Mark all approved entries as processed for payroll
      const approvedEntries = timeEntries?.filter(entry =>
        entry.status === 'approved' && !entry.payroll_processed
      ) || [];

      if (approvedEntries.length === 0) {
        return NextResponse.json({ message: 'No approved entries to mark as processed' });
      }

      const { error: updateError } = await supabase
        .from('time_entries')
        .update({
          payroll_processed: true,
          payroll_processed_at: new Date().toISOString(),
          payroll_processed_by: user?.id
        })
        .in('id', approvedEntries.map(e => e.id));

      if (updateError) throw updateError;

      return NextResponse.json({
        message: `Marked ${approvedEntries.length} approved entries as processed for payroll`,
        processedCount: approvedEntries.length
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in bulk timecards API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}