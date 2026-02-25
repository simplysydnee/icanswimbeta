import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: swimmerId } = await params;

  // Check admin authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!userRoles) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { parent_email, parent_name } = body;

    // Create service role client for admin database operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // Get swimmer details including parent_name
    const { data: swimmer, error: swimmerError } = await supabaseAdmin
      .from('swimmers')
      .select('id, first_name, last_name, parent_id, parent_email, parent_name, invited_at')
      .eq('id', swimmerId)
      .single();

    if (swimmerError || !swimmer) {
      return NextResponse.json({ error: 'Swimmer not found' }, { status: 404 });
    }

    // Helper function to extract a readable name from email prefix
    const extractNameFromEmail = (email: string): string => {
      if (!email) return '';
      const prefix = email.split('@')[0];

      // Try to extract name from common patterns
      // Remove numbers and special characters
      let name = prefix.replace(/[0-9_\.]/g, ' ');

      // Try to split camelCase or concatenated names
      // Add space before capital letters (camelCase detection)
      name = name.replace(/([a-z])([A-Z])/g, '$1 $2');

      // Capitalize first letter of each word
      name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();

      // If name is empty or just single letter, return empty
      if (name.length <= 1) return '';

      return name;
    };

    // Check if swimmer already has a parent linked
    if (swimmer.parent_id) {
      return NextResponse.json({
        error: 'Swimmer already has a parent linked',
        linked: true
      }, { status: 400 });
    }

    // Use provided email or swimmer's parent_email
    const emailToUse = parent_email || swimmer.parent_email;
    if (!emailToUse) {
      return NextResponse.json({ error: 'No parent email on file' }, { status: 400 });
    }

    // Check if email already has an account in profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', emailToUse.toLowerCase())
      .maybeSingle();

    // If profile exists, auto-link the swimmer
    if (existingProfile) {
      // Update swimmer with parent_id
      const { error: updateError } = await supabaseAdmin
        .from('swimmers')
        .update({
          parent_id: existingProfile.id,
          invited_at: new Date().toISOString()
        })
        .eq('id', swimmerId);

      if (updateError) {
        console.error('Error auto-linking swimmer:', updateError);
        return NextResponse.json({ error: 'Failed to auto-link swimmer' }, { status: 500 });
      }

      // Determine parent name:
      // 1. Use provided name from admin
      // 2. Use swimmer's parent_name from database (now fixed from Airtable)
      // 3. Use profile full_name
      // 4. Try to extract name from parent_email as fallback
      // 5. Fall back to 'Parent'
      const emailPrefixName = extractNameFromEmail(swimmer.parent_email || '');
      const determinedParentName = parent_name || swimmer.parent_name || existingProfile.full_name || emailPrefixName || 'Parent';

      // Send welcome/notification email to existing parent
      await emailService.sendEmail({
        to: emailToUse,
        templateType: 'account_created',
        parentName: determinedParentName,
        childName: `${swimmer.first_name} ${swimmer.last_name}`,
      });

      return NextResponse.json({
        success: true,
        linked: true,
        message: 'Parent account found and linked!',
        parent_id: existingProfile.id
      });
    }

    // Check for existing invitation
    const { data: existingInvitation } = await supabaseAdmin
      .from('parent_invitations')
      .select('id, status, created_at')
      .eq('swimmer_id', swimmerId)
      .eq('parent_email', emailToUse.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const isResend = !!existingInvitation;
    const invitationId = existingInvitation?.id;

    // Determine parent name:
    // 1. Use provided name from admin
    // 2. Use swimmer's parent_name from database (now fixed from Airtable)
    // 3. Try to extract name from parent_email as fallback
    // 4. Fall back to 'Parent' (better UX for emails)
    const emailPrefixName = extractNameFromEmail(swimmer.parent_email || '');
    const determinedParentName = parent_name || swimmer.parent_name || emailPrefixName || 'Parent';

    // Create or update invitation
    const invitationData = {
      swimmer_id: swimmerId,
      parent_email: emailToUse.toLowerCase(),
      parent_name: determinedParentName,
      status: 'pending',
      created_by: user.id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    let invitation;
    if (isResend && invitationId) {
      // Update existing invitation
      const { data: updatedInvitation, error: updateError } = await supabaseAdmin
        .from('parent_invitations')
        .update({
          ...invitationData,
          status: 'sent', // Set to sent for resend
          sent_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // New 30-day expiry
        })
        .eq('id', invitationId)
        .select('id, invitation_token, parent_email, parent_name, status, sent_at, expires_at')
        .single();

      if (updateError) throw updateError;
      invitation = updatedInvitation;
    } else {
      // Create new invitation - database will generate invitation_token automatically
      const { data: newInvitation, error: createError } = await supabaseAdmin
        .from('parent_invitations')
        .insert(invitationData)
        .select('id, invitation_token, parent_email, parent_name, status, sent_at')
        .single();

      if (createError) throw createError;
      invitation = newInvitation;

      // Update invitation status to sent
      const { data: updatedInvitation, error: updateError } = await supabaseAdmin
        .from('parent_invitations')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', invitation.id)
        .select('id, invitation_token, parent_email, parent_name, status, sent_at, expires_at')
        .single();

      if (updateError) throw updateError;
      invitation = updatedInvitation;
    }

    const token = invitation.invitation_token;

    // Send parent invitation email using our new service
    const emailResult = await emailService.sendParentInvitation({
      parentEmail: emailToUse,
      parentName: determinedParentName || null,
      swimmerFirstName: swimmer.first_name,
      swimmerLastName: swimmer.last_name,
      inviteToken: token,
    });

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // Continue anyway - invitation is created
    }

    // Update swimmer's invited_at timestamp
    await supabaseAdmin
      .from('swimmers')
      .update({
        invited_at: new Date().toISOString(),
        follow_up_task_created: false // Reset follow-up task flag
      })
      .eq('id', swimmerId);

    return NextResponse.json({
      success: true,
      linked: false,
      isResend,
      message: isResend ? `Invitation resent to ${emailToUse}` : `Invitation sent to ${emailToUse}`,
      invitation_id: invitation.id,
      token: token
    });

  } catch (error) {
    console.error('Error inviting parent:', error);
    return NextResponse.json({
      error: 'Failed to send invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}