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

    // 6. Create booking record
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

    // 7. Create assessment record
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

    // 8. Update session booking count
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

    // 9. Update swimmer assessment status
    await supabase
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
        supabase,
        swimmer.id,
        swimmer.funding_source_id,
        user.id,
        swimmer.parent_id,
        assessment.id,
        swimmer.coordinator_email || null
      )
    }

    // 11. Return success with all details for email
    return NextResponse.json({
      success: true,
      booking: booking,
      assessment: assessment,
      assessmentPO: assessmentPO,
      emailData: {
        parentEmail: swimmer.parent?.email || user.email,
        parentName: swimmer.parent?.full_name || 'Parent',
        childName: `${swimmer.first_name} ${swimmer.last_name}`,
        date: session.start_time,
        time: session.start_time,
        location: session.location || 'TBD',
        instructor: session.instructor?.full_name || 'TBD',
        hasFundingSource: !!swimmer.funding_source_id,
      },
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

    // Send coordinator notification if email is available
    await sendCoordinatorNotification(
      supabase,
      swimmerId,
      fundingSourceId,
      coordinatorEmail,
      poNumber
    )

    return po
  } catch (error) {
    console.error('Error in createAssessmentPO:', error)
    return null
  }
}

async function sendCoordinatorNotification(
  supabase: any,
  swimmerId: string,
  fundingSourceId: string,
  coordinatorEmail: string | null,
  poNumber: string
) {
  try {
    // Get swimmer details
    const { data: swimmer } = await supabase
      .from('swimmers')
      .select('first_name, last_name, funding_coordinator_name, funding_coordinator_email')
      .eq('id', swimmerId)
      .single()

    if (!swimmer) return

    // Get funding source details
    const { data: fundingSource } = await supabase
      .from('funding_sources')
      .select('name, contact_email, contact_name')
      .eq('id', fundingSourceId)
      .single()

    if (!fundingSource) return

    // Determine which email to use (prefer swimmer's coordinator email)
    const toEmail = coordinatorEmail || swimmer.coordinator_email || fundingSource.contact_email
    if (!toEmail) {
      console.log('No coordinator email available for notification')
      return
    }

    // Determine coordinator name
    const coordinatorName = swimmer.funding_coordinator_name || fundingSource.contact_name || 'Coordinator'

    // Send email notification
    // Note: We need to add a coordinator notification template to the email service
    // For now, we'll use the existing assessment_booking template with custom data
    await emailService.sendAssessmentBooking({
      parentEmail: toEmail,
      parentName: coordinatorName,
      childName: `${swimmer.first_name} ${swimmer.last_name}`,
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      location: 'Assessment Session',
      instructor: 'TBD',
    })

    console.log(`Coordinator notification sent to ${toEmail} for PO ${poNumber}`)
  } catch (error) {
    console.error('Error sending coordinator notification:', error)
    // Don't fail the whole request if notification fails
  }
}