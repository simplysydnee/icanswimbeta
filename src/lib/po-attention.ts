import { addDays, startOfDay, isBefore, isAfter } from 'date-fns';

/** Matches billing "active PO" lifecycle in `src/app/api/pos/route.ts`. */
export const PO_ACTIVE_STATUSES = ['in_progress', 'approved', 'active'] as const;

export function isActivePurchaseOrderStatus(status: string): boolean {
  return (PO_ACTIVE_STATUSES as readonly string[]).includes(status);
}

export type PoAttentionSwimmerSession = {
  session?: { start_time?: string | null } | null;
};

export type PoAttentionPurchaseOrder = {
  status: string;
  end_date: string;
  swimmer?: {
    id?: string;
    sessions?: PoAttentionSwimmerSession[];
  } | null;
};

function parseEndDateAsLocalDay(endDate: string): Date {
  if (!endDate) return new Date(NaN);
  const ymd = endDate.length >= 10 ? endDate.slice(0, 10) : endDate;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return startOfDay(new Date(endDate));
  return startOfDay(new Date(y, m - 1, d));
}

function isPendingWorkflow(status: string): boolean {
  return status === 'pending' || status === 'approved_pending_auth';
}

/** Statuses where an approaching end_date is operationally meaningful. */
const ENDING_SOON_STATUSES = new Set([
  'active',
  'approved',
  'in_progress',
  'approved_pending_auth',
  'pending',
]);

/**
 * Rule 2: end_date falls between start of today and end of today + 30 (inclusive).
 */
export function isPurchaseOrderEndingWithinDays(
  status: string,
  endDate: string,
  days: number,
  now: Date = new Date()
): boolean {
  if (!ENDING_SOON_STATUSES.has(status)) return false;
  const end = parseEndDateAsLocalDay(endDate);
  if (Number.isNaN(end.getTime())) return false;
  const today = startOfDay(now);
  const last = startOfDay(addDays(now, days));
  return !isBefore(end, today) && !isAfter(end, last);
}

function swimmerHasConfirmedSessionFromTodayOnward(
  swimmer: PoAttentionPurchaseOrder['swimmer'],
  now: Date = new Date()
): boolean {
  const sessions = swimmer?.sessions;
  if (!sessions?.length) return false;
  const cutoff = startOfDay(now).getTime();
  return sessions.some((s) => {
    const t = s.session?.start_time;
    if (!t) return false;
    return new Date(t).getTime() >= cutoff;
  });
}

/**
 * Rule 3: swimmer has an upcoming-or-today confirmed session but this PO is not in an active lifecycle state.
 */
export function isInactivePoWithUpcomingConfirmedBooking(
  po: PoAttentionPurchaseOrder,
  now: Date = new Date()
): boolean {
  if (isActivePurchaseOrderStatus(po.status)) return false;
  return swimmerHasConfirmedSessionFromTodayOnward(po.swimmer, now);
}

export type PoAttentionReason = 'pending_workflow' | 'ending_soon' | 'inactive_with_booking';

export function getPurchaseOrderAttentionReasons(
  po: PoAttentionPurchaseOrder,
  now: Date = new Date()
): PoAttentionReason[] {
  const reasons: PoAttentionReason[] = [];
  if (isPendingWorkflow(po.status)) {
    reasons.push('pending_workflow');
  }
  if (isPurchaseOrderEndingWithinDays(po.status, po.end_date, 30, now)) {
    reasons.push('ending_soon');
  }
  if (isInactivePoWithUpcomingConfirmedBooking(po, now)) {
    reasons.push('inactive_with_booking');
  }
  return reasons;
}

export function isPurchaseOrderNeedingAttention(
  po: PoAttentionPurchaseOrder,
  now: Date = new Date()
): boolean {
  return getPurchaseOrderAttentionReasons(po, now).length > 0;
}

export const PO_ATTENTION_REASON_LABELS: Record<PoAttentionReason, string> = {
  pending_workflow: 'Pending approval or auth number',
  ending_soon: 'PO ends within 30 days',
  inactive_with_booking: 'Confirmed booking but PO not active',
};
