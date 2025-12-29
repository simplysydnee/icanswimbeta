import { createClient } from '@/lib/supabase/client';
import {
  GenerateSessionsRequest,
  GenerateSessionsResponse,
  GenerateSessionsRequestSchema
} from '@/types/session-generator';
import type { Swimmer } from '@/types/booking';

export interface AssessmentSession {
  id: string;
  instructor_id: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  location: string;
  session_type: 'lesson' | 'assessment';
  status: string;
  max_capacity: number;
  booking_count: number;
  is_full: boolean;
  price_cents: number;
  created_at: string;
}

export interface AssessmentBooking {
  session_id: string;
  swimmer_id: string;
  parent_id: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  cancel_reason?: string;
  canceled_at?: string;
}

export interface Assessment {
  id: string;
  booking_id: string;
  swimmer_id: string;
  status: string;
  notes?: string;
  completed_at?: string;
  created_at: string;
}

// VMRC Referral Types
export interface ParentReferralRequest {
  id: string;
  parent_name: string;
  parent_email: string;
  child_name: string;
  child_date_of_birth?: string;
  coordinator_name: string;
  coordinator_email: string;
  referral_token: string;
  status: string;
  vmrc_referral_id?: string;
  created_at: string;
  email_sent_at?: string;
  completed_at?: string;
}

export interface VmrcReferralRequest {
  id: string;
  parent_request_id?: string;

  // Section 1: Client Information
  child_name: string;
  child_date_of_birth: string;
  diagnosis: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;

  // Section 2: Client Medical and Physical Profile
  non_ambulatory: string;
  has_seizure_disorder: string;
  height?: string;
  weight?: string;
  toilet_trained: string;
  has_medical_conditions: string;
  medical_conditions_description?: string;
  has_allergies: string;
  allergies_description?: string;
  has_other_therapies: string;
  other_therapies_description?: string;

  // Section 3: Behavioral & Safety Information
  comfortable_in_water: string;
  self_injurious_behavior: string;
  self_injurious_description?: string;
  aggressive_behavior: string;
  aggressive_behavior_description?: string;
  elopement_behavior: string;
  elopement_description?: string;
  has_safety_plan: string;
  safety_plan_description?: string;

  // Section 4: Referral Information
  referral_type: string;
  coordinator_name?: string;
  coordinator_email?: string;

  // Section 5: Consent & Optional Info
  photo_release: string;
  liability_agreement: boolean;
  swimmer_photo_url?: string;
  additional_info?: string;

  // Status Tracking
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  decline_reason?: string;
  swimmer_id?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export class ApiClient {
  private supabase = createClient();

  // Assessment methods
  async getAvailableAssessmentSessions(): Promise<AssessmentSession[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('session_type', 'assessment')
      .eq('status', 'available')
      .lt('booking_count', this.supabase.from('sessions').select('max_capacity'))
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching assessment sessions:', error);
      throw error;
    }

    return data || [];
  }

  async bookAssessmentSession(bookingData: {
    session_id: string;
    swimmer_id: string;
    parent_id: string;
  }): Promise<{ booking: AssessmentBooking; assessment: Assessment }> {
    // Start a transaction-like process
    const { data: booking, error: bookingError } = await this.supabase
      .from('bookings')
      .insert({
        session_id: bookingData.session_id,
        swimmer_id: bookingData.swimmer_id,
        parent_id: bookingData.parent_id,
        status: 'confirmed'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw bookingError;
    }

    // Increment booking count
    const { error: incrementError } = await this.supabase.rpc('increment_booking_count', {
      session_id: bookingData.session_id
    });

    if (incrementError) {
      console.error('Error incrementing booking count:', incrementError);
      throw incrementError;
    }

    // Create assessment record
    const { data: assessment, error: assessmentError } = await this.supabase
      .from('assessments')
      .insert({
        booking_id: booking.id,
        swimmer_id: bookingData.swimmer_id,
        status: 'scheduled'
      })
      .select()
      .single();

    if (assessmentError) {
      console.error('Error creating assessment:', assessmentError);
      throw assessmentError;
    }

    return { booking, assessment };
  }

  async getSwimmerAssessments(swimmerId: string) {
    const { data, error } = await this.supabase
      .from('assessments')
      .select(`
        *,
        bookings (
          *,
          sessions (*)
        )
      `)
      .eq('swimmer_id', swimmerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching swimmer assessments:', error);
      throw error;
    }

    return data || [];
  }

  async updateAssessmentStatus(assessmentId: string, status: string, notes?: string) {
    const { data, error } = await this.supabase
      .from('assessments')
      .update({
        status,
        notes,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', assessmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating assessment:', error);
      throw error;
    }

    return data;
  }

  // Swimmer methods
  async getSwimmersByParent(parentId: string) {
    const { data, error } = await this.supabase
      .from('swimmers')
      .select('*')
      .eq('parent_id', parentId)
      .order('first_name');

    if (error) {
      console.error('Error fetching swimmers:', error);
      throw error;
    }

    return data || [];
  }

  async createSwimmer(swimmerData: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from('swimmers')
      .insert(swimmerData)
      .select()
      .single();

    if (error) {
      // Safe serialization to prevent "Maximum call stack size exceeded" error
      let serializedSwimmerData = '[Unable to serialize]';
      try {
        // Use a custom replacer to handle circular references and non-serializable values
        serializedSwimmerData = JSON.stringify(swimmerData, (key, value) => {
          // Handle Date objects
          if (value instanceof Date) {
            return value.toISOString();
          }
          // Handle other non-serializable values
          if (typeof value === 'function' || typeof value === 'symbol') {
            return `[${typeof value}]`;
          }
          // Handle undefined
          if (value === undefined) {
            return null;
          }
          return value;
        }, 2);
      } catch (serializationError) {
        console.warn('Failed to serialize swimmerData for logging:', serializationError);
        // Create a minimal safe representation
        serializedSwimmerData = `{ keys: ${Object.keys(swimmerData).join(', ')} }`;
      }

      console.error('Error creating swimmer:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        swimmerData: serializedSwimmerData
      });
      throw error;
    }

    return data;
  }

  async updateProfile(userId: string, profileData: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      // Safe serialization to prevent "Maximum call stack size exceeded" error
      let serializedProfileData = '[Unable to serialize]';
      try {
        // Use a custom replacer to handle circular references and non-serializable values
        serializedProfileData = JSON.stringify(profileData, (key, value) => {
          // Handle Date objects
          if (value instanceof Date) {
            return value.toISOString();
          }
          // Handle other non-serializable values
          if (typeof value === 'function' || typeof value === 'symbol') {
            return `[${typeof value}]`;
          }
          // Handle undefined
          if (value === undefined) {
            return null;
          }
          return value;
        }, 2);
      } catch (serializationError) {
        console.warn('Failed to serialize profileData for logging:', serializationError);
        // Create a minimal safe representation
        serializedProfileData = `{ keys: ${Object.keys(profileData).join(', ')} }`;
      }

      console.error('Error updating profile:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        userId,
        profileData: serializedProfileData
      });
      throw error;
    }

    return data;
  }

  // Session methods
  async getSessionById(sessionId: string) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      throw error;
    }

    return data;
  }

  // ============================================
  // SESSION GENERATOR METHODS
  // ============================================

  /**
   * Generate sessions based on mode (single, repeating, or assessment)
   * Validates data with Zod before sending to server
   * @throws Error if validation fails or API returns error
   */
  async generateSessions(data: GenerateSessionsRequest): Promise<GenerateSessionsResponse> {
    // Client-side validation before sending (fails fast)
    const validated = GenerateSessionsRequestSchema.parse(data);

    const response = await fetch('/api/admin/sessions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to generate sessions');
    }

    return result;
  }

  /**
   * Open all draft sessions in a batch (make available for booking)
   */
  async openSessionBatch(batchId: string): Promise<{ updated: number }> {
    const response = await fetch(`/api/admin/sessions/batch/${batchId}/open`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to open sessions');
    }

    return result;
  }

  /**
   * Delete all sessions in a batch (only works if all are drafts)
   */
  async deleteSessionBatch(batchId: string): Promise<{ deleted: number }> {
    const response = await fetch(`/api/admin/sessions/batch/${batchId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete batch');
    }

    return result;
  }

  // VMRC Referral Methods
  async createParentReferralRequest(data: {
    parent_name: string;
    parent_email: string;
    parent_phone?: string;
    child_name: string;
    child_date_of_birth?: string;
    coordinator_name: string;
    coordinator_email: string;
    coordinator_id?: string;
    // Note: parent_phone might be passed from form but not stored in table
  }): Promise<ParentReferralRequest> {
    // Filter out any extra fields not in the table (like parent_phone)
    const { parent_phone, coordinator_id, ...insertData } = data;

    // Look up coordinator by email if coordinator_id not provided
    let finalCoordinatorId = coordinator_id;
    if (!finalCoordinatorId && data.coordinator_email) {
      try {
        const { data: coordinator } = await this.supabase
          .from('profiles')
          .select('id')
          .eq('email', data.coordinator_email.toLowerCase())
          .eq('role', 'coordinator')
          .single();

        if (coordinator) {
          finalCoordinatorId = coordinator.id;
        }
      } catch (error) {
        console.warn('Could not find coordinator by email:', data.coordinator_email, error);
        // Continue without coordinator_id
      }
    }

    // Prepare insert data
    const insertPayload = {
      ...insertData,
      coordinator_id: finalCoordinatorId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Format date if provided (convert to YYYY-MM-DD format for PostgreSQL DATE type)
    if (data.child_date_of_birth) {
      try {
        // Try to parse and format the date
        const date = new Date(data.child_date_of_birth);
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM-DD for PostgreSQL DATE type
          const formattedDate = date.toISOString().split('T')[0];
          insertPayload.child_date_of_birth = formattedDate;
        } else {
          // If parsing fails, try to use as-is (might already be in correct format)
          insertPayload.child_date_of_birth = data.child_date_of_birth;
        }
      } catch (e) {
        console.warn('Failed to parse date:', data.child_date_of_birth, e);
        insertPayload.child_date_of_birth = data.child_date_of_birth;
      }
    }

    const { data: referral, error } = await this.supabase
      .from('parent_referral_requests')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Error creating parent referral request:', error);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      throw error;
    }

    return referral;
  }

  async createVmrcReferralRequest(data: {
    parent_request_id?: string;
    // Section 1
    child_name: string;
    child_date_of_birth: string;
    diagnosis: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    // Section 2
    non_ambulatory: string;
    has_seizure_disorder: string;
    height?: string;
    weight?: string;
    toilet_trained: string;
    has_medical_conditions: string;
    medical_conditions_description?: string;
    has_allergies: string;
    allergies_description?: string;
    has_other_therapies: string;
    other_therapies_description?: string;
    // Section 3
    comfortable_in_water: string;
    self_injurious_behavior: string;
    self_injurious_description?: string;
    aggressive_behavior: string;
    aggressive_behavior_description?: string;
    elopement_behavior: string;
    elopement_description?: string;
    has_safety_plan: string;
    safety_plan_description?: string;
    // Section 4
    referral_type: string;
    coordinator_name?: string;
    coordinator_email?: string;
    coordinator_id?: string;
    // Section 5
    photo_release: string;
    liability_agreement: boolean;
    swimmer_photo_url?: string;
    additional_info?: string;
  }): Promise<VmrcReferralRequest> {
    const { data: referral, error } = await this.supabase
      .from('referral_requests')
      .insert({
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating VMRC referral request:', error);
      throw error;
    }

    return referral;
  }

  async getVmrcReferrals(status?: string): Promise<VmrcReferralRequest[]> {
    let query = this.supabase
      .from('referral_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching VMRC referrals:', error);
      throw error;
    }

    return data || [];
  }

  async getVmrcReferralById(id: string): Promise<VmrcReferralRequest> {
    const { data, error } = await this.supabase
      .from('referral_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching VMRC referral:', error);
      throw error;
    }

    return data;
  }

  async approveVmrcReferral(
    referralId: string,
    adminId: string,
    notes?: string
  ): Promise<{ referral: VmrcReferralRequest; swimmer: Swimmer }> {
    const referral = await this.getVmrcReferralById(referralId);

    // Parse name
    const nameParts = referral.child_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create swimmer
    const { data: swimmer, error: swimmerError } = await this.supabase
      .from('swimmers')
      .insert({
        first_name: firstName,
        last_name: lastName,
        date_of_birth: referral.child_date_of_birth,
        height: referral.height,
        weight: referral.weight,
        diagnosis: referral.diagnosis ? [referral.diagnosis] : [],
        photo_url: referral.swimmer_photo_url,
        // Medical
        non_ambulatory: referral.non_ambulatory === 'yes',
        history_of_seizures: referral.has_seizure_disorder === 'yes',
        toilet_trained: referral.toilet_trained,
        has_medical_conditions: referral.has_medical_conditions === 'yes',
        medical_conditions_description: referral.medical_conditions_description,
        has_allergies: referral.has_allergies === 'yes',
        allergies_description: referral.allergies_description,
        other_therapies: referral.has_other_therapies === 'yes',
        therapies_description: referral.other_therapies_description,
        // Behavioral
        comfortable_in_water: referral.comfortable_in_water === 'yes' ? 'somewhat' : 'not_at_all',
        self_injurious_behavior: referral.self_injurious_behavior === 'yes',
        self_injurious_behavior_description: referral.self_injurious_description,
        aggressive_behavior: referral.aggressive_behavior === 'yes',
        aggressive_behavior_description: referral.aggressive_behavior_description,
        elopement_history: referral.elopement_behavior === 'yes',
        elopement_history_description: referral.elopement_description,
        has_behavior_plan: referral.has_safety_plan === 'yes',
        // VMRC
        payment_type: referral.referral_type === 'vmrc_client' ? 'vmrc' : 'private_pay',
        funding_source_id: referral.referral_type === 'vmrc_client',
        funding_coordinator_name: referral.coordinator_name,
        funding_coordinator_email: referral.coordinator_email,
        // Consent
        photo_video_permission: referral.photo_release === 'yes',
        signed_waiver: referral.liability_agreement,
        // Status
        enrollment_status: 'waitlist',
        approval_status: 'approved',
        assessment_status: 'not_scheduled',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (swimmerError) {
      console.error('Error creating swimmer:', swimmerError);
      throw swimmerError;
    }

    // Update referral
    const { data: updatedReferral, error: updateError } = await this.supabase
      .from('referral_requests')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes,
        swimmer_id: swimmer.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', referralId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating referral:', updateError);
      throw updateError;
    }

    return { referral: updatedReferral, swimmer };
  }

  async declineVmrcReferral(
    referralId: string,
    adminId: string,
    reason: string
  ): Promise<VmrcReferralRequest> {
    const { data, error } = await this.supabase
      .from('referral_requests')
      .update({
        status: 'declined',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        decline_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', referralId)
      .select()
      .single();

    if (error) {
      console.error('Error declining referral:', error);
      throw error;
    }

    return data;
  }
}

// ============================================
// SESSION GENERATOR API (standalone)
// ============================================

export const sessionGeneratorApi = {
  /**
   * Generate sessions based on mode (single, repeating, or assessment)
   * Validates data with Zod before sending to server
   * @throws Error if validation fails or API returns error
   */
  async generate(data: GenerateSessionsRequest): Promise<GenerateSessionsResponse> {
    // Client-side validation before sending (fails fast)
    const validated = GenerateSessionsRequestSchema.parse(data);

    const response = await fetch('/api/admin/sessions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to generate sessions');
    }

    return result;
  },

  /**
   * Open all draft sessions in a batch (make available for booking)
   */
  async openBatch(batchId: string): Promise<{ updated: number }> {
    const response = await fetch(`/api/admin/sessions/batch/${batchId}/open`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to open sessions');
    }

    return result;
  },

  /**
   * Delete all sessions in a batch (only works if all are drafts)
   */
  async deleteBatch(batchId: string): Promise<{ deleted: number }> {
    const response = await fetch(`/api/admin/sessions/batch/${batchId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete batch');
    }

    return result;
  },
};

export const apiClient = new ApiClient();

// ============================================
// COMBINED API OBJECT
// ============================================

export const api = {
  sessionGenerator: sessionGeneratorApi,
  // Add other API modules here as needed
};