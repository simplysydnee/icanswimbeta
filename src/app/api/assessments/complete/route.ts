import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { DEFAULT_FUNDING_SOURCE_CONFIG } from '@/lib/constants';
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
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      swimmerId,
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
    } = body;

    // Validate required fields
    if (!swimmerId || !instructor || !assessmentDate || !strengths?.trim() || !challenges?.trim() || !approvalStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        funding_source_id,
        enrollment_status,
        assessment_status,
        funded_sessions_used,
        funded_sessions_authorized,
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
        { error: 'Swimmer not found' },
        { status: 404 }
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
    });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to submit assessment' },
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
      // Get existing notes (ensure it's an array)
      const existingNotes = swimmer.important_notes || [];
      const mergedNotes = [...existingNotes, ...importantNotesArray];
      swimmerUpdates.important_notes = mergedNotes;
    }

    if (approvalStatus === 'approved') {
      swimmerUpdates.enrollment_status = 'enrolled';
      swimmerUpdates.approval_status = 'approved';
      swimmerUpdates.approved_at = new Date().toISOString();
      swimmerUpdates.approved_by = user.id;

      // For funded clients, create lessons PO
      if (swimmer.payment_type === 'funded' || swimmer.funding_source_id) {
        await createLessonsPO(
          supabase,
          swimmerId,
          swimmer.funding_source_id,
          user.id,
          swimmer.parent_id
        );
      }
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

    // Send email notification to parent
    const parent = swimmer.parent?.[0];
    if (parent?.email) {
      try {
        const emailData: AssessmentEmailData = {
          clientName: `${swimmer.first_name} ${swimmer.last_name}`,
          parentName: parent.full_name || 'Parent',
          parentEmail: parent.email,
          isPrivatePay: swimmer.payment_type === 'private_pay' || !swimmer.funding_source_id,
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createLessonsPO(
  supabase: any,
  swimmerId: string,
  fundingSourceId: string | null,
  createdBy: string,
  parentId: string
) {
  try {
    // Calculate PO dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + DEFAULT_FUNDING_SOURCE_CONFIG.PO_DURATION_MONTHS);

    // Generate PO number
    const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create PO record
    const { error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        swimmer_id: swimmerId,
        funding_source_id: fundingSourceId,
        parent_id: parentId,
        created_by: createdBy,
        po_type: 'lessons',
        po_number: poNumber,
        authorized_sessions: DEFAULT_FUNDING_SOURCE_CONFIG.LESSONS_PER_PO,
        used_sessions: 0,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'pending',
        notes: 'Automatically created after assessment approval',
      });

    if (poError) {
      console.error('Error creating PO:', poError);
      return;
    }

    // Update swimmer's PO info
    const { error: swimmerError } = await supabase
      .from('swimmers')
      .update({
        current_po_number: poNumber,
        po_expires_at: endDate.toISOString(),
        funded_sessions_authorized: DEFAULT_FUNDING_SOURCE_CONFIG.LESSONS_PER_PO,
        funded_sessions_used: 0,
      })
      .eq('id', swimmerId);

    if (swimmerError) {
      console.error('Error updating swimmer PO info:', swimmerError);
    }

  } catch (error) {
    console.error('Error in createLessonsPO:', error);
  }
}