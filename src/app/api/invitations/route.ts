import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Create a new parent invitation
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { swimmer_id, parent_email, parent_name } = body;

    if (!swimmer_id || !parent_email) {
      return NextResponse.json({ error: 'swimmer_id and parent_email required' }, { status: 400 });
    }

    // Check if invitation already exists
    const { data: existing } = await supabase
      .from('parent_invitations')
      .select('id, status')
      .eq('swimmer_id', swimmer_id)
      .eq('parent_email', parent_email.toLowerCase())
      .single();

    if (existing && existing.status === 'claimed') {
      return NextResponse.json({ error: 'Invitation already claimed' }, { status: 400 });
    }

    // Create or update invitation
    const { data: invitation, error } = await supabase
      .from('parent_invitations')
      .upsert({
        swimmer_id,
        parent_email: parent_email.toLowerCase(),
        parent_name,
        status: 'pending',
        created_by: user.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }, {
        onConflict: 'swimmer_id,parent_email',
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Send invitation email with link
    // const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/claim/${invitation.invitation_token}`;

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}

// Get invitations for current user's email
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: invitations, error } = await supabase
      .from('parent_invitations')
      .select(`
        *,
        swimmer:swimmers(id, first_name, last_name)
      `)
      .eq('parent_email', user.email?.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}