import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { po_id } = await req.json();
    if (!po_id) throw new Error('po_id is required');

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        id, po_type, authorization_number, start_date, end_date,
        sessions_authorized, sessions_used, status,
        swimmer:swimmers (
          id, first_name, last_name, uci_number, parent_id,
          parent_email, parent_name,
          profiles!swimmers_parent_id_fkey ( full_name, email )
        ),
        coordinator:profiles!purchase_orders_coordinator_id_fkey (
          full_name, email
        )
      `)
      .eq('id', po_id)
      .single();

    if (poError || !po) throw new Error(`PO not found: ${poError?.message}`);

    const swimmer = po.swimmer as any;
    const coordinator = po.coordinator as any;
    const parentProfile = swimmer?.profiles?.[0] as any;
    const parentEmail = swimmer.parent_email || parentProfile?.email;
    const parentName = swimmer.parent_name || parentProfile?.full_name || 'there';
    const parentFirst = parentName.split(' ')[0];
    const swimmerName = `${swimmer.first_name} ${swimmer.last_name}`;
    const swimmerFirst = swimmer.first_name;
    const coordName = coordinator?.full_name || 'your coordinator';
    const coordFirst = coordName.split(' ')[0];
    const sessionsAuth = po.sessions_authorized || 12;

    // Get next upcoming booking for this swimmer
    const { data: nextBooking } = await supabase
      .from('bookings')
      .select('session_date')
      .eq('swimmer_id', swimmer.id)
      .eq('status', 'confirmed')
      .gt('session_date', new Date().toISOString().split('T')[0])
      .order('session_date', { ascending: true })
      .limit(1)
      .single();

    const deadlineDate = nextBooking?.session_date
      ? new Date(nextBooking.session_date).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        })
      : 'your next scheduled session';

    const errors = [];

    // ── COORDINATOR EMAIL (flashing red urgent alert style) ──
    if (coordinator?.email) {
      const coordSubject = `POS Required: ${swimmerName} has completed ${sessionsAuth} authorized sessions`;
      const coordHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#f0f6fa;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f6fa;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.12);">

  <!-- RED ALERT BANNER -->
  <tr><td style="background:#c0392b;padding:18px 28px;text-align:center;">
    <div style="font-size:15px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.4);">🚨 Action Required — Authorization Expiring 🚨</div>
  </td></tr>

  <!-- HERO -->
  <tr><td style="background:linear-gradient(135deg,#2A5E84 0%,#23A1C0 100%);padding:24px 36px;">
    <table cellpadding="0" cellspacing="0" width="100%"><tr>
      <td><div style="font-family:'DM Serif Display',Georgia,serif;color:#fff;font-size:20px;line-height:1.3;"><span style="display:block;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:4px;">I Can Swim Adaptive Aquatics</span>POS Renewal Notice</div></td>
      <td style="text-align:right;font-size:44px;">🏊</td>
    </tr></table>
  </td></tr>

  <!-- WARNING BADGE -->
  <tr><td style="background:#fff8e1;border-bottom:1px solid #ffe082;padding:12px 28px;">
    <div style="display:inline-flex;align-items:center;gap:10px;background:#fff3cd;border:2px solid #f9a825;border-radius:50px;padding:8px 18px;">
      <div style="width:10px;height:10px;border-radius:50%;background:#e65100;display:inline-block;"></div>
      <span style="font-size:13px;font-weight:700;color:#bf360c;letter-spacing:.04em;text-transform:uppercase;">⚠️ &nbsp;Immediate Attention Needed</span>
    </div>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:28px 36px 24px;">
    <p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#1a3347;">Hi ${coordFirst},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3d5a6e;">I hope you're doing well! I'm reaching out regarding <strong>${swimmerName}</strong> — they have <strong>completed their ${sessionsAuth} authorized sessions</strong> at I Can Swim and a new Purchase of Service (POS) is required to continue services.</p>

    <!-- SESSIONS ROW -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;background:linear-gradient(135deg,#e8f4fb,#f0fdf4);border-left:4px solid #23A1C0;border-radius:0 8px 8px 0;"><tr><td style="padding:14px 18px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:22px;padding-right:12px;">✅</td>
        <td><div style="font-size:14px;font-weight:600;color:#1a4a5e;">${sessionsAuth} of ${sessionsAuth} Authorized Sessions Completed<span style="display:block;font-size:12px;font-weight:500;color:#5a8a9e;margin-top:2px;">A new POS authorization is required to continue</span></div></td>
      </tr></table>
    </td></tr></table>

    <!-- DEADLINE BOX -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;background:#fff;border:2px solid #c0392b;border-radius:10px;"><tr><td style="padding:18px 20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#c0392b;margin-bottom:6px;">🔴 Approval Deadline</div>
      <div style="font-family:'DM Serif Display',Georgia,serif;font-size:26px;color:#1a1a1a;margin-bottom:6px;">${deadlineDate}</div>
      <div style="font-size:13px;color:#8a5050;font-weight:500;">Sessions will be cancelled if authorization is not received by this date.</div>
    </td></tr></table>

    <p style="margin:0 0 24px;font-size:14px;color:#3d5a6e;line-height:1.7;">Please note that progress reports and start/end dates have already been shared — please let us know if you need us to resend that information.</p>

    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">Thank you,<br><strong>The I Can Swim Team 📧</strong></p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f7fbfd;border-top:1px solid #e2eef5;padding:16px 36px;text-align:center;">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
      <td style="padding:0 10px;"><a href="sms:2096437969" style="font-size:12px;color:#23A1C0;text-decoration:none;">💬 Text: (209) 643-7969</a></td>
      <td style="padding:0 10px;"><a href="tel:2097787877" style="font-size:12px;color:#23A1C0;text-decoration:none;">📞 Call: (209) 778-7877</a></td>
    </tr></table>
    <p style="margin:8px 0 0;font-size:11px;color:#aaa;">I Can Swim, LLC — Turlock &amp; Modesto, California</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

      const cr = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'I Can Swim <info@icanswim209.com>', to: coordinator.email, subject: coordSubject, html: coordHtml }),
      });
      if (!cr.ok) errors.push(`Coordinator email failed: ${await cr.text()}`);
    }

    // ── PARENT EMAIL ──
    if (parentEmail) {
      const parentSubject = `Important update about ${swimmerFirst}'s upcoming lessons — I Can Swim`;
      const parentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#f0f6fa;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f6fa;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(42,94,132,.12);">

  <!-- HERO -->
  <tr><td style="background:linear-gradient(160deg,#2A5E84 0%,#23A1C0 60%,#1a8aaa 100%);padding:40px 36px 32px;text-align:center;">
    <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#FFD700;background:rgba(255,215,0,.15);border:1px solid rgba(255,215,0,.3);border-radius:50px;display:inline-block;padding:5px 16px;margin-bottom:16px;">⚠️ Action Needed</div>
    <div style="font-family:'DM Serif Display',Georgia,serif;font-size:36px;line-height:1.1;color:#fff;margin:0 0 8px;">Important Update<br>About ${swimmerFirst} 🏊</div>
    <div style="font-size:14px;color:rgba(255,255,255,.8);margin:0;">Please read and follow up with your coordinator</div>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:28px 36px 24px;">
    <p style="margin:0 0 16px;font-size:17px;font-weight:600;color:#1a3347;">Hi ${parentFirst},</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#3d5a6e;">${swimmerFirst} has reached their <strong>${sessionsAuth} sessions</strong> at I Can Swim! <strong>A new Purchase of Service (POS) is required to continue</strong>. We have already requested this from your coordinator — please follow up with <strong>${coordName}</strong> to ensure approval is submitted as soon as possible.</p>

    <!-- DEADLINE BOX -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;background:#fef2f2;border-radius:10px;border:1px solid #fecaca;"><tr><td style="padding:18px 20px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:.05em;">⚠️ Important Notice</p>
      <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.7;">Please note that if we do not receive approval before <strong>${deadlineDate}</strong>, we will need to cancel that session. All future lessons scheduled have been closed.</p>
    </td></tr></table>

    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#3d5a6e;">Please feel free to reach out if you have any questions or if additional information is needed to support the approval process. We appreciate your understanding and cooperation.</p>

    <!-- CONTACT -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 8px;background:#f8fafc;border-radius:8px;border:1px solid #e8f0f5;"><tr><td style="padding:14px 18px;">
      <p style="margin:0;font-size:13px;color:#555;line-height:1.8;">💬 Text: <strong>209-643-7969</strong><br>📞 Call: <strong>(209) 778-7877</strong><br>✉️ Email: <strong>info@icanswim209.com</strong></p>
    </td></tr></table>

    <p style="margin:16px 0 0;font-size:14px;color:#555;line-height:1.7;">Thank you,<br><strong>The I Can Swim Team 🏊</strong></p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f7fbfd;border-top:1px solid #e2eef5;padding:16px 36px;text-align:center;">
    <p style="margin:0 0 6px;font-family:'DM Serif Display',Georgia,serif;font-size:15px;color:#2A5E84;">The I Can Swim Team 🌊</p>
    <p style="margin:0 0 8px;font-size:12px;color:#8fa8bc;">Serving families in Modesto &amp; Turlock, CA</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
      <td style="padding:0 10px;"><a href="sms:2096437969" style="font-size:12px;color:#23A1C0;text-decoration:none;">💬 Text: (209) 643-7969</a></td>
      <td style="padding:0 10px;"><a href="tel:2097787877" style="font-size:12px;color:#23A1C0;text-decoration:none;">📞 Call: (209) 778-7877</a></td>
    </tr></table>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

      const pr = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'I Can Swim <info@icanswim209.com>', to: parentEmail, subject: parentSubject, html: parentHtml }),
      });
      if (!pr.ok) errors.push(`Parent email failed: ${await pr.text()}`);
    }

    // Update escalated_at and flip future bookings to pending_auth
    await supabase.from('purchase_orders').update({ escalated_at: new Date().toISOString() }).eq('id', po_id);
    await supabase.from('bookings').update({ status: 'pending_auth', updated_at: new Date().toISOString() })
      .eq('swimmer_id', swimmer.id).eq('status', 'confirmed').gt('session_date', new Date().toISOString().split('T')[0]);

    return new Response(
      JSON.stringify({ success: true, errors: errors.length ? errors : undefined }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('po-warning error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
