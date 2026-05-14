/**
 * Server-side session hold guard.
 *
 * The /api/sessions/hold route writes `held_by` + `held_until` onto a session
 * when a parent enters the booking wizard's confirmation step. Previously no
 * booking route honored those columns, so a second parent could book a session
 * the first one was actively holding (BUG-00c). These helpers add the missing
 * check and release the hold after a successful booking.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

type HoldFields = {
  held_by?: string | null;
  held_until?: string | null;
};

/**
 * Returns true if the session is currently held by a different user and the
 * hold has not yet expired. Stale holds (past held_until) are treated as not
 * held — release_expired_holds() will clean them up eventually.
 */
export function isSessionHeldByOther(session: HoldFields, userId: string): boolean {
  if (!session.held_by) return false;
  if (session.held_by === userId) return false;
  if (!session.held_until) return false;
  return new Date(session.held_until).getTime() > Date.now();
}

/**
 * Clear the hold for a session — used after a successful booking by the same
 * user who placed the hold, so the slot does not appear "held" to admins
 * inspecting the row afterward. Guarded by held_by = userId so we never clear
 * another user's hold by mistake.
 */
export async function clearSessionHold(
  serviceSupabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<void> {
  await serviceSupabase
    .from('sessions')
    .update({ held_by: null, held_until: null })
    .eq('id', sessionId)
    .eq('held_by', userId);
}
