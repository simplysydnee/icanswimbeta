import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import Joi from 'joi';
import { emailService } from '@/lib/email-service';

const bodySchema = Joi.object({
  child_first_name: Joi.string().trim().required(),
  child_last_name: Joi.string().trim().required(),
  child_date_of_birth: Joi.alternatives()
    .try(Joi.date().iso(), Joi.string().trim())
    .required(),
  child_gender: Joi.string().valid('male', 'female', 'other').required(),

  parent_name: Joi.string().trim().required(),
  parent_email: Joi.string().email().required(),
  parent_phone: Joi.string().trim().min(1).required(),
  parent_address: Joi.string().trim().min(1).required(),
  parent_city: Joi.string().trim().min(1).required(),
  parent_state: Joi.string().trim().length(2).uppercase().required(),
  parent_zip: Joi.string()
    .trim()
    .pattern(/^\d{5}(-\d{4})?$/)
    .required(),
}).options({ stripUnknown: true });

function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  const buf = randomBytes(16);
  for (let i = 0; i < 14; i++) s += chars[buf[i]! % chars.length];
  return `${s}Aa1`;
}

function emailDomain(email: string): string {
  const parts = email.toLowerCase().trim().split('@');
  return parts.length >= 2 ? parts[1]! : '';
}

async function resolveFundingSourceId(
  admin: ReturnType<typeof createSupabaseAdmin>,
  coordinatorEmail: string | null | undefined
): Promise<string | null> {
  const domain = coordinatorEmail ? emailDomain(coordinatorEmail) : '';
  if (!domain) return null;

  const { data: sources, error } = await admin
    .from('funding_sources')
    .select('id, short_name, allowed_email_domains')
    .eq('is_active', true);

  if (error || !sources?.length) return null;
/*
  for (const fs of sources) {
    const short = fs.short_name?.toLowerCase();
    if (short && short === domain) return fs.id;

    const allowed: string[] = fs.allowed_email_domains ?? [];
    for (const entry of allowed) {
      const normalized = entry.toLowerCase().replace(/^@/, '');
      if (normalized === domain) return fs.id;
    }
  }
*/
  return null;
}

async function assertCoordinatorAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
  const list = roles?.map((r) => r.role) ?? [];
  return (
    list.includes('coordinator') ||
    list.includes('vmrc_coordinator') ||
    list.includes('admin')
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await assertCoordinatorAccess(supabase, user.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Coordinator or admin access required' }, { status: 403 });
    }

    const raw = await request.json();
    const { error: validationError, value } = bodySchema.validate(raw);
    if (validationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationError.details },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const admin = createSupabaseAdmin(supabaseUrl, serviceKey);

    const parentEmailNorm = value.parent_email.toLowerCase().trim();

    const { data: coordProfile, error: coordErr } = await admin
      .from('profiles')
      .select('id, email, phone, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (coordErr || !coordProfile) {
      return NextResponse.json({ error: 'Could not load coordinator profile' }, { status: 500 });
    }

//    const fundingSourceId = await resolveFundingSourceId(admin, coordProfile.email);

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', parentEmailNorm)
      .maybeSingle();

    let parentId: string;
    let parentCreated = false;
    let tempPassword: string | undefined;

    if (existingProfile) {
      parentId = existingProfile.id;
      await admin
        .from('profiles')
        .update({
          full_name: value.parent_name,
          phone: value.parent_phone || null,
          address: value.parent_address || null,
          city: value.parent_city || null,
          state: value.parent_state || null,
          zip: value.parent_zip || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parentId);
    } else {
      tempPassword = generateTempPassword();
      const { data: authData, error: authErrorCreate } = await admin.auth.admin.createUser({
        email: parentEmailNorm,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: value.parent_name,
          phone: value.parent_phone || undefined,
        },
      });

      if (authErrorCreate || !authData.user) {
        return NextResponse.json(
          { error: authErrorCreate?.message || 'Failed to create parent account' },
          { status: 400 }
        );
      }

      parentId = authData.user.id;

      const { error: profileUpsertError } = await admin.from('profiles').upsert({
        id: parentId,
        email: parentEmailNorm,
        full_name: value.parent_name,
        phone: value.parent_phone || null,
        //address: value.parent_address || null,
        //city: value.parent_city || null,
        //state: value.parent_state || null,
        // zip: value.parent_zip || null,
        updated_at: new Date().toISOString(),
      });

      if (profileUpsertError) {
        return NextResponse.json({ error: profileUpsertError.message }, { status: 500 });
      }

      const { error: roleError } = await admin.from('user_roles').upsert(
        { user_id: parentId, role: 'parent' },
        { onConflict: 'user_id,role' }
      );

      if (roleError) {
        return NextResponse.json({ error: roleError.message }, { status: 500 });
      }

      parentCreated = true;
    }

    const dob =
      typeof value.child_date_of_birth === 'string'
        ? value.child_date_of_birth.slice(0, 10)
        : new Date(value.child_date_of_birth).toISOString().slice(0, 10);

    const swimmerPayload: Record<string, unknown> = {
      parent_id: parentId,
      first_name: value.child_first_name,
      last_name: value.child_last_name,
      date_of_birth: dob,
      gender: value.child_gender,
      coordinator_id: user.id,
//      funding_source_id: fundingSourceId,
      funding_coordinator_email:
        (coordProfile.email ?? user.email ?? '').toLowerCase().trim() || null,
      funding_coordinator_phone: coordProfile.phone ?? null,
      funding_coordinator_name: coordProfile.full_name ?? null,
      payment_type: 'funding_source',
      enrollment_status: 'waitlist',
      approval_status: 'approved',
      assessment_status: null,
      created_by: user.id,
      availability: [],
    };

    const { data: swimmer, error: swimmerError } = await admin
      .from('swimmers')
      .insert(swimmerPayload)
      .select('id')
      .maybeSingle();

    if (swimmerError || !swimmer) {
      console.error('Coordinator referral swimmer insert:', swimmerError);
      return NextResponse.json(
        { error: swimmerError?.message || 'Failed to create swimmer' },
        { status: 500 }
      );
    }

    const childName = `${value.child_first_name} ${value.child_last_name}`;
    const parentDisplayName = value.parent_name;

    try {
      if (parentCreated && tempPassword) {
        await emailService.sendCoordinatorReferralNewParent({
          parentEmail: parentEmailNorm,
          parentName: parentDisplayName,
          childName,
          temporaryPassword: tempPassword,
        });
      } else {
        await emailService.sendCoordinatorReferralExistingParent({
          parentEmail: parentEmailNorm,
          parentName: existingProfile?.full_name || parentDisplayName,
          childName,
        });
      }
    } catch (emailErr) {
      console.error('Coordinator referral email:', emailErr);
    }

    return NextResponse.json({
      success: true,
      swimmer_id: swimmer.id,
      parent_created: parentCreated,
    });
  } catch (e) {
    console.error('POST /api/coordinator/referral', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
