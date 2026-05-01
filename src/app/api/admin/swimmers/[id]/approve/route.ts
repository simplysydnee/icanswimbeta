import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: swimmerId } = await params;
    console.log('[APPROVE] Route called for swimmer:', swimmerId);

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
    // Check if user is admin
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

    // ========== STEP 2.5: Create service role client for DB operations ==========
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    // ========== STEP 3: Get Swimmer Details ==========
    const { data: swimmer, error: swimmerError } = await serviceClient
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        payment_type,
        funding_source_id,
        parent_id,
        parent:profiles!swimmers_parent_id_fkey(
          id,
          full_name,
          email
        ),
        funding_sources(
          id,
          name
        )
      `)
      .eq('id', swimmerId)
      .single();

    console.log('[APPROVE] Query result:', JSON.stringify(swimmer), 'Error:', JSON.stringify(swimmerError));
    if (swimmerError || !swimmer) {
      console.error('Error fetching swimmer:', swimmerError);
      return NextResponse.json(
        { error: `Swimmer not found: ${swimmerError?.message || 'No data returned'}` },
        { status: 404 }
      );
    }

    // ========== STEP 4: Update Swimmer Approval Status ==========
    const { error: updateError } = await serviceClient
      .from('swimmers')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        enrollment_status: 'waitlist', // Move to waitlist after approval
      })
      .eq('id', swimmerId);

    if (updateError) {
      console.error('Error approving swimmer:', updateError);
      return NextResponse.json(
        { error: `Failed to approve swimmer: ${updateError.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 5: Send Welcome Email ==========
    if (swimmer.parent && Array.isArray(swimmer.parent) && swimmer.parent[0]?.email) {
      const parent = swimmer.parent[0];
      const isPrivatePay = swimmer.payment_type === 'private_pay';
      const fundingSourceName = swimmer.funding_sources && Array.isArray(swimmer.funding_sources)
        ? swimmer.funding_sources[0]?.name
        : undefined;

      try {
        await emailService.sendWelcomeEnrollment({
          parentEmail: parent.email,
          parentName: parent.full_name || 'Parent',
          childName: `${swimmer.first_name} ${swimmer.last_name}`,
          isPrivatePay,
          fundingSourceName,
        });

        console.log(`✅ Welcome email sent to ${parent.email} for swimmer ${swimmer.first_name} ${swimmer.last_name}`);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the approval if email fails
      }
    }

    // ========== STEP 6: Return Success Response ==========
    return NextResponse.json({
      success: true,
      message: 'Swimmer approved successfully',
      swimmer: {
        id: swimmer.id,
        firstName: swimmer.first_name,
        lastName: swimmer.last_name,
        approvalStatus: 'approved',
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Unexpected error in approve swimmer API:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}