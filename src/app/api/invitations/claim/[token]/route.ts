import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient();
  const { token } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Get the invitation by token
    const { data: invitation, error: fetchError } = await supabase
      .from('parent_invitations')
      .select('*, swimmer:swimmers(id, first_name, last_name, date_of_birth)')
      .eq('invitation_token', token)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify email matches
    if (invitation.parent_email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({
        error: 'Email does not match invitation',
        invitation_email: invitation.parent_email,
        user_email: user.email
      }, { status: 403 });
    }

    // Check if already claimed
    if (invitation.status === 'claimed') {
      return NextResponse.json({ error: 'Invitation already claimed' }, { status: 400 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
    }

    // Update invitation status
    const { error: updateInviteError } = await supabase
      .from('parent_invitations')
      .update({
        status: 'claimed',
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateInviteError) throw updateInviteError;

    // Link swimmer to parent
    const { error: updateSwimmerError } = await supabase
      .from('swimmers')
      .update({ parent_id: user.id })
      .eq('id', invitation.swimmer_id);

    if (updateSwimmerError) throw updateSwimmerError;

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
        console.error('Error adding parent role:', addRoleError);
        // Don't fail the claim if role addition fails
      }
    }

    return NextResponse.json({
      success: true,
      swimmer: invitation.swimmer,
      message: 'Swimmer linked successfully!'
    });
  } catch (error) {
    console.error('Error claiming invitation by token:', error);
    return NextResponse.json({ error: 'Failed to claim invitation' }, { status: 500 });
  }
}

// GET invitation details by token (for claim page)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient();
  const { token } = await params;

  try {
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Get the invitation by token
    const { data: invitation, error: fetchError } = await supabase
      .from('parent_invitations')
      .select('*, swimmer:swimmers(id, first_name, last_name, date_of_birth, gender)')
      .eq('invitation_token', token)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if expired
    const isExpired = new Date(invitation.expires_at) < new Date();
    const isClaimed = invitation.status === 'claimed';

    return NextResponse.json({
      invitation: {
        ...invitation,
        is_expired: isExpired,
        is_claimed: isClaimed,
        is_valid: !isExpired && !isClaimed,
      }
    });
  } catch (error) {
    console.error('Error fetching invitation by token:', error);
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 });
  }
}