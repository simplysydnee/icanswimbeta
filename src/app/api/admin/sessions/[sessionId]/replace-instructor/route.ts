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
    const { new_instructor_id, notify_parents } = body;

    if (!new_instructor_id) {
      return NextResponse.json({ error: 'New instructor ID required' }, { status: 400 });
    }

    // Verify new instructor exists and is an instructor
    const { data: instructorRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('user_id', new_instructor_id)
      .eq('role', 'instructor')
      .single();

    if (!instructorRole) {
      return NextResponse.json({ error: 'User is not an instructor' }, { status: 400 });
    }

    // Get new instructor info
    const { data: newInstructor, error: instructorError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', new_instructor_id)
      .single();

    if (instructorError || !newInstructor) {
      return NextResponse.json({ error: 'New instructor not found' }, { status: 404 });
    }

    // Get current session with instructor and bookings
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        instructor:profiles!instructor_id(id, full_name),
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

    const previousInstructor = session.instructor;

    // Update session with new instructor
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        instructor_id: new_instructor_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // Send emails to parents
    const notifiedParents: string[] = [];
    const emailErrors: string[] = [];
    const activeBookings = session.bookings?.filter((b: any) => b.status !== 'cancelled') || [];

    if (notify_parents !== false && activeBookings.length > 0) {
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

        const result = await emailService.sendInstructorChange({
          parentEmail: data.parent.email,
          parentName: data.parent.full_name || 'Parent',
          childName: swimmerNames,
          date: format(new Date(session.start_time), 'EEEE, MMMM d, yyyy'),
          time: format(new Date(session.start_time), 'h:mm a'),
          location: session.location || 'I Can Swim',
          previousInstructor: previousInstructor?.full_name || 'Previous Instructor',
          newInstructor: newInstructor.full_name || 'New Instructor'
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
      session: {
        ...session,
        instructor: newInstructor
      },
      previous_instructor: previousInstructor,
      notified_parents: notifiedParents,
      email_errors: emailErrors
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}