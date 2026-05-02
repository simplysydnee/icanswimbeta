import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params;
    console.log('[REFERRAL APPROVE] Route called for referral:', referralId);

    const supabase = await createClient();

    // ========== STEP 1: Authentication ==========
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ========== STEP 2: Authorization ==========
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // ========== STEP 2.5: Parse optional request body ==========
    let adminNotes: string | undefined;
    try {
      const body = await request.json();
      adminNotes = body?.admin_notes;
    } catch {
      // No body provided
    }

    // ========== STEP 3: Create service role client ==========
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    // ========== STEP 4: Fetch referral ==========
    const { data: referral, error: referralError } = await serviceClient
      .from('referral_requests')
      .select('*')
      .eq('id', referralId)
      .single();

    if (referralError || !referral) {
      console.error('Error fetching referral:', referralError);
      return NextResponse.json(
        { error: `Referral not found: ${referralError?.message || 'No data returned'}` },
        { status: 404 }
      );
    }

    if (referral.status === 'approved') {
      return NextResponse.json(
        { error: 'Referral is already approved' },
        { status: 400 }
      );
    }

    // ========== STEP 5: Get parent's user ID if they have an account ==========
    const { data: parentProfile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('email', referral.parent_email)
      .maybeSingle();

    // ========== STEP 6: Create swimmer record ==========
    const childNameParts = (referral.child_name || '').split(' ');
    const firstName = childNameParts[0] || '';
    const lastName = childNameParts.slice(1).join(' ') || '';

    const swimmerPayload: Record<string, unknown> = {
      parent_id: parentProfile?.id || null,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: referral.child_date_of_birth,
      gender: referral.gender?.toLowerCase() || null,
      diagnosis: referral.diagnosis,
      height: referral.height,
      weight: referral.weight,

      // Medical
      has_medical_conditions: referral.has_medical_conditions,
      medical_conditions_description: referral.medical_conditions_description,
      has_allergies: referral.has_allergies,
      allergies_description: referral.allergies_description,
      history_of_seizures: referral.history_of_seizures,
      toilet_trained: referral.toilet_trained,
      non_ambulatory: referral.non_ambulatory,

      // Behavioral
      comfortable_in_water: referral.comfortable_in_water ? 'very' : 'not_at_all',
      self_injurious_behavior: referral.self_injurious_behavior,
      self_injurious_behavior_description: referral.self_injurious_behavior_description,
      aggressive_behavior: referral.aggressive_behavior,
      aggressive_behavior_description: referral.aggressive_behavior_description,
      elopement_history: referral.elopement_behavior,
      elopement_history_description: referral.elopement_behavior_description,
      has_behavior_plan: referral.has_behavior_plan,

      // From parent completion
      swim_goals: referral.swim_goals,
      availability: referral.availability,
      strengths_interests: referral.strengths_interests,

      // Funding source info
      payment_type: 'funding_source',
      coordinator_id: referral.coordinator_id,
      funding_coordinator_name: referral.coordinator_name,
      funding_coordinator_email: referral.coordinator_email,

      // Signatures
      signed_waiver: referral.liability_waiver_signed,
      signed_liability: referral.liability_waiver_signed,
      liability_waiver_signature: referral.liability_waiver_signed ? referral.parent_name : null,
      cancellation_policy_signature: referral.cancellation_policy_signed ? referral.parent_name : null,
      photo_video_permission: referral.photo_release_signed,
      photo_video_signature: referral.photo_release_signed ? referral.parent_name : null,

      // Status
      enrollment_status: 'pending_assessment',
      assessment_status: 'not_scheduled',
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
    };

    const { data: swimmer, error: swimmerError } = await serviceClient
      .from('swimmers')
      .insert(swimmerPayload)
      .select()
      .single();

    if (swimmerError || !swimmer) {
      console.error('Error creating swimmer:', swimmerError);
      return NextResponse.json(
        { error: `Failed to create swimmer: ${swimmerError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // ========== STEP 7: Update referral status ==========
    const { error: updateError } = await serviceClient
      .from('referral_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        swimmer_id: swimmer.id,
      })
      .eq('id', referralId);

    if (updateError) {
      console.error('Error updating referral status:', updateError);
      return NextResponse.json(
        { error: `Failed to update referral: ${updateError.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 8: Send emails (non-fatal) ==========
    let approvalEmailSent = false;
    let welcomeEmailSent = false;

    try {
      await emailService.sendApprovalNotification({
        parentEmail: referral.parent_email,
        parentName: referral.parent_name,
        childName: referral.child_name,
      });
      approvalEmailSent = true;
    } catch (emailError) {
      console.error('Error sending approval notification:', emailError);
    }

    try {
      await emailService.sendWelcomeEnrollment({
        parentEmail: referral.parent_email,
        parentName: referral.parent_name,
        childName: referral.child_name,
        isPrivatePay: false,
        fundingSourceName: 'Regional Center',
      });
      welcomeEmailSent = true;
    } catch (emailError) {
      console.error('Error sending welcome enrollment:', emailError);
    }

    // ========== STEP 9: Return success ==========
    return NextResponse.json({
      success: true,
      swimmer_id: swimmer.id,
      emails_sent: {
        approval: approvalEmailSent,
        welcome: welcomeEmailSent,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Unexpected error in referral approve API:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
