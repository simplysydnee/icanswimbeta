import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch swimmer data with related information
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .select(`
        *,
        parent:profiles(id, full_name, email, phone),
        current_level:swim_levels(*),
        bookings(
          id,
          session:sessions(
            id,
            start_time,
            end_time,
            location,
            instructor:instructor_id(full_name)
          ),
          status,
          created_at
        ),
        progress_notes(
          id,
          lesson_summary,
          skills_working_on,
          skills_mastered,
          created_at,
          instructor:instructor_id(full_name)
        )
      `)
      .eq('id', id)
      .single()

    if (swimmerError) {
      console.error('Error fetching swimmer:', swimmerError)
      return NextResponse.json(
        { error: 'Failed to fetch swimmer data' },
        { status: 500 }
      )
    }

    if (!swimmer) {
      return NextResponse.json(
        { error: 'Swimmer not found' },
        { status: 404 }
      )
    }

    // For now, return a simple JSON response
    // In a real implementation, you would generate a PDF here
    // using a library like @react-pdf/renderer or puppeteer

    const reportData = {
      swimmer: {
        id: swimmer.id,
        name: `${swimmer.first_name} ${swimmer.last_name}`,
        dateOfBirth: swimmer.date_of_birth,
        age: swimmer.date_of_birth
          ? Math.floor((new Date().getTime() - new Date(swimmer.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null,
        gender: swimmer.gender,
        enrollmentStatus: swimmer.enrollment_status,
        assessmentStatus: swimmer.assessment_status,
        currentLevel: swimmer.current_level?.display_name || swimmer.current_level?.name,
        paymentType: swimmer.payment_type,
        isVmrcClient: swimmer.payment_type === 'funded',
        coordinator: swimmer.payment_type === 'funded' ? {
          name: swimmer.funding_coordinator_name,
          email: swimmer.funding_coordinator_email,
          phone: swimmer.funding_coordinator_phone
        } : null,
        sessionsUsed: swimmer.authorized_sessions_used || 0,
        sessionsAuthorized: swimmer.authorized_sessions_total || 0,
        medicalInfo: {
          hasAllergies: swimmer.has_allergies,
          allergiesDescription: swimmer.allergies_description,
          hasMedicalConditions: swimmer.has_medical_conditions,
          medicalConditionsDescription: swimmer.medical_conditions_description,
          historyOfSeizures: swimmer.history_of_seizures,
          diagnosis: swimmer.diagnosis || []
        },
        safetyInfo: {
          toiletTrained: swimmer.toilet_trained,
          nonAmbulatory: swimmer.non_ambulatory,
          selfInjuriousBehavior: swimmer.self_injurious_behavior,
          aggressiveBehavior: swimmer.aggressive_behavior,
          elopementHistory: swimmer.elopement_history
        },
        swimmingBackground: {
          previousSwimLessons: swimmer.previous_swim_lessons,
          comfortableInWater: swimmer.comfortable_in_water,
          swimGoals: swimmer.swim_goals || [],
          flexibleSwimmer: swimmer.flexible_swimmer
        },
        legal: {
          signedWaiver: swimmer.signed_waiver,
          photoRelease: swimmer.photo_release
        }
      },
      parent: swimmer.parent ? {
        name: swimmer.parent.full_name,
        email: swimmer.parent.email,
        phone: swimmer.parent.phone
      } : null,
      bookings: (swimmer.bookings || []).map((booking: any) => ({
        date: booking.session?.start_time ? format(new Date(booking.session.start_time), 'MMM d, yyyy') : null,
        time: booking.session?.start_time ? format(new Date(booking.session.start_time), 'h:mm a') : null,
        location: booking.session?.location,
        instructor: booking.session?.instructor?.full_name,
        status: booking.status
      })),
      progressNotes: (swimmer.progress_notes || []).map((note: any) => ({
        date: note.created_at ? format(new Date(note.created_at), 'MMM d, yyyy') : null,
        instructor: note.instructor?.full_name,
        summary: note.lesson_summary,
        skillsWorkingOn: note.skills_working_on || [],
        skillsMastered: note.skills_mastered || []
      })),
      generatedAt: new Date().toISOString(),
      reportType: 'swimmer_summary'
    }

    // Return as JSON for now - in production, generate PDF
    return NextResponse.json(reportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${swimmer.first_name}-${swimmer.last_name}-report.json"`
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}