import { createClient } from '@supabase/supabase-js';

/**
 * Database helper functions for Playwright tests
 * Uses Supabase service role key for direct database access
 */

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'; // Default local dev key

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface TestBooking {
  id: string;
  session_id: string;
  swimmer_id: string;
  parent_id: string;
  status: string;
  created_at: string;
}

export interface TestAssessment {
  id: string;
  swimmer_id: string;
  session_id: string;
  scheduled_date: string;
  status: string;
  approval_status: string;
  created_at: string;
}

export interface TestSession {
  id: string;
  start_time: string;
  session_type: string;
  status: string;
  booking_count: number;
}

export const databaseHelpers = {
  /**
   * Get the most recent booking
   */
  async getLastBooking(): Promise<TestBooking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching last booking:', error);
      return null;
    }

    return data as TestBooking;
  },

  /**
   * Get the most recent assessment
   */
  async getLastAssessment(): Promise<TestAssessment | null> {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching last assessment:', error);
      return null;
    }

    return data as TestAssessment;
  },

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<TestSession | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data as TestSession;
  },

  /**
   * Get available assessment sessions
   */
  async getAvailableAssessmentSessions(): Promise<TestSession[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_type', 'initial_assessment')
      .eq('status', 'available')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching available assessment sessions:', error);
      return [];
    }

    return data as TestSession[];
  },

  /**
   * Get test swimmers (non-VMRC for testing)
   */
  async getTestSwimmers(): Promise<any[]> {
    const { data, error } = await supabase
      .from('swimmers')
      .select('*')
      .eq('payment_type', 'private_pay')
      .limit(5);

    if (error) {
      console.error('Error fetching test swimmers:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<void> {
    // Delete recent test bookings and assessments
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

    await supabase
      .from('assessments')
      .delete()
      .gte('created_at', cutoffTime.toISOString());

    await supabase
      .from('bookings')
      .delete()
      .gte('created_at', cutoffTime.toISOString());

    console.log('Test data cleanup completed');
  },

  /**
   * Create a test swimmer for testing
   */
  async createTestSwimmer(parentId: string): Promise<any> {
    const testSwimmer = {
      first_name: 'Test',
      last_name: 'Swimmer',
      date_of_birth: '2020-01-01',
      enrollment_status: 'approved',
      approval_status: 'approved',
      assessment_status: 'pending',
      is_vmrc_client: false,
      payment_type: 'private_pay',
      flexible_swimmer: false,
      parent_id: parentId,
      vmrc_sessions_used: 0,
      vmrc_sessions_authorized: 0,
    };

    const { data, error } = await supabase
      .from('swimmers')
      .insert([testSwimmer])
      .select()
      .single();

    if (error) {
      console.error('Error creating test swimmer:', error);
      return null;
    }

    return data;
  },

  /**
   * Delete test swimmer
   */
  async deleteTestSwimmer(swimmerId: string): Promise<void> {
    await supabase
      .from('swimmers')
      .delete()
      .eq('id', swimmerId);
  },
};