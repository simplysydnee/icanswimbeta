import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { PO_ACTIVE_STATUSES } from '@/lib/po-attention';

export const dynamic = 'force-dynamic';

/** Matches app-wide “funded” checks (see `src/types/swimmer.ts` `isFundedSwimmer`). */
function isFundedSwimmer(row: {
  funding_source_id?: string | null;
  payment_type?: string | null;
}): boolean {
  if (row.funding_source_id) return true;
  const pt = (row.payment_type || '').toLowerCase();
  return pt === 'funded' || pt === 'funding_source' || pt === 'scholarship';
}

/** PO rows that still represent an authorization the swimmer is drawing down (see `pos` / `pos-validation`). */
const PO_STATUSES_FOR_RENEWAL = [
  ...PO_ACTIVE_STATUSES,
  'approved_pending_auth',
] as const;

function isLessonsPo(poType: string | null | undefined): boolean {
  return !poType || poType === 'lessons';
}

function endDateWithinTwoDays(endDateStr: string | null | undefined): boolean {
  if (!endDateStr) return false;
  const ymd = endDateStr.length >= 10 ? endDateStr.slice(0, 10) : endDateStr;
  const end = startOfDay(new Date(`${ymd}T12:00:00`));
  if (Number.isNaN(end.getTime())) return false;
  const today = startOfDay(new Date());
  const d = differenceInCalendarDays(end, today);
  return d >= 0 && d <= 2;
}

function pickFundingRow(poOrSwimmer: Record<string, unknown> | undefined) {
  if (!poOrSwimmer) return undefined;
  const raw =
    poOrSwimmer.funding_source ??
    poOrSwimmer.funding_sources ??
    undefined;
  return Array.isArray(raw) ? (raw[0] as Record<string, unknown>) : (raw as Record<string, unknown> | undefined);
}

/** Columns from `015_add_funding_source_price_fields.sql` — present across DB variants. */
function swimmerRollupUsed(sw: Record<string, unknown> | undefined): number {
  if (!sw) return 0;
  return Number(sw.authorized_sessions_used ?? 0);
}

function swimmerRollupAuthorized(sw: Record<string, unknown> | undefined): number {
  if (!sw) return 0;
  return Number(sw.authorized_sessions_total ?? 0);
}

function authExpiryYmd(sw: Record<string, unknown> | undefined): string | null {
  const v = sw?.authorization_expires_at;
  if (typeof v !== 'string' || v.length < 10) return null;
  return v.slice(0, 10);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['instructor', 'admin']);

    const roles = roleRows?.map((r) => r.role) || [];
    if (!roles.includes('instructor') && !roles.includes('admin')) {
      return NextResponse.json({ error: 'Instructor access required' }, { status: 403 });
    }

    const instructorId = user.id;
    const windowStart = addDays(new Date(), -365).toISOString();
    const windowEnd = addDays(new Date(), 365).toISOString();

    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select(
        `
        id,
        start_time,
        bookings (
          id,
          status,
          swimmer_id,
          swimmer:swimmers (
            id,
            first_name,
            last_name,
            funding_source_id,
            payment_type
          )
        )
      `
      )
      .eq('instructor_id', instructorId)
      .gte('start_time', windowStart)
      .lte('start_time', windowEnd)
      .order('start_time', { ascending: true });
    if (sessErr) {
      console.error('funded-po-renewal-queue sessions:', sessErr);
      return NextResponse.json(
        { error: 'Failed to load sessions', details: sessErr.message },
        { status: 500 }
      );
    }

    type FlatBooking = {
      sessionId: string;
      sessionStart: string;
      bookingId: string;
      swimmerId: string;
      firstName: string;
      lastName: string;
      fundingSourceId: string | null;
      paymentType: string | null;
    };

    const flat: FlatBooking[] = [];
    for (const s of sessions || []) {
      const bookings = Array.isArray(s.bookings) ? s.bookings : s.bookings ? [s.bookings] : [];
      for (const b of bookings) {
        if (!b || b.status === 'cancelled') continue;
        const rawSw = (
          (b as { swimmer?: unknown; swimmers?: unknown }).swimmer ??
          (b as { swimmers?: unknown }).swimmers
        ) as
          | {
              id: string;
              first_name: string;
              last_name: string;
              funding_source_id?: string | null;
              payment_type?: string | null;
            }
          | {
              id: string;
              first_name: string;
              last_name: string;
              funding_source_id?: string | null;
              payment_type?: string | null;
            }[]
          | null
          | undefined;
        const sw = Array.isArray(rawSw) ? rawSw[0] : rawSw;
        if (!sw?.id) continue;
        if (
          !isFundedSwimmer({
            funding_source_id: sw.funding_source_id,
            payment_type: sw.payment_type,
          })
        ) {
          continue;
        }
        flat.push({
          sessionId: s.id,
          sessionStart: s.start_time,
          bookingId: b.id,
          swimmerId: sw.id,
          firstName: sw.first_name,
          lastName: sw.last_name,
          fundingSourceId: sw.funding_source_id ?? null,
          paymentType: sw.payment_type ?? null,
        });
      }
    }

    const swimmerIds = [...new Set(flat.map((r) => r.swimmerId))];
    if (swimmerIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const { data: swimmerRows, error: swErr } = await supabase
      .from('swimmers')
      .select(
        `
        id,
        authorized_sessions_used,
        authorized_sessions_total,
        authorization_expires_at,
        funding_source:funding_sources ( renewal_alert_threshold, lessons_per_po )
      `
      )
      .in('id', swimmerIds);

    if (swErr) {
      console.error('funded-po-renewal-queue swimmers:', swErr);
      return NextResponse.json(
        { error: 'Failed to load swimmer funding usage', details: swErr.message },
        { status: 500 }
      );
    }

    const swimmerById = new Map<string, Record<string, unknown>>();
    for (const row of swimmerRows || []) {
      if (row && typeof row === 'object' && 'id' in row && typeof (row as { id: string }).id === 'string') {
        swimmerById.set((row as { id: string }).id, row as Record<string, unknown>);
      }
    }

    const { data: posRows, error: poErr } = await supabase
      .from('purchase_orders')
      .select(
        `
        id,
        swimmer_id,
        funding_source_id,
        po_type,
        status,
        sessions_authorized,
        sessions_used,
        end_date,
        parent_po_id,
        created_at,
        funding_source:funding_sources ( renewal_alert_threshold, lessons_per_po )
      `
      )
      .in('swimmer_id', swimmerIds)
      //.in('status', [...PO_STATUSES_FOR_RENEWAL])
      .order('created_at', { ascending: false });
      console.log("posRows...", posRows, swimmerIds);
    if (poErr) {
      console.error('funded-po-renewal-queue pos:', poErr);
      return NextResponse.json(
        { error: 'Failed to load purchase orders', details: poErr.message },
        { status: 500 }
      );
    }

    const latestPoBySwimmer = new Map<string, (typeof posRows)[0]>();
    for (const po of posRows || []) {
      if (!po.swimmer_id) continue;
      if (!isLessonsPo(po.po_type as string | null)) continue;
      if (!latestPoBySwimmer.has(po.swimmer_id)) {
        latestPoBySwimmer.set(po.swimmer_id, po);
      }
    }

    const parentPoIds = [...latestPoBySwimmer.values()].map((p) => p.id);
    let pendingChildren: { id: string; parent_po_id: string | null }[] | null = null;
    if (parentPoIds.length > 0) {
      const { data, error: pendErr } = await supabase
        .from('purchase_orders')
        .select('id, parent_po_id')
        .in('parent_po_id', parentPoIds)
        .eq('status', 'pending');
      if (pendErr) {
        console.error('funded-po-renewal-queue pending children:', pendErr);
        return NextResponse.json({ error: 'Failed to load renewal state' }, { status: 500 });
      }
      pendingChildren = data;
    }

    const parentIdsWithPendingRenewal = new Set(
      (pendingChildren || []).map((r) => r.parent_po_id).filter(Boolean) as string[]
    );

    const bookingIds = [...new Set(flat.map((f) => f.bookingId))];
    const { data: notes } = await supabase
      .from('progress_notes')
      .select('booking_id')
      .in('booking_id', bookingIds);

    const hasNote = new Set((notes || []).map((n) => n.booking_id));

    const items: Array<{
      swimmerId: string;
      swimmerName: string;
      sessionId: string;
      bookingId: string;
      sessionStart: string;
      purchaseOrderId: string;
      sessionsUsed: number;
      sessionsAuthorized: number;
      renewalThreshold: number;
      effectiveRenewalThreshold: number;
      endDate: string | null;
      reasons: ('threshold' | 'expiry')[];
      needsProgress: boolean;
      returnTo: string;
      progressUrl: string;
    }> = [];

    const seenSwimmer = new Set<string>();

    for (const row of flat) {
      const po = latestPoBySwimmer.get(row.swimmerId);
      if (!po) continue;
      if (parentIdsWithPendingRenewal.has(po.id)) continue;

      const swRow = swimmerById.get(row.swimmerId);
      const fsPo = pickFundingRow(po as Record<string, unknown>);
      const fsSw = pickFundingRow(swRow);
      const fs = fsPo ?? fsSw;
      const lessonsPerPo = Number((fs as { lessons_per_po?: number } | undefined)?.lessons_per_po ?? 12);
      const renewalThreshold = Number(
        (fs as { renewal_alert_threshold?: number } | undefined)?.renewal_alert_threshold ?? 11
      );

      const poUsed = Number(po.sessions_used ?? 0);
      const swUsed = swimmerRollupUsed(swRow);
      const sessionsUsed = Math.max(poUsed, swUsed);

      const poAuth = Number(po.sessions_authorized ?? 0);
      const swAuth = swimmerRollupAuthorized(swRow);
      const authorized = Math.max(poAuth, swAuth, lessonsPerPo, 1);

      const effectiveThreshold = Math.min(renewalThreshold, Math.max(1, authorized));
      const atThreshold = sessionsUsed >= effectiveThreshold;

      const authYmd = authExpiryYmd(swRow);
      const nearExpiry =
        endDateWithinTwoDays(po.end_date as string | null) || endDateWithinTwoDays(authYmd);
      if (!atThreshold && !nearExpiry) continue;

      if (seenSwimmer.has(row.swimmerId)) continue;
      seenSwimmer.add(row.swimmerId);

      const reasons: ('threshold' | 'expiry')[] = [];
      if (atThreshold) reasons.push('threshold');
      if (nearExpiry) reasons.push('expiry');

      const needsProgress = !hasNote.has(row.bookingId);
      const returnTo = `/instructor/po-renewal/${row.swimmerId}?parentPoId=${encodeURIComponent(po.id)}`;
      const progressUrl = `/instructor/progress/${row.sessionId}?booking=${encodeURIComponent(row.bookingId)}&returnTo=${encodeURIComponent(returnTo)}`;

      items.push({
        swimmerId: row.swimmerId,
        swimmerName: `${row.firstName} ${row.lastName}`.trim(),
        sessionId: row.sessionId,
        bookingId: row.bookingId,
        sessionStart: row.sessionStart,
        purchaseOrderId: po.id,
        sessionsUsed,
        sessionsAuthorized: authorized,
        renewalThreshold,
        effectiveRenewalThreshold: effectiveThreshold,
        endDate: (po.end_date as string) || authYmd || null,
        reasons,
        needsProgress,
        returnTo,
        progressUrl,
      });
    }

    items.sort((a, b) => a.sessionStart.localeCompare(b.sessionStart));

    return NextResponse.json({
      items,
      generatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx"),
    });
  } catch (e) {
    console.error('funded-po-renewal-queue:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
