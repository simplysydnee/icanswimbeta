import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SESSION_STATUS } from '@/config/constants';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
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
    // Check if user has admin role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // ========== STEP 3: Update Sessions ==========
    // Update all draft sessions in this batch to "available" status
    const { error, count } = await supabase
      .from('sessions')
      .update({
        status: SESSION_STATUS.AVAILABLE,
        updated_at: new Date().toISOString(),
      })
      .eq('batch_id', batchId)
      .eq('status', SESSION_STATUS.DRAFT)
      .select('id', { count: 'exact' });

    if (error) {
      console.error('Error opening batch:', error);
      return NextResponse.json(
        { error: `Failed to open sessions: ${error.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 4: Return Response ==========
    const updatedCount = count || 0;
    console.log(`✅ Opened ${updatedCount} sessions in batch ${batchId}`);

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      batchId,
    });

  } catch (error) {
    console.error('Open batch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}