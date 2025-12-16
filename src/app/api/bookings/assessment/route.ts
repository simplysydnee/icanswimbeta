import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // 10. Return success with all details for email
    return NextResponse.json({
      success: true,
      booking: booking,
      assessment: assessment,
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