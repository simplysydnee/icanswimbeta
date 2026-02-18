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
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'You must be signed in to claim this invitation.' },
      { status: 401 }
    );
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
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'This invitation link is invalid or has already been used.' },
        { status: 404 }
      );
    }

    // Verify email matches
    const invitedEmail = invitation.parent_email?.toLowerCase().trim();
    const userEmail = user.email?.toLowerCase().trim();

    if (!invitedEmail || !userEmail) {
      return NextResponse.json(
        { error: 'INVALID_EMAIL', message: 'Email information is missing.' },
        { status: 400 }
      );
    }

    if (userEmail !== invitedEmail) {
      // Log the mismatch attempt (non-blocking - don't await)
      supabase
        .from('email_mismatch_logs')
        .insert({
          invitation_id: invitation.id,
          invited_email: invitation.parent_email,
          attempted_email: user.email,
          swimmer_id: invitation.swimmer_id,
          user_agent: request.headers.get('user-agent'),
        })
        .then(({ error: logError }) => {
          if (logError) {
            console.error('Failed to log email mismatch:', logError);
          }
        });

      return NextResponse.json(
        {
          error: 'EMAIL_MISMATCH',
          message: `This invitation was sent to ${invitation.parent_email}, but you are currently signed in as ${user.email}.`,
          invitedEmail: invitation.parent_email,
          currentEmail: user.email,
          resolutionOptions: [
            {
              action: 'SIGN_OUT_AND_USE_INVITED_EMAIL',
              title: 'Sign out and create account with invited email',
              description: `Sign out and create a new account using ${invitation.parent_email}`
            },
            {
              action: 'CONTACT_ADMIN',
              title: 'Contact I Can Swim to update invitation',
              description: 'Request that the invitation be resent to your current email address',
              contactEmail: 'sutton@icanswim209.com',
              contactPhone: '209-985-1538'
            }
          ]
        },
        { status: 403 }
      );
    }

    // Check if already claimed
    if (invitation.status === 'claimed') {
      return NextResponse.json(
        { error: 'ALREADY_CLAIMED', message: 'This invitation has already been claimed.' },
        { status: 409 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        {
          error: 'EXPIRED',
          message: 'This invitation has expired. Please contact I Can Swim to request a new invitation.',
          contactEmail: 'sutton@icanswim209.com',
          contactPhone: '209-985-1538'
        },
        { status: 410 }
      );
    }

    // Validate date of birth
    const expectedDob = invitation.swimmer.date_of_birth;
    if (!validateDateOfBirth(dob, expectedDob)) {
      return NextResponse.json({
        error: 'DOB_MISMATCH',
        message: 'The date of birth you entered does not match our records.'
      }, { status: 403 });
    }

    // Use atomic database function to claim invitation
    try {
      const { error: claimError } = await supabase.rpc('claim_parent_invitation', {
        p_invitation_id: invitation.id,
        p_user_id: user.id,
        p_swimmer_id: invitation.swimmer_id
      });

      if (claimError) {
        console.error('Database function error:', claimError);

        // Check for specific error messages
        if (claimError.message?.includes('already been claimed')) {
          return NextResponse.json(
            {
              error: 'ALREADY_CLAIMED',
              message: 'This invitation has already been claimed.'
            },
            { status: 409 }
          );
        }

        if (claimError.message?.includes('not found')) {
          return NextResponse.json(
            {
              error: 'INVITATION_NOT_FOUND',
              message: 'Invitation not found.'
            },
            { status: 404 }
          );
        }

        if (claimError.message?.includes('expired')) {
          return NextResponse.json(
            {
              error: 'EXPIRED',
              message: 'This invitation has expired. Please contact I Can Swim to request a new invitation.',
              contactEmail: 'sutton@icanswim209.com',
              contactPhone: '209-985-1538'
            },
            { status: 410 }
          );
        }

        // Generic database error
        return NextResponse.json(
          {
            error: 'CLAIM_FAILED',
            message: 'Failed to claim invitation. Please try again or contact support.'
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Unexpected error during claim:', error);
      return NextResponse.json(
        {
          error: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again.'
        },
        { status: 500 }
      );
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
      message: 'Swimmer linked successfully! Welcome email has been sent.',
      swimmerId: invitation.swimmer_id,
      redirectTo: '/parent/dashboard'
    });
  } catch (error) {
    console.error('Error claiming invitation by token:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
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