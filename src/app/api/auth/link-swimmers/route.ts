import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get request body
    const body = await request.json();
    const { invitation_token } = body;

    // Get user's email
    const userEmail = user.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const results = {
      swimmers_linked: 0,
      invitations_claimed: 0,
      swimmers: [] as Array<{id: string, name: string}>,
      errors: [] as Array<string>,
    };

    let invitations = [];

    // Handle token-based invitation if provided
    if (invitation_token) {
      const { data: tokenInvitation, error: tokenError } = await supabase
        .from('parent_invitations')
        .select('id, swimmer_id, status, parent_email, swimmer:swimmers(id, first_name, last_name)')
        .eq('invitation_token', invitation_token)
        .eq('status', 'pending')
        .single();

      if (tokenError) {
        results.errors.push(`Invalid or expired invitation token: ${tokenError.message}`);
      } else if (tokenInvitation) {
        // Verify email matches
        if (tokenInvitation.parent_email.toLowerCase() !== userEmail) {
          results.errors.push(`Invitation email (${tokenInvitation.parent_email}) does not match your account email (${userEmail})`);
        } else {
          invitations = [tokenInvitation];
        }
      }
    } else {
      // Find pending invitations for this email with swimmer details
      const { data: emailInvitations, error: invitationsError } = await supabase
        .from('parent_invitations')
        .select('id, swimmer_id, status, swimmer:swimmers(id, first_name, last_name)')
        .eq('parent_email', userEmail)
        .eq('status', 'pending');

      if (invitationsError) throw invitationsError;
      invitations = emailInvitations || [];
    }

    // Claim pending invitations and link swimmers
    for (const invitation of invitations || []) {
      try {
        // Update invitation status
        const { error: updateInviteError } = await supabase
          .from('parent_invitations')
          .update({
            status: 'claimed',
            claimed_by: user.id,
            claimed_at: new Date().toISOString(),
          })
          .eq('id', invitation.id);

        if (updateInviteError) {
          results.errors.push(`Failed to claim invitation for swimmer ${invitation.swimmer_id}: ${updateInviteError.message}`);
          continue;
        }

        // Link swimmer to parent
        const { error: updateSwimmerError } = await supabase
          .from('swimmers')
          .update({ parent_id: user.id })
          .eq('id', invitation.swimmer_id);

        if (updateSwimmerError) {
          results.errors.push(`Failed to link swimmer ${invitation.swimmer_id}: ${updateSwimmerError.message}`);
        } else {
          results.invitations_claimed++;
          results.swimmers_linked++;
          const swimmerName = invitation.swimmer
            ? `${invitation.swimmer.first_name} ${invitation.swimmer.last_name}`
            : `Swimmer ${invitation.swimmer_id.substring(0, 8)}`;
          results.swimmers.push({
            id: invitation.swimmer_id,
            name: swimmerName
          });
        }
      } catch (error) {
        results.errors.push(`Error claiming invitation ${invitation.id}: ${error}`);
      }
    }

    // Auto-link swimmers by email match (for swimmers without invitations)
    try {
      const { data: swimmersByEmail, error: swimmersError } = await supabase
        .from('swimmers')
        .select('id, first_name, last_name')
        .eq('parent_email', userEmail)
        .is('parent_id', null);

      if (swimmersError) throw swimmersError;

      for (const swimmer of swimmersByEmail || []) {
        try {
          const { error: updateError } = await supabase
            .from('swimmers')
            .update({ parent_id: user.id })
            .eq('id', swimmer.id);

          if (updateError) {
            results.errors.push(`Failed to link swimmer ${swimmer.id} by email match: ${updateError.message}`);
          } else {
            results.swimmers_linked++;
            results.swimmers.push({
              id: swimmer.id,
              name: `${swimmer.first_name} ${swimmer.last_name}`
            });
          }
        } catch (error) {
          results.errors.push(`Error linking swimmer ${swimmer.id} by email match: ${error}`);
        }
      }
    } catch (error) {
      results.errors.push(`Error fetching swimmers by email: ${error}`);
    }

    // Update user role to parent if not already set
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!existingRoles || existingRoles.length === 0) {
      // Add parent role
      const { error: addRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'parent'
        });

      if (addRoleError) {
        results.errors.push(`Failed to add parent role: ${addRoleError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      message: `Linked ${results.swimmers_linked} swimmers and claimed ${results.invitations_claimed} invitations`
    });
  } catch (error) {
    console.error('Error auto-linking swimmers:', error);
    return NextResponse.json({ error: 'Failed to auto-link swimmers' }, { status: 500 });
  }
}