import { createClient } from '@/lib/supabase/server';

interface CreateAssessmentPOSParams {
  swimmerId: string;
  fundingSourceId: string;
  assessmentDate: string; // ISO date string
  coordinatorEmail?: string;
}

interface PurchaseOrder {
  id: string;
  swimmer_id: string;
  funding_source_id: string;
  coordinator_id: string | null;
  po_type: 'assessment' | 'lessons';
  sub_code: string | null;
  sessions_authorized: number;
  sessions_booked: number;
  sessions_used: number;
  start_date: string;
  end_date: string;
  status: string;
  notes: string | null;
  parent_po_id: string | null;
  created_at: string;
}

interface POSResult {
  assessmentPO: PurchaseOrder;
  lessonsPO: PurchaseOrder;
}

/**
 * Create both Assessment and Lessons POS when assessment is booked
 * Called automatically when a funded swimmer books an assessment
 */
export async function createAssessmentPOSPair(
  params: CreateAssessmentPOSParams
): Promise<POSResult> {
  const supabase = await createClient();

  const { swimmerId, fundingSourceId, assessmentDate } = params;

  // Calculate dates
  const assessmentDateObj = new Date(assessmentDate);
  const dayAfterAssessment = new Date(assessmentDateObj);
  dayAfterAssessment.setDate(dayAfterAssessment.getDate() + 1);

  // Calculate lessons PO end date (3 months or June 30, whichever is earlier)
  const { data: endDateResult } = await supabase.rpc('calculate_pos_end_date', {
    p_start_date: dayAfterAssessment.toISOString().split('T')[0],
    p_months: 3
  });

  const lessonsEndDate = endDateResult || calculateFallbackEndDate(dayAfterAssessment);

  // Get coordinator info from swimmer
  const { data: swimmer } = await supabase
    .from('swimmers')
    .select('funding_coordinator_name, funding_coordinator_email')
    .eq('id', swimmerId)
    .single();

  // Get coordinator user ID if they exist in our system
  let coordinatorId = null;
  if (swimmer?.funding_coordinator_email) {
    const { data: coordinator } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', swimmer.funding_coordinator_email)
      .single();
    coordinatorId = coordinator?.id;
  }

  // 1. Create Assessment POS
  const { data: assessmentPO, error: assessmentError } = await supabase
    .from('purchase_orders')
    .insert({
      swimmer_id: swimmerId,
      funding_source_id: fundingSourceId,
      coordinator_id: coordinatorId,
      po_type: 'assessment',
      sub_code: 'ASMT',
      sessions_authorized: 1,
      sessions_booked: 1, // Assessment is already booked
      sessions_used: 0,
      start_date: assessmentDate,
      end_date: dayAfterAssessment.toISOString().split('T')[0],
      status: 'pending',
      notes: 'Auto-created when assessment was booked'
    })
    .select()
    .single();

  if (assessmentError) {
    console.error('Error creating assessment PO:', assessmentError);
    throw new Error(`Failed to create assessment PO: ${assessmentError.message}`);
  }

  // 2. Create Lessons POS
  const { data: lessonsPO, error: lessonsError } = await supabase
    .from('purchase_orders')
    .insert({
      swimmer_id: swimmerId,
      funding_source_id: fundingSourceId,
      coordinator_id: coordinatorId,
      po_type: 'lessons',
      sub_code: null,
      sessions_authorized: 12,
      sessions_booked: 0,
      sessions_used: 0,
      start_date: dayAfterAssessment.toISOString().split('T')[0],
      end_date: lessonsEndDate,
      status: 'pending',
      notes: 'Auto-created when assessment was booked',
      parent_po_id: assessmentPO.id // Link to assessment PO
    })
    .select()
    .single();

  if (lessonsError) {
    console.error('Error creating lessons PO:', lessonsError);
    throw new Error(`Failed to create lessons PO: ${lessonsError.message}`);
  }

  return { assessmentPO, lessonsPO };
}

/**
 * Fallback end date calculation if DB function fails
 */
function calculateFallbackEndDate(startDate: Date): string {
  const threeMonthsLater = new Date(startDate);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  // Fiscal year end is June 30
  const year = startDate.getMonth() >= 6 ? startDate.getFullYear() + 1 : startDate.getFullYear();
  const fiscalYearEnd = new Date(year, 5, 30); // June 30

  return threeMonthsLater < fiscalYearEnd
    ? threeMonthsLater.toISOString().split('T')[0]
    : fiscalYearEnd.toISOString().split('T')[0];
}

/**
 * Create renewal POS when swimmer reaches lesson 11 and books lesson 12
 */
export async function createRenewalPOS(
  currentPOId: string,
  lesson12Date: string
): Promise<PurchaseOrder> {
  const supabase = await createClient();

  // Get current PO details
  const { data: currentPO, error: fetchError } = await supabase
    .from('purchase_orders')
    .select('*, swimmer:swimmers(funding_coordinator_email)')
    .eq('id', currentPOId)
    .single();

  if (fetchError || !currentPO) {
    throw new Error('Could not find current PO');
  }

  // Calculate new PO dates
  const lesson12DateObj = new Date(lesson12Date);
  const newStartDate = new Date(lesson12DateObj);
  newStartDate.setDate(newStartDate.getDate() + 1); // Day after lesson 12

  // Calculate end date using DB function
  const { data: endDateResult } = await supabase.rpc('calculate_pos_end_date', {
    p_start_date: newStartDate.toISOString().split('T')[0],
    p_months: 3
  });

  const newEndDate = endDateResult || calculateFallbackEndDate(newStartDate);

  // Create new renewal PO
  const { data: renewalPO, error: createError } = await supabase
    .from('purchase_orders')
    .insert({
      swimmer_id: currentPO.swimmer_id,
      funding_source_id: currentPO.funding_source_id,
      coordinator_id: currentPO.coordinator_id,
      po_type: 'lessons',
      sessions_authorized: 12,
      sessions_booked: 0,
      sessions_used: 0,
      start_date: newStartDate.toISOString().split('T')[0],
      end_date: newEndDate,
      status: 'pending',
      parent_po_id: currentPO.id, // Link to previous PO
      notes: `Renewal PO - continuation from PO ${currentPO.id}`
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create renewal PO: ${createError.message}`);
  }

  return renewalPO;
}

/**
 * Check if swimmer needs renewal POS
 * Called when lesson 11 is completed and lesson 12 is scheduled
 */
export async function checkAndTriggerRenewal(
  swimmerId: string,
  lesson12Date: string
): Promise<PurchaseOrder | null> {
  const supabase = await createClient();

  // Find active lessons PO for this swimmer
  const { data: activePO } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('swimmer_id', swimmerId)
    .eq('po_type', 'lessons')
    .in('status', ['active', 'approved_pending_auth'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!activePO) {
    console.log('No active lessons PO found for swimmer');
    return null;
  }

  // Check if at lesson 11 (sessions_used = 11)
  if (activePO.sessions_used >= 11 && activePO.sessions_used < 12) {
    // Create renewal PO
    const renewalPO = await createRenewalPOS(activePO.id, lesson12Date);
    return renewalPO;
  }

  return null;
}

/**
 * Update sessions_booked when a lesson is booked
 */
export async function incrementSessionsBooked(
  swimmerId: string,
  sessionDate: string
): Promise<void> {
  const supabase = await createClient();

  // Find the appropriate PO for this session date
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('swimmer_id', swimmerId)
    .eq('po_type', 'lessons')
    .in('status', ['active', 'approved_pending_auth', 'pending'])
    .lte('start_date', sessionDate)
    .gte('end_date', sessionDate)
    .order('start_date', { ascending: true });

  if (!pos || pos.length === 0) {
    console.warn('No valid PO found for booking');
    return;
  }

  // Find PO with available sessions
  const availablePO = pos.find(po => po.sessions_booked < po.sessions_authorized);

  if (availablePO) {
    await supabase
      .from('purchase_orders')
      .update({ sessions_booked: availablePO.sessions_booked + 1 })
      .eq('id', availablePO.id);
  }
}

/**
 * Update sessions_used when a lesson is attended
 * Also adds the date to lesson_dates array
 */
export async function markSessionAttended(
  swimmerId: string,
  sessionDate: string
): Promise<void> {
  const supabase = await createClient();

  // Find the PO that has this session booked
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('swimmer_id', swimmerId)
    .in('status', ['active', 'approved_pending_auth'])
    .lte('start_date', sessionDate)
    .gte('end_date', sessionDate)
    .order('start_date', { ascending: true });

  if (!pos || pos.length === 0) {
    console.warn('No valid PO found for attendance');
    return;
  }

  // Find PO with sessions to use
  const activePO = pos.find(po => po.sessions_used < po.sessions_booked);

  if (activePO) {
    const newLessonDates = [...(activePO.lesson_dates || []), sessionDate];
    const newSessionsUsed = activePO.sessions_used + 1;

    // Check if PO is now completed
    const newStatus = newSessionsUsed >= activePO.sessions_authorized
      ? 'completed'
      : activePO.status;

    await supabase
      .from('purchase_orders')
      .update({
        sessions_used: newSessionsUsed,
        lesson_dates: newLessonDates,
        status: newStatus
      })
      .eq('id', activePO.id);
  }
}