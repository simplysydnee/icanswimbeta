import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RolloverClient } from '@/lib/email/pos-notifications';
import { generateApproveToken, getApproveUrl } from '@/lib/po-utils';

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
    // Determine fiscal year dates
    const today = new Date();
    const fiscalYearEnd = new Date(today.getFullYear(), 5, 30); // June 30
    const july1 = new Date(today.getFullYear(), 6, 1); // July 1
    const oct1 = new Date(today.getFullYear(), 9, 1); // October 1 (July 1 + 3 calendar months)

    const fiscalYearEndStr = fiscalYearEnd.toISOString().split('T')[0];
    const july1Str = july1.toISOString().split('T')[0];
    const oct1Str = oct1.toISOString().split('T')[0];

    results.push(`Fiscal year end: ${fiscalYearEndStr}, New PO period: ${july1Str} to ${oct1Str}`);

    // Find all active lesson POs ending on fiscal year end that require authorization
    const { data: pos, error: posError } = await serviceSupabase
      .from('purchase_orders')
      .select(`
        id, swimmer_id, funding_source_id, coordinator_id,
        sessions_authorized, sessions_used,
        swimmer:swimmers (
          id, first_name, last_name, uci_number,
          funding_coordinator_name, funding_coordinator_email
        )
      `)
      .eq('po_type', 'lessons')
      .in('status', ['active', 'approved_pending_auth'])
      .eq('end_date', fiscalYearEndStr)
      .not('swimmer.funding_coordinator_email', 'is', null);

    if (posError) {
      console.error('Error fetching POs for rollover:', posError);
      return NextResponse.json({ error: 'Failed to fetch POs' }, { status: 500 });
    }

    results.push(`Found ${pos?.length ?? 0} active POs ending ${fiscalYearEndStr}`);

    // Group by coordinator email (case-insensitive, trimmed)
    const coordinatorMap = new Map<
      string,
      {
        name: string;
        clients: Array<{
          poId: string;
          swimmerId: string;
          swimmerName: string;
          uciNumber: string | null;
          fundingSourceId: string | null;
          coordinatorId: string | null;
          sessionsRemaining: number;
        }>;
      }
    >();

    for (const po of pos || []) {
      const swimmer = Array.isArray(po.swimmer) ? po.swimmer[0] : po.swimmer;
      if (!swimmer) continue;

      const coordinatorEmail = (swimmer.funding_coordinator_email ?? '').trim().toLowerCase();
      const coordinatorName = (swimmer.funding_coordinator_name ?? '').trim();
      if (!coordinatorEmail) continue;

      const sessionsRemaining = (po.sessions_authorized ?? 0) - (po.sessions_used ?? 0);

      // Exhaust old PO regardless of whether there are sessions to carry over
      await serviceSupabase
        .from('purchase_orders')
        .update({ status: 'exhausted', exhausted_at: now, updated_at: now })
        .eq('id', po.id);

      if (sessionsRemaining <= 0) {
        results.push(`PO ${po.id} exhausted (0 sessions remaining, no carry-over)`);
        continue;
      }

      if (!coordinatorMap.has(coordinatorEmail)) {
        coordinatorMap.set(coordinatorEmail, { name: coordinatorName, clients: [] });
      }

      coordinatorMap.get(coordinatorEmail)!.clients.push({
        poId: po.id,
        swimmerId: swimmer.id,
        swimmerName: `${swimmer.first_name ?? ''} ${swimmer.last_name ?? ''}`.trim(),
        uciNumber: swimmer.uci_number,
        fundingSourceId: po.funding_source_id,
        coordinatorId: po.coordinator_id,
        sessionsRemaining,
      });
    }

    results.push(`Grouped into ${coordinatorMap.size} coordinators`);

    // Process each coordinator group
    let totalClients = 0;
    let totalCreatedPOs = 0;
    let coordinatorsWithPos = 0;

    for (const [email, group] of coordinatorMap) {
      const rolloverClients: RolloverClient[] = [];

      for (const client of group.clients) {
        // Generate approve token (30-day expiry)
        const token = generateApproveToken();
        const approveUrl = getApproveUrl(token);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Create new PO (July 1 – October 1, carrying over remaining sessions)
        const { data: newPO, error: createError } = await serviceSupabase
          .from('purchase_orders')
          .insert({
            swimmer_id: client.swimmerId,
            funding_source_id: client.fundingSourceId,
            coordinator_id: client.coordinatorId,
            po_type: 'lessons',
            sessions_authorized: client.sessionsRemaining,
            sessions_used: 0,
            sessions_booked: 0,
            start_date: july1Str,
            end_date: oct1Str,
            status: 'pending',
            approve_token: token,
            approve_token_expires_at: expiresAt,
            notes: `Fiscal year rollover. Carrying ${client.sessionsRemaining} sessions from PO ${client.poId}. New authorization number required.`,
          })
          .select('id')
          .single();

        if (createError || !newPO) {
          console.error(`Failed to create rollover PO for ${client.swimmerName}:`, createError);
          results.push(`Rollover FAILED for ${client.swimmerName}: ${createError?.message}`);
          continue;
        }

        totalCreatedPOs++;
        rolloverClients.push({
          poId: newPO.id,
          swimmerName: client.swimmerName,
          uciNumber: client.uciNumber,
          sessionsRemaining: client.sessionsRemaining,
          approveToken: token,
          approveUrl,
        });

        results.push(`PO ${client.poId} → new PO ${newPO.id} for ${client.swimmerName} (${client.sessionsRemaining} sessions)`);
      }

      if (rolloverClients.length > 0) {
        totalClients += rolloverClients.length;
        coordinatorsWithPos++;
        results.push(`Rollover POs created for ${group.name || email} (${rolloverClients.length} clients)`);
      }
    }

    // Send admin notification
    if (totalClients > 0) {
      const adminHtml = buildAdminRolloverNotification(totalClients, coordinatorsWithPos, totalCreatedPOs);
      const adminSubject = `7/1 Fiscal Year Rollover Complete — ${totalClients} clients across ${coordinatorsWithPos} coordinators`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'I Can Swim Billing <billing@icanswim209.com>',
          reply_to: 'info@icanswim209.com',
          to: ['sutton@icanswim209.com', 'lauren@icanswim209.com', 'info@icanswim209.com'],
          subject: adminSubject,
          html: adminHtml,
        }),
      });

      results.push(`Admin notification sent`);
    }

    return NextResponse.json({
      success: true,
      totalClients,
      totalCreatedPOs,
      coordinatorCount: coordinatorsWithPos,
      results,
      newPeriod: { start: july1Str, end: oct1Str },
    });
  } catch (error) {
    console.error('fiscal-year-rollover error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildAdminRolloverNotification(
  totalClients: number,
  coordinatorCount: number,
  totalCreatedPOs: number,
): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:40px 16px;background:#f0f6fa;font-family:Helvetica,Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#2A5E84,#23A1C0);padding:20px 28px;">
    <div style="color:#fff;font-size:18px;font-weight:700;">I Can Swim — Fiscal Year Rollover Complete ✅</div>
  </div>
  <div style="padding:24px 28px;">
    <div style="background:#f0fdf4;border-radius:8px;border:1px solid #9FE1CB;padding:14px 18px;margin-bottom:18px;">
      <div style="font-size:15px;font-weight:600;color:#085041;margin-bottom:4px;">7/1 Fiscal Year Rollover Complete</div>
      <div style="font-size:13px;color:#0F6E56;line-height:1.6;">
        The fiscal year rollover has been processed successfully. Old POs ending June 30 have been exhausted and new POs have been created for the July 1 – October 1 period.
      </div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
      <tr><td style="padding:5px 0;color:#5a7a8e;width:160px;">Total clients carried over</td><td style="padding:5px 0;font-weight:600;color:#1a3347;">${totalClients}</td></tr>
      <tr><td style="padding:5px 0;color:#5a7a8e;">New POs created</td><td style="padding:5px 0;font-weight:600;color:#1a3347;">${totalCreatedPOs}</td></tr>
      <tr><td style="padding:5px 0;color:#5a7a8e;">Coordinators notified</td><td style="padding:5px 0;font-weight:600;color:#1a3347;">${coordinatorCount}</td></tr>
      <tr><td style="padding:5px 0;color:#5a7a8e;">New PO period</td><td style="padding:5px 0;font-weight:600;color:#1a3347;">July 1 – October 1</td></tr>
    </table>
  </div>
  <div style="background:#f7fbfd;border-top:1px solid #e2eef5;padding:14px 28px;text-align:center;font-size:11px;color:#8fa8bc;">
    I Can Swim Adaptive Aquatics — Turlock & Modesto, CA
  </div>
</div>
</body></html>`;
}
