import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) return new Response(buildErrorPage('Invalid link', 'This approval link is missing a token.'), { headers: { 'Content-Type': 'text/html' }, status: 400 });

    // Find PO by token
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        id, status, approve_token_expires_at, approved_at,
        swimmer_id, sessions_authorized,
        swimmer:swimmers(first_name, last_name, uci_number, funding_coordinator_name, funding_coordinator_email)
      `)
      .eq('approve_token', token)
      .single();

    if (poError || !po) return new Response(buildErrorPage('Link not found', 'This approval link is invalid or has already been used.'), { headers: { 'Content-Type': 'text/html' }, status: 404 });

    // Check expiry
    if (po.approve_token_expires_at && new Date(po.approve_token_expires_at) < new Date()) {
      return new Response(buildErrorPage('Link expired', 'This approval link has expired. Please contact I Can Swim to request a new one.'), { headers: { 'Content-Type': 'text/html' }, status: 410 });
    }

    const swimmer = po.swimmer as any;
    const swimmerName = `${swimmer.first_name} ${swimmer.last_name}`;
    const coordName = swimmer.funding_coordinator_name || 'Coordinator';

    // Already approved — show status page
    if (po.approved_at) {
      return new Response(buildAlreadyApprovedPage(swimmerName, po.approved_at), { headers: { 'Content-Type': 'text/html' }, status: 200 });
    }

    // Capture audit info
    const coordinatorIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const approvedAt = new Date().toISOString();
    const approvedDateFormatted = new Date(approvedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const approvedTimeFormatted = new Date(approvedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    // Update PO — set approved_pending_auth + timestamp + audit trail
    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({
        status: 'approved_pending_auth',
        approved_at: approvedAt,
        comments: `Approved by coordinator via email link on ${approvedDateFormatted} at ${approvedTimeFormatted} PT. IP: ${coordinatorIp}`,
        updated_at: approvedAt,
      })
      .eq('id', po.id);

    if (updateError) throw updateError;

    // Flip pending_auth bookings back to confirmed — lessons can proceed
    await supabase
      .from('bookings')
      .update({ status: 'confirmed', updated_at: approvedAt })
      .eq('swimmer_id', po.swimmer_id)
      .eq('status', 'pending_auth')
      .gt('session_date', new Date().toISOString().split('T')[0]);

    // Notify admin team
    const notifyHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:40px 16px;background:#f0f6fa;font-family:Helvetica,Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
  <div style="background:#2A5E84;padding:20px 28px;">
    <div style="color:#fff;font-size:18px;font-weight:700;">I Can Swim — POS Approved ✅</div>
  </div>
  <div style="padding:24px 28px;">
    <div style="background:#f0fdf4;border-radius:8px;border:1px solid #9FE1CB;padding:14px 18px;margin-bottom:18px;">
      <div style="font-size:15px;font-weight:600;color:#085041;margin-bottom:4px;">POS Approved by Coordinator</div>
      <div style="font-size:13px;color:#0F6E56;line-height:1.6;">${coordName} has approved the POS request for <strong>${swimmerName}</strong> and confirmed submission to billing.</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
      <tr><td style="padding:5px 0;color:#5a7a8e;width:140px;">Client</td><td style="padding:5px 0;font-weight:600;color:#1a3347;">${swimmerName}</td></tr>
      <tr><td style="padding:5px 0;color:#5a7a8e;">Approved by</td><td style="padding:5px 0;font-weight:600;color:#1a3347;">${coordName}</td></tr>
      <tr><td style="padding:5px 0;color:#5a7a8e;">Approved at</td><td style="padding:5px 0;font-weight:600;color:#1a3347;">${approvedDateFormatted} at ${approvedTimeFormatted} PT</td></tr>
      <tr><td style="padding:5px 0;color:#5a7a8e;">Status</td><td style="padding:5px 0;"><span style="background:#fff3cd;color:#7a5000;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">Approved — Pending Auth Number</span></td></tr>
    </table>
    <div style="margin-top:18px;font-size:13px;color:#5a7a8e;line-height:1.6;">Upcoming lessons for ${swimmerName} have been moved back to <strong>Confirmed</strong>. Enter the auth number in the platform when received from VMRC billing.</div>
    <div style="margin-top:14px;text-align:center;">
      <a href="https://icanswimbeta.vercel.app/admin/pos" style="display:inline-block;background:#2A5E84;color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:13px;font-weight:600;">Enter Auth Number →</a>
    </div>
  </div>
  <div style="background:#f7fbfd;border-top:1px solid #e2eef5;padding:14px 28px;text-align:center;font-size:11px;color:#8fa8bc;">
    I Can Swim Adaptive Aquatics — Turlock & Modesto, CA
  </div>
</div>
</body></html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'I Can Swim Billing <billing@icanswim209.com>',
        reply_to: 'info@icanswim209.com',
        to: ['sutton@icanswim209.com', 'lauren@icanswim209.com', 'info@icanswim209.com'],
        subject: `✅ POS Approved — ${swimmerName} (enter auth number when received)`,
        html: notifyHtml,
      }),
    });

    // Return success page to coordinator
    return new Response(buildSuccessPage(swimmerName, coordName, approvedAt), {
      headers: { 'Content-Type': 'text/html' }, status: 200
    });

  } catch (error) {
    console.error('po-approve error:', error);
    return new Response(buildErrorPage('Something went wrong', 'An error occurred. Please contact info@icanswim209.com or call (209) 778-7877.'), {
      headers: { 'Content-Type': 'text/html' }, status: 500
    });
  }
});

function buildSuccessPage(swimmerName: string, coordName: string, approvedAt: string): string {
  const approvedDate = new Date(approvedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const approvedTime = new Date(approvedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>POS Approved</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/></head>
<body style="margin:0;padding:0;background:#f0f6fa;font-family:'DM Sans',Helvetica,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="max-width:480px;width:100%;margin:40px 16px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(42,94,132,.12);">
  <div style="background:linear-gradient(135deg,#2A5E84,#23A1C0);padding:32px 36px;text-align:center;">
    <div style="font-size:48px;margin-bottom:12px;">✅</div>
    <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;">Thank you, ${coordName.split(' ')[0]}!</div>
    <div style="font-size:14px;color:rgba(255,255,255,.8);">POS request recorded</div>
  </div>
  <div style="padding:28px 32px;">
    <div style="background:#f0fdf4;border-radius:10px;border:1px solid #9FE1CB;padding:16px 18px;margin-bottom:20px;">
      <div style="font-size:14px;font-weight:600;color:#085041;margin-bottom:8px;">Approval recorded:</div>
      <div style="font-size:13px;color:#0F6E56;line-height:1.8;">
        Client: <strong>${swimmerName}</strong><br>
        Approved: <strong>${approvedDate} at ${approvedTime} PT</strong><br>
        Status: <strong>Approved — Pending Auth Number</strong>
      </div>
    </div>
    <p style="font-size:14px;color:#3d5a6e;line-height:1.7;margin:0 0 16px;">By clicking Approve, you confirmed that lessons may resume and that you have submitted a POS request to your billing department for processing.</p>
    <p style="font-size:14px;color:#3d5a6e;line-height:1.7;margin:0 0 20px;">${swimmerName}'s upcoming lessons are now confirmed. Please enter the authorization number in your portal once received from VMRC billing — typically within 5–7 business days.</p>
    <div style="text-align:center;">
      <a href="https://icanswimbeta.vercel.app/coordinator/pos" style="display:inline-block;background:#2A5E84;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:600;">Enter auth number in portal →</a>
    </div>
  </div>
  <div style="background:#f7fbfd;border-top:1px solid #e2eef5;padding:16px 32px;text-align:center;">
    <div style="font-size:12px;color:#8fa8bc;">Questions? Call <a href="tel:2097787877" style="color:#23A1C0;">(209) 778-7877</a> or email <a href="mailto:info@icanswim209.com" style="color:#23A1C0;">info@icanswim209.com</a></div>
  </div>
</div>
</body></html>`;
}

function buildAlreadyApprovedPage(swimmerName: string, approvedAt: string): string {
  const approvedDate = new Date(approvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Already Approved</title></head>
<body style="margin:0;padding:40px 16px;background:#f0f6fa;font-family:Helvetica,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="max-width:440px;background:#fff;border-radius:16px;padding:32px;text-align:center;box-shadow:0 8px 40px rgba(42,94,132,.12);">
  <div style="font-size:48px;margin-bottom:16px;">✅</div>
  <div style="font-size:20px;font-weight:600;color:#1a3347;margin-bottom:8px;">Already approved</div>
  <div style="font-size:14px;color:#5a7a8e;line-height:1.7;">This POS request for <strong>${swimmerName}</strong> was already approved on <strong>${approvedDate}</strong>. No further action needed.</div>
  <div style="margin-top:20px;font-size:13px;color:#8a9eb0;">Questions? Call (209) 778-7877</div>
</div>
</body></html>`;
}

function buildErrorPage(title: string, message: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${title}</title></head>
<body style="margin:0;padding:40px 16px;background:#f0f6fa;font-family:Helvetica,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="max-width:440px;background:#fff;border-radius:16px;padding:32px;text-align:center;box-shadow:0 8px 40px rgba(42,94,132,.12);">
  <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
  <div style="font-size:20px;font-weight:600;color:#1a3347;margin-bottom:8px;">${title}</div>
  <div style="font-size:14px;color:#5a7a8e;line-height:1.7;">${message}</div>
  <div style="margin-top:20px;font-size:13px;color:#8a9eb0;">Questions? Call (209) 778-7877 or email info@icanswim209.com</div>
</div>
</body></html>`;
}
