import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_FUNDING_SOURCE_CONFIG } from '@/lib/constants'
import { emailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

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
      // First check if funding source requires authorization
      const { data: fundingSource } = await supabase
        .from('funding_sources')
        .select('requires_authorization')
        .eq('id', swimmer.funding_source_id)
        .single();

      if (fundingSource?.requires_authorization) {
        // Find active purchase order for this swimmer
        const { data: purchaseOrders } = await supabase
          .from('purchase_orders')
          .select('id, sessions_authorized, sessions_used')
          .eq('swimmer_id', swimmerId)
          .eq('status', 'approved')
          .order('end_date', { ascending: true })
          .limit(1);

        if (!purchaseOrders || purchaseOrders.length === 0) {
          // No active PO found - booking will proceed, notification will be created after booking
          // Continue without active PO
        } else {
          const activePo = purchaseOrders[0];
          // Check if swimmer has available sessions for assessment
          if (activePo.sessions_used >= activePo.sessions_authorized) {
            return NextResponse.json(
              { error: 'Funding source authorization exhausted - no sessions available for assessment' },
              { status: 400 }
            );
          }
        }
      }
    }

    // 7. Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        session_id: sessionId,
        swimmer_id: swimmerId,
        parent_id: user.id,
        status: 'confirmed',
        booking_type: 'assessment',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // 8. Create assessment record
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        swimmer_id: swimmerId,
        session_id: sessionId,
        booking_id: booking.id,
        scheduled_date: session.start_time,
        status: 'scheduled',
        approval_status: swimmer.funding_source_id ? 'pending' : 'approved',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (assessmentError) {
      console.error('Assessment creation error:', assessmentError)
      // Rollback booking
      await supabase.from('bookings').delete().eq('id', booking.id)
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      )
    }

    // 9. Update session booking count
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        booking_count: (session.booking_count || 0) + 1,
        is_full: (session.booking_count || 0) + 1 >= (session.max_capacity || 1),
        status: (session.booking_count || 0) + 1 >= (session.max_capacity || 1) ? 'booked' : session.status,
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Session update error:', updateError)
      // Don't rollback - booking is valid, just log the error
    }

    // 10. Update swimmer assessment status
    await supabase
      .from('swimmers')
      .update({
        assessment_status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', swimmerId)

    // 11. Create Assessment Purchase Order for funded clients
    let assessmentPO = null
    if (swimmer.funding_source_id) {
      assessmentPO = await createAssessmentPO(
        supabase,
        swimmer.id,
        swimmer.funding_source_id,
        user.id,
        swimmer.parent_id,
        assessment.id,
        swimmer.coordinator_email || null
      )
    }

    // 11a. Check if funding source requires authorization but no active PO was found
    if (swimmer.funding_source_id) {
      const { data: fundingSource } = await supabase
        .from('funding_sources')
        .select('requires_authorization')
        .eq('id', swimmer.funding_source_id)
        .single();

      if (fundingSource?.requires_authorization) {
        // Check if there's an active PO (we already checked earlier)
        const { data: purchaseOrders } = await supabase
          .from('purchase_orders')
          .select('id')
          .eq('swimmer_id', swimmerId)
          .eq('status', 'approved')
          .order('end_date', { ascending: true })
          .limit(1);

        if (!purchaseOrders || purchaseOrders.length === 0) {
          // No active PO found - create pending notification
          try {
            await supabase
              .from('pending_notifications')
              .insert({
                type: 'po_missing_at_booking',
                status: 'pending',
                payload: {
                  swimmer_id: swimmerId,
                  swimmer_name: `${swimmer.first_name} ${swimmer.last_name}`,
                  booking_id: booking.id,
                  lesson_date: session.start_time,
                  booking_type: 'assessment'
                }
              });
          } catch (notificationError) {
            console.error('Failed to create pending notification:', notificationError);
            // Don't fail the booking if notification fails
          }
        }
      }
    }

    // 12. Send booking confirmation email via edge function for non-funded clients
    try {
      // Check if swimmer is funded (VMRC/CVRC) - only send for private pay and SD clients
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

      // Only invoke edge function for non-funded clients (requires_authorization = false or null)
      if (!fundingSource?.requires_authorization) {
        await supabase.functions.invoke('send-booking-confirmation', {
          body: { bookingId: booking.id }
        })
      } else {
        console.log(`Skipping booking confirmation email for funded client (assessment booking ${booking.id})`)
      }
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError)
      // Don't fail the booking if email fails
    }

    // 13. Return success
    return NextResponse.json({
      success: true,
      booking: booking,
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
    // Calculate PO dates - assessment PO is typically shorter duration
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // Assessment PO valid for 1 month

    // Generate PO number
    const poNumber = `PO-ASSESS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // Create PO record
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
      // Don't fail the whole request if PO creation fails
      return null
    }

    // Update swimmer's PO info for assessment
    await supabase
      .from('swimmers')
      .update({
        current_po_number: poNumber,
        po_expires_at: endDate.toISOString(),
        funded_sessions_authorized: DEFAULT_FUNDING_SOURCE_CONFIG.ASSESSMENT_SESSIONS,
        funded_sessions_used: 0,
      })
      .eq('id', swimmerId)

    // Coordinator notification removed per requirements
    // Coordinators only receive emails for PO approvals, renewals, and referral requests
    // NOT for individual lesson bookings (including assessments)

    return po
  } catch (error) {
    console.error('Error in createAssessmentPO:', error)
    return null
  }
}

