import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { format } from 'date-fns';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason, notify_parents } = body;

    // Get session with bookings
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        instructor:profiles!instructor_id(full_name),
        bookings(
          id,
          status,
          swimmer:swimmers(first_name, last_name),
          parent:profiles!parent_id(id, full_name, email)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update session status to cancelled
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'cancelled',
        notes_tags: reason || 'Cancelled due to instructor time off',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // Cancel all active bookings
    const activeBookings = session.bookings?.filter((b: any) => b.status !== 'cancelled') || [];

    for (const booking of activeBookings) {
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancel_reason: reason || 'Session cancelled due to staffing',
          cancel_source: 'admin',
          canceled_at: new Date().toISOString(),
          canceled_by: user.id
        })
        .eq('id', booking.id);
    }

    // Send emails to parents
    const notifiedParents: string[] = [];
    const emailErrors: string[] = [];

    if (notify_parents && activeBookings.length > 0) {
      // Get unique parents with their swimmers
      const parentSwimmers = new Map<string, { parent: any; swimmers: string[] }>();

      activeBookings.forEach((b: any) => {
        if (b.parent?.email) {
          const existing = parentSwimmers.get(b.parent.id);
          const swimmerName = `${b.swimmer?.first_name || ''} ${b.swimmer?.last_name || ''}`.trim();

          if (existing) {
            existing.swimmers.push(swimmerName);
          } else {
            parentSwimmers.set(b.parent.id, {
              parent: b.parent,
              swimmers: [swimmerName]
            });
          }
        }
      });

      // Send email to each parent
      for (const [parentId, data] of parentSwimmers) {
        const swimmerNames = data.swimmers.join(' and ');

        const result = await emailService.sendSessionCancellation({
          parentEmail: data.parent.email,
          instructorName: session.instructor?.full_name || 'Instructor',
          date: format(new Date(session.start_time), 'EEEE, MMMM d, yyyy'),
          reason: 'Staff unavailable',
          swimmerNames: data.swimmers
        });

        if (result.success) {
          notifiedParents.push(data.parent.email);
        } else {
          emailErrors.push(data.parent.email);
        }
      }
    }

    return NextResponse.json({
      success: true,
      cancelled_bookings: activeBookings.length,
      notified_parents: notifiedParents,
      email_errors: emailErrors
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}