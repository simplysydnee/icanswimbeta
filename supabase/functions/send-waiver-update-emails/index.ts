import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';

// Deno types for TypeScript
/// <reference lib="deno.ns" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  parentIds?: string[]; // Optional: specific parents, or send to all
}

interface EmailResult {
  emailsSent: number;
  failed: number;
  errors: string[];
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const baseUrl = Deno.env.get('PUBLIC_APP_URL') || 'https://icanswimbeta.vercel.app';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const { parentIds }: EmailRequest = await req.json();

    // Get parents needing waiver updates
    let query = supabaseClient
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        swimmers!inner(
          id,
          first_name,
          last_name,
          enrollment_status,
          liability_waiver_signature,
          photo_video_signature,
          cancellation_policy_signature
        )
      `)
      .eq('swimmers.enrollment_status', 'enrolled');

    if (parentIds && parentIds.length > 0) {
      query = query.in('id', parentIds);
    }

    const { data: parents, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    const result: EmailResult = {
      emailsSent: 0,
      failed: 0,
      errors: []
    };

    // Process each parent
    for (const parent of parents || []) {
      try {
        // Filter swimmers needing waivers
        const swimmersNeedingWaivers = parent.swimmers.filter(
          (s: any) =>
            !s.liability_waiver_signature ||
            !s.photo_video_signature ||
            !s.cancellation_policy_signature
        );

        if (swimmersNeedingWaivers.length === 0) continue;

        // Generate secure token
        const token = generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        // Store token
        const { error: tokenError } = await supabaseClient
          .from('waiver_update_tokens')
          .insert({
            parent_id: parent.id,
            parent_email: parent.email,
            token,
            expires_at: expiresAt.toISOString(),
            used: false,
            email_sent_at: new Date().toISOString()
          });

        if (tokenError) throw tokenError;

        // Send email (using Resend or your email service)
        await sendEmail({
          to: parent.email,
          parentName: parent.full_name || 'Parent',
          swimmers: swimmersNeedingWaivers.map((s: any) =>
            `${s.first_name} ${s.last_name}`
          ),
          link: `${baseUrl}/update-waivers/${token}`
        });

        result.emailsSent++;
      } catch (error) {
        result.failed++;
        result.errors.push(`${parent.email}: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`Failed to send to ${parent.email}:`, error);
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Send emails error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sendEmail({
  to,
  parentName,
  swimmers,
  link
}: {
  to: string;
  parentName: string;
  swimmers: string[];
  link: string;
}) {
  // Use Resend, SendGrid, or your email service
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Sutton at I Can Swim <info@icanswim209.com>',
      to: [to],
      subject: `Important: Update Liability Waivers for ${swimmers.join(', ')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">Update Required: Swim Waivers</h2>

          <p>Hi ${parentName},</p>

          <p>We're moving to a new swim lesson management system! Before your next lesson,
          we need you to review and update liability waivers for your enrolled swimmers.</p>

          <p>This is required for the safety of our business and your swimmers. We update
          these waivers annually to ensure we have current information.</p>

          <p><strong>Your swimmers needing waiver updates:</strong></p>
          <ul>
            ${swimmers.map(name => `<li>${name}</li>`).join('')}
          </ul>

          <p>This will take 3-5 minutes per child.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}"
               style="background-color: #0891b2; color: white; padding: 14px 28px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Update Waivers Now
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            <strong>Important:</strong> This link expires in 30 days.
            Please complete before your next scheduled lesson.
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

          <p style="color: #666; font-size: 14px;">
            Questions? Call us at <a href="tel:2097787877">(209) 778-7877</a>
            or email <a href="mailto:info@icanswim209.com">info@icanswim209.com</a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} I Can Swim, LLC
          </p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email send failed: ${error}`);
  }
}