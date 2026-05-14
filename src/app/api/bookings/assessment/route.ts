import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_FUNDING_SOURCE_CONFIG } from '@/lib/constants'
import { emailService } from '@/lib/email-service'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing Supabase env (service role)');
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceSupabase = getServiceSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, swimmerId } = body

    if (!sessionId || !swimmerId) {
      return NextResponse.json(
        { error: 'Session ID and Swimmer ID are required' },
        { status: 400 }
      )
    }

    // 1. Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, instructor:profiles!instructor_id(full_name, email)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // 2. Check session is available
    if (session.is_full || session.status === 'booked') {
      return NextResponse.json(
        { error: 'Session is no longer available' },
        { status: 400 }
      )
    }

    // 3. Get swimmer details
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .select('*, parent:profiles!parent_id(full_name, email, phone)')
      .eq('id', swimmerId)
      .single()

    if (swimmerError || !swimmer) {
      return NextResponse.json(
        { error: 'Swimmer not found' },
        { status: 404 }
      )
    }

    // 4. Verify parent owns this swimmer
    if (swimmer.parent_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to book for this swimmer' },
        { status: 403 }
      )
    }

    // 5. Check swimmer doesn't already have a pending/scheduled assessment
    const { data: existingAssessment } = await supabase
      .from('assessments')
      .select('id, status')
      .eq('swimmer_id', swimmerId)
      .in('status', ['scheduled', 'pending'])
      .single()

    if (existingAssessment) {
      return NextResponse.json(
        { error: 'Swimmer already has a pending assessment' },
        { status: 400 }
      )
    }

    // 6. Funding source authorization validation for assessment
    if (swimmer.funding_source_id) {
      const { data: fundingSource } = await supabase
        .from('funding_sources')
        .select('requires_authorization')
        .eq('id', swimmer.funding_source_id)
        .single();

      if (fundingSource?.requires_authorization) {
        const { data: purchaseOrders } = await supabase
          .from('purchase_orders')
          .select('id, sessions_authorized, sessions_used')
          .eq('swimmer_id', swimmerId)
          .eq('status', 'approved')
          .order('end_date', { ascending: true })
          .limit(1);

        if (purchaseOrders && purchaseOrders.length > 0) {
          const activePo = purchaseOrders[0];
          if (activePo.sessions_used >= activePo.sessions_authorized) {
            return NextResponse.json(
              { error: 'Funding source authorization exhausted - no sessions available for assessment' },
              { status: 400 }
            );
          }
        }
      }
    }

    // 7. Create booking atomically via book_session RPC
    const { data: bookingResult, error: bookingRpcError } = await serviceSupabase.rpc('book_session', {
      p_session_id: sessionId,
      p_swimmer_id: swimmerId,
      p_parent_id: user.id,
      p_booking_type: 'assessment',
      p_purchase_order_id: null,
      p_status: 'confirmed',
    })

    if (bookingRpcError || bookingResult?.error) {
      const errorCode = bookingResult?.error || bookingRpcError?.message || 'internal_error'
      console.error('book_session RPC error:', errorCode)
      const errorMap: Record<string, { status: number; message: string }> = {
        session_full: { status: 409, message: 'Session is full' },
        session_not_available: { status: 409, message: 'Session is not available' },
        session_held: { status: 409, message: 'Session is currently held by another user' },
        session_not_found: { status: 404, message: 'Session not found' },
        duplicate_booking: { status: 409, message: 'Already booked for this session' },
        swimmer_conflict: { status: 409, message: 'Swimmer has a conflicting booking' },
      }
      const err = errorMap[errorCode] ?? { status: 500, message: 'Failed to create booking' }
      return NextResponse.json({ error: err.message }, { status: err.status })
    }

    const bookingId = bookingResult.booking_id

    // 8. Create assessment record
    const { data: assessment, error: assessmentError } = await serviceSupabase
      .from('assessments')
      .insert({
        swimmer_id: swimmerId,
        session_id: sessionId,
        booking_id: bookingId,
        scheduled_date: session.start_time,
        status: 'scheduled',
        approval_status: swimmer.funding_source_id ? 'pending' : 'approved',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (assessmentError) {
      console.error('Assessment creation error:', assessmentError)
      // Rollback booking atomically
      await serviceSupabase.rpc('cancel_booking', {
        p_booking_id: bookingId,
        p_cancelled_by: user.id,
        p_cancel_reason: 'Assessment creation failed - rollback',
        p_cancel_source: 'admin',
        p_is_late_cancel: false,
        p_late_cancel_type: null,
        p_late_cancel_note: null,
      })
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      )
    }

    // 9. Update swimmer assessment status
    await serviceSupabase
      .from('swimmers')
      .update({
        assessment_status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', swimmerId)

    // 10. Create Assessment Purchase Order for funded clients
    let assessmentPO = null
    if (swimmer.funding_source_id) {
      assessmentPO = await createAssessmentPO(
        serviceSupabase,
        swimmer.id,
        swimmer.funding_source_id,
        user.id,
        swimmer.parent_id,
        assessment.id,
        swimmer.coordinator_email || null
      )
    }

    // 11. Send booking confirmation email via edge function for non-funded clients
    try {
      const { data: swimmerWithFunding } = await supabase
        .from('swimmers')
        .select(`
          id,
          funding_source_id,
          funding_sources (
            id,
            requires_authorization
          )
        `)
        .eq('id', swimmerId)
        .single()

      const fundingSource = swimmerWithFunding?.funding_sources as any

      if (!fundingSource?.requires_authorization) {
        await supabase.functions.invoke('send-booking-confirmation', {
          body: { bookingId }
        })
      } else {
        console.log(`Skipping booking confirmation email for funded client (assessment booking ${bookingId})`)
      }
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError)
    }

    // Generate confirmation number for the response
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const confirmationNumber = `ICS-${dateStr}-${randomNum}`;

    // 12. Return success
    return NextResponse.json({
      success: true,
      confirmationNumber,
      booking: { id: bookingId },
      assessment: assessment,
      assessmentPO: assessmentPO,
    })

  } catch (error) {
    console.error('Assessment booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createAssessmentPO(
  supabase: any,
  swimmerId: string,
  fundingSourceId: string,
  createdBy: string,
  parentId: string,
  assessmentId: string,
  coordinatorEmail: string | null
) {
  try {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    const poNumber = `PO-ASSESS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        swimmer_id: swimmerId,
        funding_source_id: fundingSourceId,
        parent_id: parentId,
        created_by: createdBy,
        assessment_id: assessmentId,
        po_type: 'assessment',
        po_number: poNumber,
        authorized_sessions: DEFAULT_FUNDING_SOURCE_CONFIG.ASSESSMENT_SESSIONS,
        used_sessions: 0,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'pending',
        notes: 'Automatically created for assessment booking',
      })
      .select()
      .single()

    if (poError) {
      console.error('Error creating assessment PO:', poError)
      return null
    }

    await supabase
      .from('swimmers')
      .update({
        current_po_number: poNumber,
        po_expires_at: endDate.toISOString(),
        funded_sessions_authorized: DEFAULT_FUNDING_SOURCE_CONFIG.ASSESSMENT_SESSIONS,
        funded_sessions_used: 0,
      })
      .eq('id', swimmerId)

    return po
  } catch (error) {
    console.error('Error in createAssessmentPO:', error)
    return null
  }
}
