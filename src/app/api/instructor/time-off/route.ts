import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: requests, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ requests: requests || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from('time_off_requests')
      .insert({
        instructor_id: user.id,
        start_date: body.start_date,
        end_date: body.end_date,
        is_all_day: body.is_all_day ?? true,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
        reason_type: body.reason_type,
        notes: body.notes || null
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ request: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}