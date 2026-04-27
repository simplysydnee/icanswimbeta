import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { emailService } from '@/lib/email-service';

type ApprovalDecision = 'approved' | 'declined';

async function getUserRoles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{ isAdmin: boolean; isCoordinator: boolean }> {
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
  const list = roles?.map((r) => r.role) ?? [];
  return {
    isAdmin: list.includes('admin'),
    isCoordinator:
      list.includes('coordinator') || list.includes('vmrc_coordinator'),
  };
}

/** PATCH — update approval_status for a swimmer assigned to this coordinator */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: swimmerId } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isAdmin, isCoordinator } = await getUserRoles(supabase, user.id);
    if (!isAdmin && !isCoordinator) {
      return NextResponse.json({ error: 'Coordinator or admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const decision = body?.approval_status as ApprovalDecision | undefined;
    if (decision !== 'approved' && decision !== 'declined') {
      return NextResponse.json(
        { error: 'approval_status must be "approved" or "declined"' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const admin = createSupabaseAdmin(supabaseUrl, serviceKey);

    const { data: swimmer, error: fetchError } = await admin
      .from('swimmers')
      .select(
        `
        id,
        coordinator_id,
        funding_coordinator_email,
        first_name,
        last_name,
        parent_id,
        parent:profiles!parent_id ( full_name, email )
      `
      )
      .eq('id', swimmerId)
      .maybeSingle();

    if (fetchError) {
      console.error('PATCH fetch swimmer:', fetchError);
      return NextResponse.json(
        { error: fetchError.message || 'Swimmer not found' },
        { status: fetchError.code === 'PGRST116' ? 404 : 500 }
      );
    }

    if (!swimmer) {
      return NextResponse.json({ error: 'Swimmer not found' }, { status: 404 });
    }

    const meEmail = (user.email ?? '').toLowerCase().trim();
    const swimmerEmail = (swimmer.funding_coordinator_email ?? '').toLowerCase().trim();
    const ownsByEmail = meEmail !== '' && swimmerEmail === meEmail;
    const ownsById = swimmer.coordinator_id === user.id;
    if (!isAdmin && !ownsById && !ownsByEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parent = Array.isArray(swimmer.parent) ? swimmer.parent[0] : swimmer.parent;
    const parentEmail = parent?.email;
    const parentName = parent?.full_name ?? 'Parent';
    const childName = `${swimmer.first_name} ${swimmer.last_name}`;

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      approval_status: decision,
      updated_at: now,
    };

    if (decision === 'approved') {
      updatePayload.approved_at = now;
      updatePayload.approved_by = user.id;
      //updatePayload.enrollment_status = 'waitlist';
    } 

    const { data: updatedRows, error: updateError } = await admin
      .from('swimmers')
      .update(updatePayload)
      .eq('id', swimmerId)
      .select('id, approval_status, enrollment_status');

    if (updateError) {
      console.error('PATCH coordinator swimmer:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const updated = updatedRows?.[0];
    if (!updated) {
      return NextResponse.json(
        { error: 'Update did not apply or no row was returned.' },
        { status: 409 }
      );
    }

    if (decision === 'declined' && parentEmail) {
      const { data: coordProfile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      try {
        await emailService.sendEnrollmentRejectionNotice({
          parentEmail,
          parentName,
          childName,
          coordinatorName: coordProfile?.full_name ?? undefined,
        });
      } catch (emailErr) {
        console.error('Rejection email failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      swimmer: updated,
    });
  } catch (e) {
    console.error('PATCH /api/coordinator/swimmers/[id]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
