import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: swimmerId } = await params;
    console.log('[SEND_WELCOME_EMAIL] Route called for swimmer:', swimmerId);

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

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

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const { data: swimmer, error: swimmerError } = await serviceClient
      .from('swimmers')
      .select(
        `
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
      `
      )
      .eq('id', swimmerId)
      .single();
      console.log('[SEND_WELCOME_EMAIL] Swimmer data:', JSON.stringify(swimmer));
    if (swimmerError || !swimmer) {
      console.error('Error fetching swimmer:', swimmerError);
      return NextResponse.json(
        {
          error: `Swimmer not found: ${swimmerError?.message || 'No data returned'}`,
        },
        { status: 404 }
      );
    }

    const parent = swimmer.parent as unknown as
      | { id: string; full_name: string | null; email: string | null }
      | null;
    const fundingSource = swimmer.funding_sources as unknown as
      | { id: string; name: string | null }
      | null;

    if (parent?.email) {
      const isPrivatePay = swimmer.payment_type === 'private_pay';
      const fundingSourceName = fundingSource?.name ?? undefined;

      try {
        await emailService.sendWelcomeEnrollment({
          parentEmail: parent.email,
          parentName: parent.full_name || 'Parent',
          childName: `${swimmer.first_name} ${swimmer.last_name}`,
          isPrivatePay,
          fundingSourceName,
        });

        console.log(
          `✅ Welcome email sent to ${parent.email} for swimmer ${swimmer.first_name} ${swimmer.last_name}`
        );
        return NextResponse.json({ success: true, sent: true });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        return NextResponse.json({
          success: true,
          sent: false,
          reason: 'email_send_failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: false,
      reason: 'No parent email on file',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Unexpected error in send-welcome-email API:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
