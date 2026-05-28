import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildCoordinatorPendingRenewalPayload } from '@/lib/email/pos-notifications';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await buildCoordinatorPendingRenewalPayload(params.id);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unable to build renewal email — PO missing, swimmer missing, or no coordinator email on file' },
        { status: 400 },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error building renewal email draft:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
