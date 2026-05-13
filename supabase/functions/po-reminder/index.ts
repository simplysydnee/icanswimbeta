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

    // Fetch PO with swimmer, coordinator, and funding source
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        id, po_type, authorization_number, start_date, end_date,
        sessions_authorized, sessions_used, sessions_booked, status, notes,
        swimmers (
          first_name, last_name, uci_number,
          funding_sources ( name )
        ),
        coordinator:profiles!purchase_orders_coordinator_id_fkey (
          full_name, email
        )
      `)
      .eq('id', po_id)
      .single();

    if (poError || !po) throw new Error(`PO not found: ${poError?.message}`);

    const swimmer = po.swimmers as any;
    const coordinator = po.coordinator as any;
    const fundingSource = swimmer?.funding_sources as any;

    if (!coordinator?.email) throw new Error('Coordinator email not found');

    const swimmerName = `${swimmer.first_name} ${swimmer.last_name}`;
    const uciNumber = swimmer.uci_number || 'N/A';
    const poType = po.po_type === 'assessment' ? 'Initial Assessment' : 'Swim Lessons';
    const fundingName = fundingSource?.name || 'Regional Center';
    const startDate = po.start_date ? new Date(po.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
    const endDate = po.end_date ? new Date(po.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
    const sessionsInfo = `${po.sessions_used || 0} used of ${po.sessions_authorized || 0} authorized`;

    const subject = `Action Required: Purchase Order Needed for ${swimmerName} — I Can Swim`;

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f0f6fa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f6fa;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background-color:#1a3a4f;padding:32px 40px;text-align:center;">
          <div style="color:#ffffff;font-size:22px;font-weight:600;letter-spacing:1px;">I CAN SWIM</div>
          <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px;">Adaptive Swim Lessons</div>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:15px;color:#4a6070;">Hi ${coordinator.full_name || 'Coordinator'},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#4a6070;line-height:1.6;">This is a reminder that a Purchase Order is needed for one of your clients currently enrolled in I Can Swim.</p>

          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;background-color:#f8fafc;border-radius:10px;border:1px solid #e8f0f5;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#1a3a4f;text-transform:uppercase;letter-spacing:0.5px;">Client Details</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4a6070;">
                <tr><td style="padding:4px 0;color:#8aa0ae;">Client Name</td><td style="padding:4px 0;font-weight:600;color:#1a3a4f;text-align:right;">${swimmerName}</td></tr>
                <tr><td style="padding:4px 0;color:#8aa0ae;">UCI Number</td><td style="padding:4px 0;font-weight:600;color:#1a3a4f;text-align:right;">${uciNumber}</td></tr>
                <tr><td style="padding:4px 0;color:#8aa0ae;">Service Type</td><td style="padding:4px 0;font-weight:600;color:#1a3a4f;text-align:right;">${poType}</td></tr>
                <tr><td style="padding:4px 0;color:#8aa0ae;">Funding Source</td><td style="padding:4px 0;font-weight:600;color:#1a3a4f;text-align:right;">${fundingName}</td></tr>
                <tr><td style="padding:4px 0;color:#8aa0ae;">Start Date</td><td style="padding:4px 0;font-weight:600;color:#1a3a4f;text-align:right;">${startDate}</td></tr>
                <tr><td style="padding:4px 0;color:#8aa0ae;">End Date</td><td style="padding:4px 0;font-weight:600;color:#1a3a4f;text-align:right;">${endDate}</td></tr>
                <tr><td style="padding:4px 0;color:#8aa0ae;">Sessions</td><td style="padding:4px 0;font-weight:600;color:#1a3a4f;text-align:right;">${sessionsInfo}</td></tr>
                ${po.authorization_number ? `<tr><td style="padding:4px 0;color:#8aa0ae;">Auth Number</td><td style="padding:4px 0;font-weight:600;color:#1a3a4f;text-align:right;">${po.authorization_number}</td></tr>` : ''}
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 28px;font-size:14px;color:#4a6070;line-height:1.6;">Please submit or update the Purchase Order at your earliest convenience so we can continue providing services without interruption.</p>

          <p style="margin:0;font-size:13px;color:#8aa0ae;line-height:1.7;">Questions? Call or text us at <strong>(209) 778-7877</strong> or email <strong>info@icanswim209.com</strong></p>
        </td></tr>
        <tr><td style="border-top:1px solid #e8f0f5;padding:20px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;color:#bdd0d9;letter-spacing:2px;text-transform:uppercase;">I Can Swim, LLC</p>
          <p style="margin:0;font-size:11px;color:#bdd0d9;">Turlock &amp; Modesto, California</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'I Can Swim <info@icanswim209.com>',
        to: coordinator.email,
        subject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) throw new Error(`Resend error: ${await resendResponse.text()}`);

    // Update reminder_sent_at
    await supabase
      .from('purchase_orders')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', po_id);

    const resendData = await resendResponse.json();
    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });

  } catch (error) {
    console.error('Error in po-reminder:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
    });
  }
});
