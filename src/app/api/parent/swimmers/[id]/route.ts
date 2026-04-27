import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Fields that parents are allowed to update.
// Excludes funding (payment_type, funding_source_id, funding_coordinator_*),
// waiver/consent signatures, and staff-only operational fields
// (enrollment_status, approval_status, current_level_id, authorized_sessions_*).
const ALLOWED_PARENT_FIELDS = [
  // Demographics
  'first_name',
  'last_name',
  'date_of_birth',
  'gender',

  // Emergency contact
  'emergency_contact_name',
  'emergency_contact_phone',
  'emergency_contact_relationship',

  // Medical
  'has_allergies',
  'allergies_description',
  'has_medical_conditions',
  'medical_conditions_description',
  'diagnosis',
  'history_of_seizures',
  'seizures_description',
  'toilet_trained',
  'non_ambulatory',

  // Behavioral
  'self_injurious_behavior',
  'self_injurious_behavior_description',
  'aggressive_behavior',
  'aggressive_behavior_description',
  'elopement_history',
  'elopement_history_description',
  'has_behavior_plan',

  // Fundamental
  'communication_type',
  'strengths_interests',
  'motivators',
  'other_therapies',
  'therapies_description',

  // Swim background
  'previous_swim_lessons',
  'previous_swim_lessons_description',
  'comfortable_in_water',
  'swim_goals',

  // Scheduling
  'availability',
  'flexible_swimmer',
];

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const swimmerId = params.id;

    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Authorization: verify swimmer belongs to parent
    const { data: swimmerData, error: swimmerError } = await supabase
      .from('swimmers')
      .select('parent_id')
      .eq('id', swimmerId)
      .single();

    if (swimmerError || !swimmerData) {
      return NextResponse.json(
        { error: 'Swimmer not found' },
        { status: 404 }
      );
    }

    if (swimmerData.parent_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have permission to edit this swimmer' },
        { status: 403 }
      );
    }

    // Parse request body
    const updateData = await request.json();

    // Filter update data to only allowed fields
    const filteredUpdate: Record<string, any> = {};
    Object.keys(updateData).forEach(key => {
      if (ALLOWED_PARENT_FIELDS.includes(key) && updateData[key] !== undefined) {
        filteredUpdate[key] = updateData[key];
      }
    });

    // Add updated_at timestamp
    filteredUpdate.updated_at = new Date().toISOString();

    // Execute update
    const { data, error } = await supabase
      .from('swimmers')
      .update(filteredUpdate)
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

// GET method to fetch swimmer (parent access only)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const swimmerId = params.id;

    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Authorization: verify swimmer belongs to parent
    const { data: swimmerData, error: swimmerError } = await supabase
      .from('swimmers')
      .select('*')
      .eq('id', swimmerId)
      .eq('parent_id', user.id)
      .single();

    if (swimmerError || !swimmerData) {
      return NextResponse.json(
        { error: 'Swimmer not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      swimmer: swimmerData,
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