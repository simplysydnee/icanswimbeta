import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { emailService } from '@/lib/email-service';
import { generateAssessmentCompletionEmail, type AssessmentEmailData } from '@/lib/emails/assessment-completion';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission (admin or instructor)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !userRole || !['admin', 'instructor'].includes(userRole.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      swimmerId,
      bookingId,
      sessionId,
      instructor,
      assessmentDate,
      strengths,
      challenges,
      swimSkills,
      roadblocks,
      swimSkillsGoals,
      safetyGoals,
      approvalStatus,
      importantNotesText,
      // Step 5 (Notes) — all optional
      lessonDate,
      attendanceStatus,
      lessonSummary,
      swimmerMood,
      waterComfort,
      instructorNotesPrivate,
      parentNotes,
      sharedWithParent,
      // Approval-step swim level + priority booking (from main)
      swimLevelId,
      isPriorityBooking,
    } = body;

    // Validate required fields
    if (!swimmerId || !instructor || !assessmentDate || !strengths?.trim() || !challenges?.trim() || !approvalStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Swim level is required when approving
    if (approvalStatus === 'approved' && !swimLevelId) {
      return NextResponse.json(
        { error: 'Swim level is required when approving a swimmer' },
        { status: 400 }
      );
    }

    // Get swimmer details with parent info
    const { data: swimmer, error: swimmerError } = await supabase
      .from('swimmers')
      .select(`
        id,
        first_name,
        last_name,
        parent_id,
        payment_type,
        enrollment_status,
        assessment_status,
        important_notes,
        parent:profiles!swimmers_parent_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .eq('id', swimmerId)
      .single();

    if (swimmerError || !swimmer) {
      return NextResponse.json(
        {
          error: 'Swimmer not found',
          details: swimmerError?.message,
          code: swimmerError?.code,
          hint: swimmerError?.hint,
        },
        { status: 404 }
      );
    }

    // Defense-in-depth: only complete assessments for swimmers actually scheduled
    if (swimmer.assessment_status !== 'scheduled') {
      return NextResponse.json(
        {
          error: 'Swimmer does not have a scheduled assessment',
          details: `Current assessment_status is '${swimmer.assessment_status}'.`,
        },
        { status: 409 }
      );
    }

    // Start transaction
    const { error: transactionError } = await supabase.rpc('submit_assessment_transaction', {
      p_swimmer_id: swimmerId,
      p_instructor_id: user.id,
      p_assessment_date: new Date(assessmentDate).toISOString(),
      p_strengths: strengths,
      p_challenges: challenges,
      p_swim_skills: swimSkills || {},
      p_roadblocks: roadblocks || {},
      p_swim_skills_goals: swimSkillsGoals || '',
      p_safety_goals: safetyGoals || '',
      p_approval_status: approvalStatus,
      p_created_by: user.id,
      p_booking_id: bookingId || null,
    });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        {
          error: 'Failed to submit assessment',
          details: transactionError.message,
          code: transactionError.code,
          hint: transactionError.hint,
        },
        { status: 500 }
      );
    }

    // Process important safety notes
    let importantNotesArray: string[] = [];
    if (importantNotesText && importantNotesText.trim()) {
      // Parse notes (split by newlines, clean bullets)
      importantNotesArray = importantNotesText
        .split('\n')
        .map((note: string) => note.trim().replace(/^[•\-*]\s*/, ''))
        .filter((note: string) => note.length > 0);
    }

    // Update swimmer status based on approval
    const swimmerUpdates: any = {
      assessment_status: 'completed',
      updated_at: new Date().toISOString(),
    };

    // Add important notes if provided
    if (importantNotesArray.length > 0) {
      const existingNotes = swimmer.important_notes || [];
      const mergedNotes = [...existingNotes, ...importantNotesArray];
      swimmerUpdates.important_notes = mergedNotes;
    }

    if (approvalStatus === 'approved') {
      swimmerUpdates.enrollment_status = 'enrolled';
      swimmerUpdates.approval_status = 'approved';
      swimmerUpdates.approved_at = new Date().toISOString();
      swimmerUpdates.approved_by = user.id;

      // Set swim level (from main)
      if (swimLevelId) {
        swimmerUpdates.current_level_id = swimLevelId;
      }

      // Set priority booking (from main)
      if (isPriorityBooking) {
        swimmerUpdates.is_priority_booking = true;
        swimmerUpdates.priority_booking_reason = 'manual';
        swimmerUpdates.priority_booking_set_at = new Date().toISOString();
        swimmerUpdates.priority_booking_set_by = user.id;
      }

      // NOTE: PO creation intentionally NOT brought back from main per the
      // 2026-05-19 product direction. Lessons PO is now handled out of this
      // route. If/when PO auto-creation is reinstated, restore the
      // createLessonsPO helper too.
    } else if (approvalStatus === 'dropped') {
      swimmerUpdates.enrollment_status = 'waitlist';
      swimmerUpdates.approval_status = 'declined';
    }

    const { error: swimmerUpdateError } = await supabase
      .from('swimmers')
      .update(swimmerUpdates)
      .eq('id', swimmerId);

    if (swimmerUpdateError) {
      console.error('Error updating swimmer:', swimmerUpdateError);
      // Don't fail the whole request
    }

    // Insert a progress note if Step 5 captured anything
    const hasNoteContent =
      (lessonSummary && lessonSummary.trim().length > 0) ||
      (instructorNotesPrivate && instructorNotesPrivate.trim().length > 0) ||
      (parentNotes && parentNotes.trim().length > 0) ||
      !!swimmerMood ||
      !!waterComfort ||
      (attendanceStatus && attendanceStatus !== 'present');

    if (hasNoteContent) {
      try {
        const nowIso = new Date().toISOString();
        // Upsert on (swimmer_id, booking_id) so a draft progress_notes row
        // created during Step 5 wizard saves gets updated instead of
        // duplicated. The partial unique index added by migration
        // 20260519000003 makes this safe.
        const noteRow: Record<string, any> = {
          swimmer_id: swimmerId,
          instructor_id: user.id,
          updated_by: user.id,
          session_id: sessionId || null,
          booking_id: bookingId || null,
          lesson_date: lessonDate || new Date().toISOString().split('T')[0],
          lesson_summary: lessonSummary?.trim() ? lessonSummary : null,
          attendance_status: attendanceStatus || 'present',
          swimmer_mood: swimmerMood || null,
          water_comfort: waterComfort || null,
          instructor_notes: instructorNotesPrivate?.trim()
            ? instructorNotesPrivate
            : null,
          parent_notes: parentNotes?.trim() ? parentNotes : null,
          shared_with_parent: !!sharedWithParent,
          updated_at: nowIso,
        };

        // Supabase upsert needs onConflict to match the partial unique index.
        const noteOp = bookingId
          ? supabase
              .from('progress_notes')
              .upsert(
                { ...noteRow, created_at: nowIso },
                { onConflict: 'swimmer_id,booking_id' }
              )
          : supabase
              .from('progress_notes')
              .insert({ ...noteRow, created_at: nowIso });

        const { error: noteError } = await noteOp;

        if (noteError) {
          console.error('Error inserting progress note:', noteError);
        }
      } catch (noteException) {
        console.error('Exception inserting progress note:', noteException);
      }
    }

    // Mark the assessment booking completed (best-effort)
    if (bookingId) {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (bookingError) {
        console.error('Error marking booking completed:', bookingError);
      }
    }

    // Send email notification to parent
    const parent = Array.isArray((swimmer as any).parent)
      ? (swimmer as any).parent?.[0]
      : (swimmer as any).parent;
    if (parent?.email) {
      try {
        const emailData: AssessmentEmailData = {
          clientName: `${swimmer.first_name} ${swimmer.last_name}`,
          parentName: parent.full_name || 'Parent',
          parentEmail: parent.email,
          isPrivatePay: swimmer.payment_type === 'private_pay',
          status: approvalStatus as 'approved' | 'dropped',
          assessmentData: {
            strengths,
            challenges,
            swimSkills: swimSkills || {},
            goals: swimSkillsGoals || safetyGoals || '',
            instructorName: profile?.full_name,
            assessmentDate,
          },
        };

        const emailContent = generateAssessmentCompletionEmail(emailData);

        await emailService.sendAssessmentCompletion({
          parentEmail: parent.email,
          parentName: parent.full_name || 'Parent',
          childName: `${swimmer.first_name} ${swimmer.last_name}`,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        console.log(`Assessment completion email sent to ${parent.email}`);
      } catch (emailError) {
        console.error('Failed to send assessment completion email:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment submitted successfully',
      approvalStatus,
      swimmerName: `${swimmer.first_name} ${swimmer.last_name}`,
    });

  } catch (error) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
