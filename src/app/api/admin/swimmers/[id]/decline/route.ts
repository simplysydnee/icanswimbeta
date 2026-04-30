import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  context: any
) {
  try {
    const { params } = await context.params;
    const swimmerId = params.id;
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

    const { error: updateError } = await supabase
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
    console.error('Unexpected error in decline swimmer API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
