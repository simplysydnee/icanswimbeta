import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['admin', 'instructor'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        sessions!inner (
          id,
          start_time,
          instructor_id,
          session_type,
          location
        ),
        swimmers!inner (
          id,
          first_name,
          last_name,
          payment_type,
          funding_source_id,
          assessment_status,
          parent:profiles!swimmers_parent_id_fkey (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('status', 'confirmed')
      .eq('sessions.session_type', 'assessment')
      .eq('swimmers.assessment_status', 'scheduled');

    if (error) {
      console.error('Error fetching scheduled-assessment swimmers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled swimmers', details: error.message },
        { status: 500 }
      );
    }

    const instructorIds = Array.from(
      new Set(
        (bookings || [])
          .map((b: any) => b.sessions?.instructor_id)
          .filter(Boolean)
      )
    );

    const instructorNameById: Record<string, string> = {};
    if (instructorIds.length > 0) {
      const { data: instructors } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', instructorIds);
      for (const inst of instructors || []) {
        instructorNameById[inst.id] = inst.full_name || '';
      }
    }

    const rows = (bookings || [])
      .filter((b: any) => b.sessions && b.swimmers)
      .map((b: any) => {
        const session = b.sessions;
        const swimmer = b.swimmers;
        const parent = swimmer.parent || null;
        return {
          swimmerId: swimmer.id,
          swimmerName: `${swimmer.first_name} ${swimmer.last_name}`,
          paymentType: swimmer.payment_type || null,
          fundingSourceId: swimmer.funding_source_id || null,
          parentName: parent?.full_name || null,
          parentEmail: parent?.email || null,
          bookingId: b.id,
          sessionId: session.id,
          sessionStartTime: session.start_time,
          sessionLocation: session.location || null,
          instructorId: session.instructor_id || null,
          instructorName:
            (session.instructor_id && instructorNameById[session.instructor_id]) ||
            null,
        };
      })
      .sort((a: any, b: any) => {
        const ta = a.sessionStartTime ? new Date(a.sessionStartTime).getTime() : 0;
        const tb = b.sessionStartTime ? new Date(b.sessionStartTime).getTime() : 0;
        return ta - tb;
      });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Unexpected error in scheduled-swimmers route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
