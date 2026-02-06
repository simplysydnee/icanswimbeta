import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';

// Deno types for TypeScript
/// <reference lib="deno.ns" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  parentIds?: string[]; // Optional: specific parents by ID, or send to all
  parentEmails?: string[]; // Optional: specific parents by email
}

interface EmailResult {
  emailsSent: number;
  failed: number;
  errors: string[];
  details?: {
    sent: Array<{
      parentId: string | null;
      parentEmail: string;
      parentName: string;
      swimmerCount: number;
      token: string;
    }>;
    failed: Array<{
      email: string;
      error: string;
    }>;
  };
}

// Helper function: Extract name from email
function extractNameFromEmail(email: string): string {
  if (!email) return 'Parent';

  const localPart = email.split('@')[0];
  const cleaned = localPart
    .replace(/\d+/g, '')
    .replace(/[_.-]/g, ' ')
    .trim();

  const words = cleaned.split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  return words.length > 0 ? words.join(' ') : 'Parent';
}

// Helper function: Get parent name from profile
async function getParentNameFromProfile(supabaseClient: any, parentId: string): Promise<string> {
  const { data } = await supabaseClient
    .from('profiles')
    .select('full_name')
    .eq('id', parentId)
    .single();

  return data?.full_name || 'Parent';
}

// Main function: Get parents with incomplete waivers (CORRECTED VERSION)
async function getParentsWithIncompleteWaivers(supabaseClient: any) {
  // Get all enrolled swimmers with parent info
  const { data: swimmers, error } = await supabaseClient
    .from('swimmers')
    .select(`
      id,
      parent_id,
      parent_email,
      first_name,
      last_name,
      signed_waiver,
      liability_waiver_signature,
      photo_video_permission,
      photo_video_signature,
      cancellation_policy_signature
    `)
    .eq('enrollment_status', 'enrolled')
    .not('parent_email', 'is', null);

  if (error) {
    console.error('[getParentsWithIncompleteWaivers] Query error:', error);
    throw error;
  }

  if (!swimmers || swimmers.length === 0) {
    return [];
  }

  console.log(`[getParentsWithIncompleteWaivers] Found ${swimmers.length} enrolled swimmers with parent emails`);

  // Group swimmers by parent (use parent_id if exists, otherwise parent_email)
  const parentMap = new Map();

  for (const swimmer of swimmers) {
    const parentKey = swimmer.parent_id || swimmer.parent_email;

    if (!parentKey) {
      console.warn('[getParentsWithIncompleteWaivers] Skipping swimmer with no parent info:', swimmer.id);
      continue;
    }

    // Check if swimmer has complete waivers
    const hasLiability = !!(swimmer.signed_waiver && swimmer.liability_waiver_signature);
    const hasPhotoRelease = !!(swimmer.photo_video_permission && swimmer.photo_video_signature);
    const hasCancellationPolicy = !!swimmer.cancellation_policy_signature;
    const isComplete = hasLiability && hasPhotoRelease && hasCancellationPolicy;

    // Skip if already complete
    if (isComplete) {
      continue;
    }

    // Initialize parent entry if not exists
    if (!parentMap.has(parentKey)) {
      parentMap.set(parentKey, {
        parentId: swimmer.parent_id,
        parentEmail: swimmer.parent_email,
        parentName: 'Parent', // Will be set later
        swimmers: []
      });
    }

    // Add swimmer to parent's list
    const parent = parentMap.get(parentKey);
    parent.swimmers.push({
      id: swimmer.id,
      firstName: swimmer.first_name,
      lastName: swimmer.last_name
    });
  }

  // Now set parent names (async for those with profiles)
  const parentArray = Array.from(parentMap.values());

  for (const parent of parentArray) {
    if (parent.parentId) {
      // Parent has an account - get name from profile
      parent.parentName = await getParentNameFromProfile(supabaseClient, parent.parentId);
    } else {
      // Parent doesn't have an account - extract name from email
      parent.parentName = extractNameFromEmail(parent.parentEmail);
    }
  }

  console.log(`[getParentsWithIncompleteWaivers] Found ${parentArray.length} parents with incomplete waivers`);

  return parentArray;
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

    const { parentIds, parentEmails }: EmailRequest = await req.json().catch(() => ({}));

    console.log('[send-waiver-update-emails] Starting email campaign');

    // Get all parents with incomplete waivers (CORRECTED LOGIC)
    let allParents = await getParentsWithIncompleteWaivers(supabaseClient);

    console.log(`[send-waiver-update-emails] Found ${allParents.length} parents with incomplete waivers`);

    // Filter by specific parents if requested
    if (parentIds && Array.isArray(parentIds) && parentIds.length > 0) {
      allParents = allParents.filter(p =>
        (p.parentId && parentIds.includes(p.parentId)) ||
        parentIds.includes(p.parentEmail)
      );
      console.log(`[send-waiver-update-emails] Filtered to ${allParents.length} specific parents by ID/email`);
    } else if (parentEmails && Array.isArray(parentEmails) && parentEmails.length > 0) {
      allParents = allParents.filter(p => parentEmails.includes(p.parentEmail));
      console.log(`[send-waiver-update-emails] Filtered to ${allParents.length} specific parents by email`);
    }

    const result: EmailResult = {
      emailsSent: 0,
      failed: 0,
      errors: [],
      details: {
        sent: [],
        failed: []
      }
    };

    // Process each parent
    for (const parent of allParents) {
      try {
        // Generate secure token
        const token = generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        // Store token
        const { error: tokenError } = await supabaseClient
          .from('waiver_update_tokens')
          .insert({
            parent_id: parent.parentId,
            parent_email: parent.parentEmail,
            token,
            expires_at: expiresAt.toISOString(),
            used: false,
            email_sent_at: new Date().toISOString()
          });

        if (tokenError) throw tokenError;

        // Get swimmer names for email
        const swimmerNames = parent.swimmers.map((s: any) =>
          `${s.firstName} ${s.lastName}`
        );

        // Send email using Resend
        await sendEmail({
          to: parent.parentEmail,
          parentName: parent.parentName,
          swimmers: swimmerNames,
          link: `${baseUrl}/update-waivers/${token}`
        });

        result.emailsSent++;
        result.details!.sent.push({
          parentId: parent.parentId,
          parentEmail: parent.parentEmail,
          parentName: parent.parentName,
          swimmerCount: parent.swimmers.length,
          token
        });

        console.log(`[send-waiver-update-emails] Sent email to ${parent.parentEmail} for ${parent.swimmers.length} swimmers`);
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`${parent.parentEmail}: ${errorMessage}`);
        result.details!.failed.push({
          email: parent.parentEmail,
          error: errorMessage
        });
        console.error(`[send-waiver-update-emails] Failed to send to ${parent.parentEmail}:`, error);
      }
    }

    console.log(`[send-waiver-update-emails] Completed: ${result.emailsSent} emails sent, ${result.failed} errors`);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('[send-waiver-update-emails] Fatal error:', error);
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

          <p>We're moving to a new swim lesson management system! <strong>Before your next lesson,
          you must complete updated liability waivers for your enrolled swimmers.</strong></p>

          <p>This is required for the safety of our business and your swimmers. We update
          these waivers annually to ensure we have current emergency contact information
          and maintain compliance with California law.</p>

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
            <strong>Waivers must be completed prior to your next lesson.</strong> Your swimmer's participation may be affected if waivers are not updated.
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