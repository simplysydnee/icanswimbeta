import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's email
    const userEmail = user.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Note: Swimmers table doesn't have parent_email column
    // Parent linking happens through parent_invitations table
    const swimmers: any[] = [];

    // Find pending invitations for this email with swimmer details
    const { data: invitations, error: invitationsError } = await supabase
      .from('parent_invitations')
      .select('id, swimmer_id, status, swimmer:swimmers(id, first_name, last_name)')
      .eq('parent_email', userEmail)
      .eq('status', 'pending');

    if (invitationsError) throw invitationsError;

    const results = {
      swimmers_linked: 0,
      invitations_claimed: 0,
      swimmers: [] as Array<{id: string, name: string}>,
      errors: [] as Array<string>,
    };

    // Link swimmers from pending invitations
    // Note: Direct email matching on swimmers table is not possible since swimmers don't have parent_email column
    for (const swimmer of swimmers || []) {
      try {
        const { error: updateError } = await supabase
          .from('swimmers')
          .update({ parent_id: user.id })
          .eq('id', swimmer.id);

        if (updateError) {
          results.errors.push(`Failed to link swimmer ${swimmer.first_name} ${swimmer.last_name}: ${updateError.message}`);
        } else {
          results.swimmers_linked++;
          results.swimmers.push({
            id: swimmer.id,
            name: `${swimmer.first_name} ${swimmer.last_name}`
          });
        }
      } catch (error) {
        results.errors.push(`Error linking swimmer ${swimmer.first_name} ${swimmer.last_name}: ${error}`);
      }
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