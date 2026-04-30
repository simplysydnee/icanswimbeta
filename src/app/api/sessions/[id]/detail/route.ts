import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: any
) {
  const params = await context.params
  const sessionId = params.id

  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query session with all related data
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        end_time,
        status,
        session_type,
        location,
        instructor_id,
        instructor:profiles!instructor_id(full_name, avatar_url),
        bookings(
          id,
          status,
          cancel_reason,
          cancel_source,
          canceled_at,
          canceled_by,
          notes,
          swimmer:swimmers(
            id,
            first_name,
            last_name,
            date_of_birth,
            diagnosis,
            has_medical_conditions,
            medical_conditions_description,
            has_allergies,
            allergies_description,
            history_of_seizures,
            non_ambulatory,
            photo_url,
            enrollment_status
          ),
          parent:profiles!parent_id(
            id,
            full_name,
            email,
            phone
          )
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Session detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
