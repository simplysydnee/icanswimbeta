import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing Supabase env (service role)');
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid funding source id' }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      //.eq('role', 'coordinator')
      .eq('funding_source_id', id)
      .order('full_name');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch coordinators', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ coordinators: data ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Server error', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
