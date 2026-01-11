import { createClient } from '@/lib/supabase/server';
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
    .single();

  if (!userRoles) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { parent_email, parent_name } = body;

    // Get swimmer details
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, parent_id, parent_email, invited_at')
      .eq('id', swimmerId)
      .single();

    if (swimmerError || !swimmer) {
      return NextResponse.json({ error: 'Swimmer not found' }, { status: 404 });
    }

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
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', emailToUse.toLowerCase())
      .single();

    // If profile exists, auto-link the swimmer
    if (existingProfile) {
      // Update swimmer with parent_id
      const { error: updateError } = await supabase
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

      // Send welcome/notification email to existing parent
      await emailService.sendEmail({
        to: emailToUse,
        templateType: 'account_created',
        parentName: parent_name || existingProfile.full_name || 'Parent',
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
    const { data: existingInvitation } = await supabase
      .from('parent_invitations')
      .select('id, status, created_at')
      .eq('swimmer_id', swimmerId)
      .eq('parent_email', emailToUse.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const isResend = !!existingInvitation;
    const invitationId = existingInvitation?.id;

    // Create or update invitation
    const invitationData = {
      swimmer_id: swimmerId,
      parent_email: emailToUse.toLowerCase(),
      parent_name: parent_name || '',
      status: 'pending',
      created_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    let invitation;
    if (isResend && invitationId) {
      // Update existing invitation
      const { data: updatedInvitation, error: updateError } = await supabase
        .from('parent_invitations')
        .update({
          ...invitationData,
          status: 'pending', // Reset status for resend
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // New 7-day expiry
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (updateError) throw updateError;
      invitation = updatedInvitation;
    } else {
      // Create new invitation
      const { data: newInvitation, error: createError } = await supabase
        .from('parent_invitations')
        .insert(invitationData)
        .select()
        .single();

      if (createError) throw createError;
      invitation = newInvitation;
    }

    // Generate a unique token for the invitation
    const token = crypto.randomUUID();

    // Update invitation with token
    const { data: updatedInvitation, error: tokenError } = await supabase
      .from('parent_invitations')
      .update({
        invitation_token: token,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', invitation.id)
      .select()
      .single();

    if (tokenError) throw tokenError;

    // Send parent invitation email using our new service
    const emailResult = await emailService.sendParentInvitation({
      parentEmail: emailToUse,
      parentName: parent_name || null,
      swimmerFirstName: swimmer.first_name,
      swimmerLastName: swimmer.last_name,
      inviteToken: token,
    });

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // Continue anyway - invitation is created
    }

    // Update swimmer's invited_at timestamp
    await supabase
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
      invitation_id: updatedInvitation.id,
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