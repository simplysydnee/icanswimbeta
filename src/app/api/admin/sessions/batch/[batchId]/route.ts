import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SESSION_STATUS } from '@/config/constants';

export async function DELETE(
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

    // ========== STEP 3: Check if sessions can be deleted ==========
    // Only allow deletion if ALL sessions in batch are still drafts
    const { data: sessions, error: checkError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('batch_id', batchId);

    if (checkError) {
      console.error('Error checking batch:', checkError);
      return NextResponse.json(
        { error: `Failed to check batch status: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        { error: 'Batch not found or already deleted' },
        { status: 404 }
      );
    }

    // Check if any sessions are not drafts
    const nonDraftSessions = sessions.filter(s => s.status !== SESSION_STATUS.DRAFT);
    if (nonDraftSessions.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete batch - some sessions are not drafts',
          nonDraftCount: nonDraftSessions.length,
          statuses: [...new Set(nonDraftSessions.map(s => s.status))],
        },
        { status: 400 }
      );
    }

    // ========== STEP 4: Get count before deleting ==========
    const { count, error: countError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', batchId);

    if (countError) {
      console.error('Error counting sessions to delete:', countError);
    }

    const sessionCount = count || 0;

    // ========== STEP 5: Delete Sessions ==========
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('batch_id', batchId);

    if (deleteError) {
      console.error('Error deleting batch:', deleteError);
      return NextResponse.json(
        { error: `Failed to delete sessions: ${deleteError.message}` },
        { status: 500 }
      );
    }

    const deletedCount = sessionCount;
    console.log(`✅ Deleted ${deletedCount} sessions from batch ${batchId}`);

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      batchId,
    });

  } catch (error) {
    console.error('Delete batch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}