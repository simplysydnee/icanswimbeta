import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SESSION_STATUS } from '@/config/constants';

interface OpenSessionsRequest {
  sessionIds: string[];
}

interface OpenSessionsResponse {
  success: boolean;
  count: number;
}

export async function POST(request: Request) {
  try {
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
    // Check if user has admin role (check user_roles table like other admin endpoints)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // ========== STEP 3: Parse Request Body ==========
    const body = await request.json();
    const { sessionIds }: OpenSessionsRequest = body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request - sessionIds array is required' },
        { status: 400 }
      );
    }

    // ========== STEP 4: Validate Session IDs ==========
    // Check if all sessions exist and are in draft status
    const { data: sessions, error: checkError } = await supabase
      .from('sessions')
      .select('id, status')
      .in('id', sessionIds);

    if (checkError) {
      console.error('Error checking sessions:', checkError);
      return NextResponse.json(
        { error: `Failed to validate sessions: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        { error: 'No sessions found with the provided IDs' },
        { status: 404 }
      );
    }

    // Check if all sessions are drafts
    const nonDraftSessions = sessions.filter(s => s.status !== SESSION_STATUS.DRAFT);
    if (nonDraftSessions.length > 0) {
      const nonDraftIds = nonDraftSessions.map(s => s.id);
      return NextResponse.json(
        {
          error: 'Cannot open sessions - some sessions are not drafts',
          nonDraftSessionIds: nonDraftIds,
        },
        { status: 400 }
      );
    }

    // ========== STEP 5: Update Sessions ==========
    const { data: updatedSessions, error: updateError } = await supabase
      .from('sessions')
      .update({
        status: SESSION_STATUS.AVAILABLE,
        updated_at: new Date().toISOString(),
        open_at: new Date().toISOString(),
      })
      .in('id', sessionIds)
      .eq('status', SESSION_STATUS.DRAFT)
      .select('id');

    if (updateError) {
      console.error('Error opening sessions:', updateError);
      return NextResponse.json(
        { error: `Failed to open sessions: ${updateError.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 6: Return Response ==========
    const updatedCount = updatedSessions?.length || 0;
    console.log(`✅ Opened ${updatedCount} draft sessions`);

    const response: OpenSessionsResponse = {
      success: true,
      count: updatedCount,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Open sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}