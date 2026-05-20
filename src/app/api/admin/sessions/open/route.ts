import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SESSION_STATUS } from '@/config/constants';

interface OpenSessionsRequest {
  sessionIds?: string[];
  month?: number;
  year?: number;
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
    const { sessionIds, month, year }: OpenSessionsRequest = body;

    // Validate — need either sessionIds OR month+year
    const hasIds = sessionIds && Array.isArray(sessionIds) && sessionIds.length > 0;
    const hasMonthYear = typeof month === 'number' && typeof year === 'number';

    if (!hasIds && !hasMonthYear) {
      return NextResponse.json(
        { error: 'Invalid request — provide sessionIds array or month+year' },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    if (hasIds) {
      // ─── Batch approach: split IDs into chunks of 100 to avoid URL length limits ───
      const CHUNK_SIZE = 100;
      for (let i = 0; i < sessionIds.length; i += CHUNK_SIZE) {
        const chunk = sessionIds.slice(i, i + CHUNK_SIZE);
        const { data: updated, error: updateError } = await supabase
          .from('sessions')
          .update({
            status: SESSION_STATUS.AVAILABLE,
            updated_at: new Date().toISOString(),
            open_at: new Date().toISOString(),
          })
          .in('id', chunk)
          .eq('status', SESSION_STATUS.DRAFT)
          .select('id');

        if (updateError) {
          console.error(`Error opening sessions chunk ${i}:`, updateError);
          // Continue with other chunks instead of failing entirely
          continue;
        }

        updatedCount += updated?.length || 0;
      }
    } else {
      // ─── Filter approach: use month/year to avoid sending any IDs ───
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 1).toISOString();

      const { data: updated, error: updateError } = await supabase
        .from('sessions')
        .update({
          status: SESSION_STATUS.AVAILABLE,
          updated_at: new Date().toISOString(),
          open_at: new Date().toISOString(),
        })
        .gte('start_time', startDate)
        .lt('start_time', endDate)
        .eq('status', SESSION_STATUS.DRAFT)
        .select('id');

      if (updateError) {
        console.error('Error opening sessions by month:', updateError);
        return NextResponse.json(
          { error: `Failed to open sessions: ${updateError.message}` },
          { status: 500 }
        );
      }

      updatedCount = updated?.length || 0;
    }

    // ========== STEP 4: Return Response ==========
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