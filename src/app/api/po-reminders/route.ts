import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  notifyCoordinatorPendingRenewalPO,
  notifyCoordinatorPOExtension,
  notifyParentPendingAuth,
  notifyCoordinatorEnterAuthNumber,
} from '@/lib/email/pos-notifications';

export async function POST(request: Request) {
  // Validate cron secret
  const authHeader = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env' }, { status: 500 });
  }

  const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);
  const results: string[] = [];
  const now = new Date().toISOString();

  try {
    // === Sequence 1: Pending POs at day 7 ===
    // POs where status = 'pending', approved_at IS NULL, created_at <= NOW() - 7 days, reminder_sent_at IS NULL
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: pendingPOs } = await serviceSupabase
      .from('purchase_orders')
      .select('id, swimmer_id, is_extension')
      .eq('status', 'pending')
      .is('approved_at', null)
      .is('reminder_sent_at', null)
      .lte('created_at', sevenDaysAgo);

    if (pendingPOs) {
      for (const po of pendingPOs) {
        try {
          // Resend coordinator email based on PO type
          if (po.is_extension) {
            await notifyCoordinatorPOExtension(po.id);
          } else {
            await notifyCoordinatorPendingRenewalPO(po.id);
          }

          // Send parent pending auth email
          await notifyParentPendingAuth(po.swimmer_id);

          // Mark reminder as sent
          await serviceSupabase
            .from('purchase_orders')
            .update({ reminder_sent_at: now })
            .eq('id', po.id);

          results.push(`Day-7 reminder sent for PO ${po.id}`);
        } catch (poError) {
          console.error(`Failed to process PO ${po.id}:`, poError);
          results.push(`Day-7 reminder FAILED for PO ${po.id}`);
        }
      }
    }

    // === Sequence 2: Approved POs awaiting auth number at day 3 ===
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data: approvedPOs } = await serviceSupabase
      .from('purchase_orders')
      .select('id')
      .eq('status', 'approved_pending_auth')
      .is('authorization_number', null)
      .is('auth_reminder_sent_at', null)
      .lte('approved_at', threeDaysAgo);

    if (approvedPOs) {
      for (const po of approvedPOs) {
        try {
          await notifyCoordinatorEnterAuthNumber(po.id);

          await serviceSupabase
            .from('purchase_orders')
            .update({ auth_reminder_sent_at: now })
            .eq('id', po.id);

          results.push(`Auth-number reminder sent for PO ${po.id}`);
        } catch (poError) {
          console.error(`Failed to process auth reminder for PO ${po.id}:`, poError);
          results.push(`Auth-number reminder FAILED for PO ${po.id}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      pendingCount: pendingPOs?.length ?? 0,
      authPendingCount: approvedPOs?.length ?? 0,
    });
  } catch (error) {
    console.error('po-reminders cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
