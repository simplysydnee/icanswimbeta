import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Types for assessment report
interface AssessmentReport {
  id: string;
  assessment_id: string;
  swimmer_id: string;
  instructor_id: string;
  assessment_date: string;
  strengths?: string;
  challenges?: string;
  swim_skills?: any; // JSONB field
  roadblocks?: any; // JSONB field
  swim_skills_goals?: string;
  safety_goals?: string;
  approval_status?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Types for swimmer update
interface SwimmerUpdateData {
  // Basic Information
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  height?: string;
  weight?: string;

  // Parent/Guardian Information
  parent_email?: string;
  parent_phone?: string;
  parent_first_name?: string;
  parent_last_name?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;

  // Medical Information
  diagnosis?: string[];
  has_allergies?: boolean;
  allergies_description?: string;
  has_medical_conditions?: boolean;
  medical_conditions_description?: string;
  history_of_seizures?: boolean;
  seizure_protocol?: string;
  medications?: string;
  non_ambulatory?: boolean;
  toilet_trained?: boolean;

  // Behavioral & Safety
  self_injurious_behavior?: boolean;
  self_injurious_description?: string;
  aggressive_behavior?: boolean;
  aggressive_behavior_description?: string;
  elopement_history?: boolean;
  elopement_description?: string;
  has_behavior_plan?: boolean;
  behavior_plan_description?: string;
  accommodations_needed?: string;

  // Swimming Background
  previous_swim_lessons?: boolean;
  comfortable_in_water?: string;
  swim_goals?: string[];
  strengths_interests?: string;

  // Enrollment & Funding
  enrollment_status?: string;
  payment_type?: string;
  funding_source_id?: string;
  coordinator_name?: string;
  coordinator_email?: string;
  coordinator_phone?: string;

  // Program Settings
  assessment_status?: string;
  current_level_id?: string;
  flexible_swimmer?: boolean;
  is_priority?: boolean;
  photo_release?: boolean;
  waiver_signed?: boolean;

  // Internal Notes
  admin_notes?: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const swimmerId = params.id;

    // ========== STEP 1: Authentication ==========
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ========== STEP 2: Authorization ==========
    // Check if user is admin using user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // ========== STEP 3: Parse Request Body ==========
    const updateData: SwimmerUpdateData = await request.json();

    // Validate required fields
    if (!updateData.first_name || !updateData.last_name || !updateData.date_of_birth) {
      return NextResponse.json(
        { error: 'First name, last name, and date of birth are required' },
        { status: 400 }
      );
    }

    // ========== STEP 4: Prepare Update Data ==========
    // Map the update data to match database column names
    const dbUpdateData: any = {
      // Basic Information
      first_name: updateData.first_name,
      last_name: updateData.last_name,
      date_of_birth: updateData.date_of_birth,
      gender: updateData.gender,
      height: updateData.height,
      weight: updateData.weight,

      // Parent/Guardian Information
      parent_email: updateData.parent_email,
      parent_phone: updateData.parent_phone,
      parent_first_name: updateData.parent_first_name,
      parent_last_name: updateData.parent_last_name,
      emergency_contact_name: updateData.emergency_contact_name,
      emergency_contact_phone: updateData.emergency_contact_phone,
      emergency_contact_relationship: updateData.emergency_contact_relationship,

      // Medical Information
      diagnosis: updateData.diagnosis,
      has_allergies: updateData.has_allergies,
      allergies_description: updateData.allergies_description,
      has_medical_conditions: updateData.has_medical_conditions,
      medical_conditions_description: updateData.medical_conditions_description,
      history_of_seizures: updateData.history_of_seizures,
      seizures_description: updateData.seizure_protocol, // Map to existing column
      medications: updateData.medications,
      non_ambulatory: updateData.non_ambulatory,
      toilet_trained: updateData.toilet_trained,

      // Behavioral & Safety
      self_injurious_behavior: updateData.self_injurious_behavior,
      self_injurious_behavior_description: updateData.self_injurious_description,
      aggressive_behavior: updateData.aggressive_behavior,
      aggressive_behavior_description: updateData.aggressive_behavior_description,
      elopement_history: updateData.elopement_history,
      elopement_history_description: updateData.elopement_description,
      has_behavior_plan: updateData.has_behavior_plan,
      behavior_plan_description: updateData.behavior_plan_description,
      accommodations_needed: updateData.accommodations_needed,

      // Swimming Background
      previous_swim_lessons: updateData.previous_swim_lessons,
      comfortable_in_water: updateData.comfortable_in_water,
      swim_goals: updateData.swim_goals,
      strengths_interests: updateData.strengths_interests,

      // Enrollment & Funding
      enrollment_status: updateData.enrollment_status,
      payment_type: updateData.payment_type,
      funding_source_id: updateData.funding_source_id,
      coordinator_name: updateData.coordinator_name,
      coordinator_email: updateData.coordinator_email,
      coordinator_phone: updateData.coordinator_phone,

      // Program Settings
      assessment_status: updateData.assessment_status,
      current_level_id: updateData.current_level_id,
      flexible_swimmer: updateData.flexible_swimmer,
      is_priority_booking: updateData.is_priority, // Map to existing column
      photo_release: updateData.photo_release,
      signed_waiver: updateData.waiver_signed, // Map to existing column

      // Internal Notes
      admin_notes: updateData.admin_notes,

      // Update timestamp
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(dbUpdateData).forEach(key => {
      if (dbUpdateData[key] === undefined) {
        delete dbUpdateData[key];
      }
    });

    // ========== STEP 5: Execute Update ==========
    const { data, error } = await supabase
      .from('swimmers')
      .update(dbUpdateData)
      .eq('id', swimmerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating swimmer:', error);
      return NextResponse.json(
        { error: `Failed to update swimmer: ${error.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 6: Return Success Response ==========
    console.log(`✅ Admin updated swimmer ${swimmerId}`);
    return NextResponse.json({
      success: true,
      swimmer: data,
      message: 'Swimmer updated successfully'
    });

  } catch (error) {
    console.error('Update swimmer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method to fetch individual swimmer
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const swimmerId = params.id;

    // ========== STEP 1: Authentication ==========
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ========== STEP 2: Authorization ==========
    // Check if user is admin using user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // ========== STEP 3: Fetch Swimmer ==========
    const { data: swimmerData, error: swimmerError } = await supabase
      .from('swimmers')
      .select('*')
      .eq('id', swimmerId)
      .single();

    if (swimmerError) {
      console.error('Error fetching swimmer:', swimmerError);
      return NextResponse.json(
        { error: `Failed to fetch swimmer: ${swimmerError.message}` },
        { status: 500 }
      );
    }

    // ========== STEP 4: Fetch Assessment Report ==========
    let assessmentReport = null;
    if (swimmerData.assessment_status === 'completed') {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessment_reports')
        .select('*')
        .eq('swimmer_id', swimmerId)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single();

      if (assessmentError && assessmentError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching assessment report:', assessmentError);
        // Don't fail the request if assessment fetch fails, just log it
      } else {
        assessmentReport = assessmentData;
      }
    }

    // ========== STEP 5: Return Response ==========
    return NextResponse.json({
      swimmer: swimmerData,
      assessment_report: assessmentReport,
      success: true
    });

  } catch (error) {
    console.error('Get swimmer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support PATCH method
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}