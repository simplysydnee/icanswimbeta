import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: swimmerId } = await params;
    console.log('[DECLINE] Route called for swimmer:', swimmerId);

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

    // ========== STEP 3: Parse optional reason ==========
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body?.reason;
    } catch {
      // No body provided — that's fine
    }

    // ========== STEP 4: Update Swimmer ==========
    const updateData: Record<string, any> = {
      approval_status: 'declined',
      declined_at: new Date().toISOString(),
      declined_by: user.id,
    };

    if (reason) {
      updateData.decline_reason = reason;
    }

    const { error: updateError } = await serviceClient
      .from('swimmers')
      .update(updateData)
      .eq('id', swimmerId);

    if (updateError) {
      console.error('Error declining swimmer:', updateError);
      return NextResponse.json(
        { error: `Failed to decline swimmer: ${updateError.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 5: Return Success ==========
    return NextResponse.json({
      success: true,
      message: 'Swimmer declined successfully',
      swimmer_id: swimmerId,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Unexpected error in decline swimmer API:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
