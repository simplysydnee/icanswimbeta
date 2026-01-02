import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const instructorId = searchParams.get('instructor_id');

    // Build query for assessments (bookings for assessment sessions)
    // Start with a simpler query to debug
    let query = supabase
      .from('bookings')
      .select(`
        id,
        session_id,
        swimmer_id,
        parent_id,
        status,
        created_at,
        sessions (
          id,
          start_time,
          end_time,
          instructor_id,
          location,
          session_type,
          status
        ),
        swimmers (
          id,
          first_name,
          last_name,
          date_of_birth,
          comfortable_in_water,
          current_level_id,
          payment_type,
          funding_source_id,
          assessment_status,
          enrollment_status,
          has_allergies,
          allergies_description,
          has_medical_conditions,
          medical_conditions_description,
          diagnosis,
          previous_swim_lessons,
          swim_goals,
          funding_coordinator_name
        )
      `)
      .eq('sessions.session_type', 'assessment');

    // Filter by status if provided
    if (status) {
      if (status === 'scheduled') {
        query = query.eq('status', 'confirmed');
      } else if (status === 'completed') {
        query = query.eq('status', 'completed');
      } else if (status === 'cancelled') {
        query = query.eq('status', 'cancelled');
      }
    }

    // Filter by instructor if provided
    if (instructorId) {
      query = query.eq('sessions.instructor_id', instructorId);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching assessments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      );
    }

    // Transform the data
    const assessments = bookings
      .filter(booking => booking.sessions && booking.sessions.length > 0 && booking.swimmers && booking.swimmers.length > 0)
      .map(booking => {
        const swimmer = booking.swimmers[0];
        const session = booking.sessions[0];

        // Calculate age
        let age = 0;
        if (swimmer.date_of_birth) {
          const birthDate = new Date(swimmer.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        return {
          id: booking.id,
          session_id: session.id,
          swimmer_id: swimmer.id,
          swimmer_name: `${swimmer.first_name} ${swimmer.last_name}`,
          swimmer_age: age,
          parent_name: 'Unknown', // Simplified for now
          parent_email: '',
          start_time: session.start_time,
          end_time: session.end_time,
          instructor_id: session.instructor_id,
          instructor_name: 'Unknown', // Simplified for now
          location: session.location,
          status: booking.status as 'scheduled' | 'completed' | 'cancelled',
          assessment_status: swimmer.assessment_status,
          comfortable_in_water: swimmer.comfortable_in_water,
          current_level_id: swimmer.current_level_id,
          current_level_name: null,
          payment_type: swimmer.payment_type,
          is_funded_client: swimmer.payment_type === 'funded' || !!swimmer.funding_source_id,
          funding_source_name: null, // Simplified for now
          coordinator_name: swimmer.funding_coordinator_name,
          has_allergies: swimmer.has_allergies,
          allergies_description: swimmer.allergies_description,
          has_medical_conditions: swimmer.has_medical_conditions,
          medical_conditions_description: swimmer.medical_conditions_description,
          diagnosis: swimmer.diagnosis || [],
          previous_swim_lessons: swimmer.previous_swim_lessons,
          swim_goals: swimmer.swim_goals || [],
        };
      });

    return NextResponse.json(assessments);

  } catch (error) {
    console.error('Error in assessments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}