import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    if (body.payRateCents !== undefined && body.payRateCents < 0) {
      return NextResponse.json({ error: 'Pay rate cannot be negative' }, { status: 400 });
    }

    if (body.employmentType && !['hourly', 'salary', 'contractor'].includes(body.employmentType)) {
      return NextResponse.json({ error: 'Invalid employment type' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.payRateCents !== undefined) {
      updateData.pay_rate_cents = body.payRateCents;
    }
    if (body.employmentType !== undefined) {
      updateData.employment_type = body.employmentType;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select('id, full_name, email, phone, avatar_url, pay_rate_cents, employment_type, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({ instructor: data });
  } catch (error: any) {
    console.error('Error updating instructor:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}