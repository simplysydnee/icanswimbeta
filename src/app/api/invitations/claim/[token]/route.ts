import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

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

    // Parse request body for DOB
    const body = await request.json();
    const { dob } = body;

    if (!dob) {
      return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 });
    }

    // Get the invitation by token with swimmer details including payment_type
    const { data: invitation, error: fetchError } = await supabase
      .from('parent_invitations')
      .select('*, swimmer:swimmers(id, first_name, last_name, date_of_birth, payment_type, funding_source_id)')
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

    // Validate date of birth
    const expectedDob = invitation.swimmer.date_of_birth;
    if (!validateDateOfBirth(dob, expectedDob)) {
      return NextResponse.json({
        error: 'Date of birth does not match our records. Please try again.'
      }, { status: 400 });
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

    // Link swimmer to parent and update enrollment_status
    const { error: updateSwimmerError } = await supabase
      .from('swimmers')
      .update({
        parent_id: user.id,
        enrollment_status: 'pending_enrollment' // Move from waitlist to pending enrollment
      })
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

    // Get parent name from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const parentName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Parent';

    // Send welcome email
    await sendWelcomeEmailAfterClaim({
      userEmail: user.email!,
      parentName,
      swimmerName: `${invitation.swimmer.first_name} ${invitation.swimmer.last_name}`,
      paymentType: invitation.swimmer.payment_type,
      fundingSourceId: invitation.swimmer.funding_source_id
    });

    return NextResponse.json({
      success: true,
      swimmer: invitation.swimmer,
      message: 'Swimmer linked successfully! Welcome email has been sent.'
    });
  } catch (error) {
    console.error('Error claiming invitation by token:', error);
    return NextResponse.json({ error: 'Failed to claim invitation' }, { status: 500 });
  }
}

// Helper function to validate date of birth
function validateDateOfBirth(input: string, expectedDob: string): boolean {
  if (!input.trim() || !expectedDob) return false;

  // Normalize expected DOB from database (YYYY-MM-DD)
  const expectedDate = new Date(expectedDob);
  if (isNaN(expectedDate.getTime())) {
    console.error('Invalid expected DOB format:', expectedDob);
    return false;
  }

  // Try parsing input in various formats
  const parsedDate = new Date(input);
  if (isNaN(parsedDate.getTime())) {
    return false;
  }

  // Compare year, month, day
  return (
    parsedDate.getFullYear() === expectedDate.getFullYear() &&
    parsedDate.getMonth() === expectedDate.getMonth() &&
    parsedDate.getDate() === expectedDate.getDate()
  );
}

// Helper function to send welcome email after claim
async function sendWelcomeEmailAfterClaim(params: {
  userEmail: string;
  parentName: string;
  swimmerName: string;
  paymentType: string | null;
  fundingSourceId: string | null;
}) {
  try {
    // Determine if private pay or funded
    const isPrivatePay = params.paymentType === 'private_pay';
    let fundingSourceName = undefined;

    if (!isPrivatePay && params.fundingSourceId) {
      // Get funding source name
      const supabaseClient = await createClient();
      const { data: fundingSource } = await supabaseClient
        .from('funding_sources')
        .select('name')
        .eq('id', params.fundingSourceId)
        .single();

      if (fundingSource) {
        fundingSourceName = fundingSource.name;
      }
    }

    // Send welcome enrollment email
    await emailService.sendWelcomeEnrollment({
      parentEmail: params.userEmail,
      parentName: params.parentName,
      childName: params.swimmerName,
      isPrivatePay,
      fundingSourceName
    });

    console.log('Welcome email sent successfully to:', params.userEmail);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't fail the claim if email fails
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
      .select('*, swimmer:swimmers(id, first_name, last_name, date_of_birth, gender, payment_type, funding_source_id)')
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