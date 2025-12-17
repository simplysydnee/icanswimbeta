import { createClient } from '@/lib/supabase/server';

export interface POSValidationResult {
  canBook: boolean;
  hasActivePOS: boolean;
  availableSessions: number;
  totalRequested: number;
  warnings: string[];
  errors: string[];
  posDetails: {
    id: string;
    status: string;
    sessions_authorized: number;
    sessions_booked: number;
    sessions_available: number;
    end_date: string;
  } | null;
}

/**
 * Validate if swimmer can book lessons against their POS
 */
export async function validatePOSForBooking(
  swimmerId: string,
  sessionsRequested: number,
  sessionDates: string[] // ISO date strings
): Promise<POSValidationResult> {
  const supabase = await createClient();

  const result: POSValidationResult = {
    canBook: true,
    hasActivePOS: false,
    availableSessions: 0,
    totalRequested: sessionsRequested,
    warnings: [],
    errors: [],
    posDetails: null
  };

  // Get swimmer info
  const { data: swimmer } = await supabase
    .from('swimmers')
    .select('id, funding_source_id, funding_sources(type)')
    .eq('id', swimmerId)
    .single();

  // Private pay swimmers don't need POS validation
  if (!swimmer?.funding_source_id || swimmer?.funding_sources?.type === 'private_pay') {
    result.canBook = true;
    return result;
  }

  // Get active POS for this swimmer
  const { data: activePOS } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('swimmer_id', swimmerId)
    .eq('po_type', 'lessons')
    .in('status', ['active', 'approved_pending_auth'])
    .order('start_date', { ascending: true });

  if (!activePOS || activePOS.length === 0) {
    // Check if there's a pending POS
    const { data: pendingPOS } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('swimmer_id', swimmerId)
      .eq('po_type', 'lessons')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pendingPOS) {
      result.canBook = true; // Allow booking
      result.warnings.push(
        `⚠️ Booking pending coordinator approval. Sessions will be held until POS is approved.`
      );
      result.posDetails = {
        id: pendingPOS.id,
        status: pendingPOS.status,
        sessions_authorized: pendingPOS.sessions_authorized,
        sessions_booked: pendingPOS.sessions_booked,
        sessions_available: pendingPOS.sessions_authorized - pendingPOS.sessions_booked,
        end_date: pendingPOS.end_date
      };
      return result;
    }

    result.canBook = false;
    result.errors.push('No active Purchase Order found. Please contact your coordinator.');
    return result;
  }

  // Calculate total available sessions across all active POS
  let totalAvailable = 0;
  for (const pos of activePOS) {
    totalAvailable += (pos.sessions_authorized - pos.sessions_booked);
  }

  result.hasActivePOS = true;
  result.availableSessions = totalAvailable;

  // Use the first active POS for details
  const primaryPOS = activePOS[0];
  result.posDetails = {
    id: primaryPOS.id,
    status: primaryPOS.status,
    sessions_authorized: primaryPOS.sessions_authorized,
    sessions_booked: primaryPOS.sessions_booked,
    sessions_available: primaryPOS.sessions_authorized - primaryPOS.sessions_booked,
    end_date: primaryPOS.end_date
  };

  // Check if booking exceeds available sessions
  if (sessionsRequested > totalAvailable) {
    const overflow = sessionsRequested - totalAvailable;

    result.canBook = true; // Still allow, but warn
    result.warnings.push(
      `⚠️ ${overflow} lesson${overflow > 1 ? 's' : ''} exceed${overflow === 1 ? 's' : ''} your current authorization.`
    );
    result.warnings.push(
      `Sessions ${totalAvailable + 1}-${sessionsRequested} pending coordinator approval for renewal POS.`
    );
  }

  // Check if any sessions fall outside POS date range
  const endDate = new Date(primaryPOS.end_date);
  const sessionsAfterEnd = sessionDates.filter(d => new Date(d) > endDate);

  if (sessionsAfterEnd.length > 0) {
    result.warnings.push(
      `⚠️ ${sessionsAfterEnd.length} session${sessionsAfterEnd.length > 1 ? 's' : ''} fall${sessionsAfterEnd.length === 1 ? 's' : ''} after your POS end date (${primaryPOS.end_date}).`
    );
  }

  // Check if POS is "approved_pending_auth"
  if (primaryPOS.status === 'approved_pending_auth') {
    result.warnings.push(
      `ℹ️ Your POS is approved but awaiting authorization number from your coordinator.`
    );
  }

  return result;
}

/**
 * Get POS summary for a swimmer (for display in booking UI)
 */
export async function getSwimmerPOSSummary(swimmerId: string) {
  const supabase = await createClient();

  // Get swimmer funding info
  const { data: swimmer } = await supabase
    .from('swimmers')
    .select('funding_source_id, funding_sources(name, short_name, type)')
    .eq('id', swimmerId)
    .single();

  if (!swimmer?.funding_source_id || swimmer?.funding_sources?.type === 'private_pay') {
    return {
      isFunded: false,
      fundingSource: null,
      activePOS: null,
      needsAttention: false
    };
  }

  // Get active/pending POS
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('swimmer_id', swimmerId)
    .eq('po_type', 'lessons')
    .in('status', ['active', 'approved_pending_auth', 'pending'])
    .order('status', { ascending: true }) // active first
    .limit(1)
    .single();

  return {
    isFunded: true,
    fundingSource: swimmer.funding_sources,
    activePOS: pos ? {
      id: pos.id,
      status: pos.status,
      sessions_authorized: pos.sessions_authorized,
      sessions_booked: pos.sessions_booked,
      sessions_used: pos.sessions_used,
      sessions_available: pos.sessions_authorized - pos.sessions_booked,
      start_date: pos.start_date,
      end_date: pos.end_date,
      authorization_number: pos.authorization_number
    } : null,
    needsAttention: pos?.status === 'pending' || !pos
  };
}