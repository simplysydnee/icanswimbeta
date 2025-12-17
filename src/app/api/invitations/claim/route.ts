import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { invitation_id } = body;

    if (!invitation_id) {
      return NextResponse.json({ error: 'invitation_id required' }, { status: 400 });
    }

    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('parent_invitations')
      .select('*')
      .eq('id', invitation_id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify email matches
    if (invitation.parent_email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match invitation' }, { status: 403 });
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
      .eq('id', invitation_id);

    if (updateInviteError) throw updateInviteError;

    // Link swimmer to parent
    const { error: updateSwimmerError } = await supabase
      .from('swimmers')
      .update({ parent_id: user.id })
      .eq('id', invitation.swimmer_id);

    if (updateSwimmerError) throw updateSwimmerError;

    // Update user role to parent if not already set
    // Check if user already has a role
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
      swimmer_id: invitation.swimmer_id,
      message: 'Swimmer linked successfully!'
    });
  } catch (error) {
    console.error('Error claiming invitation:', error);
    return NextResponse.json({ error: 'Failed to claim invitation' }, { status: 500 });
  }
}