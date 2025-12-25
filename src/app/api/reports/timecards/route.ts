import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface TimecardSummary {
  instructor: {
    id: string;
    full_name: string;
    email: string;
    pay_rate_cents: number;
    employment_type: string;
  };
  timeEntries: Array<{
    id: string;
    date: string;
    clock_in: string;
    clock_out: string | null;
    hours_worked: number | null;
    status: string;
    notes: string | null;
  }>;
  totalHours: number;
  totalPay: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error('Error fetching user roles:', roleError);
      return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 });
    }

    const isAdmin = userRoles?.some(role => role.role === 'admin') || false;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    // Get all instructors
    const { data: instructorRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'instructor');

    const instructorIds = instructorRoles?.map(r => r.user_id) || [];

    const { data: instructors, error: instructorsError } = await supabase
      .from('profiles')
      .select('id, full_name, email, pay_rate_cents, employment_type')
      .in('id', instructorIds)
      .order('full_name');

    if (instructorsError) throw instructorsError;

    // Get time entries for the date range
    const { data: timeEntries, error: timeEntriesError } = await supabase
      .from('time_entries')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (timeEntriesError) throw timeEntriesError;

    // Group time entries by instructor
    const timeEntriesByInstructor = new Map<string, typeof timeEntries>();
    timeEntries?.forEach(entry => {
      if (!timeEntriesByInstructor.has(entry.instructor_id)) {
        timeEntriesByInstructor.set(entry.instructor_id, []);
      }
      timeEntriesByInstructor.get(entry.instructor_id)?.push(entry);
    });

    // Calculate summaries for each instructor
    const summaries: TimecardSummary[] = [];
    let totalHoursAll = 0;
    let totalPayAll = 0;
    let pendingCountAll = 0;
    let approvedCountAll = 0;
    let rejectedCountAll = 0;

    instructors?.forEach(instructor => {
      const instructorEntries = timeEntriesByInstructor.get(instructor.id) || [];

      const pendingCount = instructorEntries.filter(e => e.status === 'pending').length;
      const approvedCount = instructorEntries.filter(e => e.status === 'approved').length;
      const rejectedCount = instructorEntries.filter(e => e.status === 'rejected').length;

      const totalHours = instructorEntries.reduce((sum, entry) => {
        return sum + (entry.hours_worked || 0);
      }, 0);

      const totalPay = totalHours * (instructor.pay_rate_cents / 100);

      summaries.push({
        instructor,
        timeEntries: instructorEntries.map(entry => ({
          id: entry.id,
          date: entry.date,
          clock_in: entry.clock_in,
          clock_out: entry.clock_out,
          hours_worked: entry.hours_worked,
          status: entry.status,
          notes: entry.notes
        })),
        totalHours,
        totalPay,
        pendingCount,
        approvedCount,
        rejectedCount
      });

      totalHoursAll += totalHours;
      totalPayAll += totalPay;
      pendingCountAll += pendingCount;
      approvedCountAll += approvedCount;
      rejectedCountAll += rejectedCount;
    });

    return NextResponse.json({
      startDate,
      endDate,
      summaries,
      totals: {
        totalHours: totalHoursAll,
        totalPay: totalPayAll,
        pendingCount: pendingCountAll,
        approvedCount: approvedCountAll,
        rejectedCount: rejectedCountAll
      }
    });
  } catch (error: any) {
    console.error('Error in timecards report API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}