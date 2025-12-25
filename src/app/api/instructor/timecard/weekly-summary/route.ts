import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

    const { data: entries, error } = await supabase
      .from('time_entries')
      .select('hours_worked')
      .eq('instructor_id', user.id)
      .gte('clock_in', weekStart.toISOString())
      .lte('clock_in', weekEnd.toISOString());

    if (error) throw error;

    const totalHours = entries?.reduce((sum, e) => sum + (e.hours_worked || 0), 0) || 0;

    return NextResponse.json({
      totalHours,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}