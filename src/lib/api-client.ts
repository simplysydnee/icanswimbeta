import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Centralized API Client for Supabase operations
 * Provides consistent error handling, retry logic, and TypeScript types
 */

// Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  enrollment_status: string;
  approval_status: string;
  assessment_status: string;
  is_vmrc_client: boolean;
  payment_type: string;
  current_level_id: string | null;
  flexible_swimmer: boolean;
  parent_id: string;
  vmrc_sessions_used: number;
  vmrc_sessions_authorized: number;
  vmrc_current_pos_number: string | null;
  photo_url: string | null;
  created_at: string;
  swim_levels?: {
    display_name: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface Session {
  id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  session_type: string;
  session_type_detail: string | null;
  booking_count: number;
  max_capacity: number;
  instructor_id: string | null;
  price_cents: number;
  profiles?: {
    full_name: string;
  };
  bookings?: Array<{
    id: string;
    status: string;
    swimmer_id: string;
    created_at: string;
    canceled_at: string | null;
    cancel_reason: string | null;
    cancel_source: string | null;
    swimmers?: {
      first_name: string;
      last_name: string;
    };
    profiles?: {
      full_name: string;
    };
  }>;
}

export interface Booking {
  id: string;
  session_id: string;
  swimmer_id: string;
  parent_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  canceled_at: string | null;
  cancel_reason: string | null;
  cancel_source: string | null;
}

export interface Assessment {
  id: string;
  swimmer_id: string;
  session_id: string | null;
  scheduled_date: string;
  status: string;
  approval_status: string;
  instructor_notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssessmentData {
  swimmer_id: string;
  session_id: string;
  scheduled_date: string;
  status?: string;
  approval_status?: string;
}

export interface AdminKPIs {
  totalSwimmers: number;
  activeSwimmers: number;
  pendingApprovals: number;
  totalSessions: number;
  upcomingSessions: number;
}

// Configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

/**
 * Sleep helper for retry logic
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if error is retryable (network errors, timeouts, etc.)
 */
const isRetryableError = (error: PostgrestError): boolean => {
  // Retry on network errors, timeouts, and 5xx server errors
  const retryableCodes = ['PGRST301', 'PGRST302', '08000', '08003', '08006'];
  return retryableCodes.some(code => error.code?.includes(code));
};

/**
 * Format error message for user display
 */
const formatErrorMessage = (error: PostgrestError | Error, operation: string): string => {
  console.error(`API Error during ${operation}:`, error);
  
  if ('code' in error && error.code) {
    // Supabase-specific errors
    switch (error.code) {
      case '23505':
        return 'This record already exists';
      case '23503':
        return 'Referenced data not found';
      case '42P01':
        return 'Database table not found';
      case 'PGRST116':
        return 'No data found';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }
  
  return error.message || `Failed to ${operation}`;
};

/**
 * Execute query with retry logic
 */
async function executeWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  operation: string,
  retries = MAX_RETRIES
): Promise<ApiResponse<T>> {
  let lastError: PostgrestError | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        lastError = error;
        
        // Only retry if it's a retryable error and we have retries left
        if (attempt < retries && isRetryableError(error)) {
          console.log(`Retrying ${operation} (attempt ${attempt + 1}/${retries})`);
          await sleep(RETRY_DELAY * (attempt + 1)); // Exponential backoff
          continue;
        }
        
        return {
          data: null,
          error: formatErrorMessage(error, operation),
        };
      }
      
      return { data, error: null };
    } catch (error) {
      lastError = error as PostgrestError;
      
      if (attempt < retries) {
        console.log(`Retrying ${operation} after exception (attempt ${attempt + 1}/${retries})`);
        await sleep(RETRY_DELAY * (attempt + 1));
        continue;
      }
      
      return {
        data: null,
        error: formatErrorMessage(error as Error, operation),
      };
    }
  }
  
  return {
    data: null,
    error: formatErrorMessage(lastError || new Error('Unknown error'), operation),
  };
}

// ==================== SWIMMERS API ====================

export const swimmersApi = {
  /**
   * Fetch all swimmers with related data
   */
  async getAll(): Promise<ApiResponse<Swimmer[]>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('swimmers')
          .select(`
            *,
            swim_levels!swimmers_current_level_id_fkey(display_name)
          `)
          .order('first_name');
        return result as any;
      },
      'fetch swimmers'
    );
  },

  /**
   * Fetch a single swimmer by ID
   */
  async getById(id: string): Promise<ApiResponse<Swimmer>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('swimmers')
          .select(`
            *,
            swim_levels!swimmers_current_level_id_fkey(display_name)
          `)
          .eq('id', id)
          .single();
        return result as any;
      },
      'fetch swimmer'
    );
  },

  /**
   * Fetch swimmers by parent ID
   */
  async getByParentId(parentId: string): Promise<ApiResponse<Swimmer[]>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('swimmers')
          .select(`
            *,
            swim_levels!swimmers_current_level_id_fkey(display_name)
          `)
          .eq('parent_id', parentId)
          .order('first_name');
        return result as any;
      },
      'fetch swimmers by parent'
    );
  },

  /**
   * Create a new swimmer
   */
  async create(swimmer: Record<string, any>): Promise<ApiResponse<Swimmer>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('swimmers')
          .insert([swimmer as any])
          .select(`
            *,
            swim_levels!swimmers_current_level_id_fkey(display_name)
          `)
          .single();
        return result as any;
      },
      'create swimmer'
    );
  },

  /**
   * Update a swimmer
   */
  async update(id: string, updates: Record<string, any>): Promise<ApiResponse<Swimmer>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('swimmers')
          .update(updates)
          .eq('id', id)
          .select(`
            *,
            swim_levels!swimmers_current_level_id_fkey(display_name)
          `)
          .single();
        return result as any;
      },
      'update swimmer'
    );
  },
};

// ==================== SESSIONS API ====================

export const sessionsApi = {
  /**
   * Fetch sessions with filters
   */
  async getAll(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<ApiResponse<Session[]>> {
    return executeWithRetry(
      async () => {
        let query = supabase
          .from('sessions')
          .select(`
            *,
            bookings(
              id,
              status,
              swimmer_id,
              created_at,
              canceled_at,
              cancel_reason,
              cancel_source
            )
          `)
          .order('start_time', { ascending: true });

        if (filters?.startDate) {
          query = query.gte('start_time', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('start_time', filters.endDate);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        const result = await query;
        return result as any;
      },
      'fetch sessions'
    );
  },

  /**
   * Fetch a single session by ID
   */
  async getById(id: string): Promise<ApiResponse<Session>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('sessions')
          .select(`
            *,
            bookings(
              id,
              status,
              swimmer_id,
              created_at,
              canceled_at,
              cancel_reason,
              cancel_source
            )
          `)
          .eq('id', id)
          .single();
        return result as any;
      },
      'fetch session'
    );
  },

  /**
   * Create a new session
   */
  async create(session: Record<string, any>): Promise<ApiResponse<Session>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('sessions')
          .insert([session as any])
          .select(`
            *
          `)
          .single();
        return result as any;
      },
      'create session'
    );
  },

  /**
   * Update a session
   */
  async update(id: string, updates: Record<string, any>): Promise<ApiResponse<Session>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('sessions')
          .update(updates)
          .eq('id', id)
          .select(`
            *
          `)
          .single();
        return result as any;
      },
      'update session'
    );
  },
};

// ==================== BOOKINGS API ====================

export const bookingsApi = {
  /**
   * Create an assessment booking
   */
  async createAssessment(
    sessionId: string,
    swimmerId: string,
    parentId: string
  ): Promise<ApiResponse<Booking>> {
    return executeWithRetry(
      async () => {
        // First create the booking
        const bookingResult = await supabase
          .from('bookings')
          .insert([{
            session_id: sessionId,
            swimmer_id: swimmerId,
            parent_id: parentId,
            status: 'confirmed'
          }])
          .select()
          .single();

        if (bookingResult.error) {
          return bookingResult as any;
        }

        // Then create the assessment record
        const sessionResult = await supabase
          .from('sessions')
          .select('start_time')
          .eq('id', sessionId)
          .single();

        if (sessionResult.error) {
          return sessionResult as any;
        }

        const assessmentResult = await supabase
          .from('assessments')
          .insert([{
            swimmer_id: swimmerId,
            session_id: sessionId,
            scheduled_date: sessionResult.data.start_time,
            status: 'scheduled',
            approval_status: 'approved'
          }])
          .select()
          .single();

        if (assessmentResult.error) {
          return assessmentResult as any;
        }

        // Update session status to booked
        await supabase
          .from('sessions')
          .update({ status: 'booked' })
          .eq('id', sessionId);

        return bookingResult as any;
      },
      'create assessment booking'
    );
  },

  /**
   * Fetch bookings by parent ID
   */
  async getByParentId(parentId: string): Promise<ApiResponse<Booking[]>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('bookings')
          .select(`
            *,
            sessions(
              start_time,
              end_time,
              location,
              session_type,
              profiles!sessions_instructor_id_fkey(full_name)
            ),
            swimmers(first_name, last_name)
          `)
          .eq('parent_id', parentId)
          .order('created_at', { ascending: false });
        return result as any;
      },
      'fetch bookings by parent'
    );
  },

  /**
   * Cancel a booking
   */
  async cancel(id: string, reason: string, source: string): Promise<ApiResponse<Booking>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('bookings')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            cancel_reason: reason,
            cancel_source: source
          })
          .eq('id', id)
          .select()
          .single();
        return result as any;
      },
      'cancel booking'
    );
  },

  /**
   * Create a regular booking (for weekly sessions)
   */
  async create(
    sessionId: string,
    swimmerId: string,
    parentId: string
  ): Promise<ApiResponse<Booking>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from('bookings')
          .insert([{
            session_id: sessionId,
            swimmer_id: swimmerId,
            parent_id: parentId,
            status: 'confirmed'
          }])
          .select()
          .single();
        return result as any;
      },
      'create booking'
    );
  },
};

// ==================== ADMIN KPIs API ====================

export const adminApi = {
  /**
   * Fetch admin dashboard KPIs
   */
  async getKPIs(): Promise<ApiResponse<AdminKPIs>> {
    try {
      // Fetch swimmers
      const swimmersResult = await executeWithRetry(
        async () => {
          const result = await supabase
            .from('swimmers')
            .select('id, enrollment_status, approval_status');
          return result as any;
        },
        'fetch swimmers for KPIs'
      );

      if (swimmersResult.error) {
        return { data: null, error: swimmersResult.error };
      }

      // Fetch sessions
      const sessionsResult = await executeWithRetry(
        async () => {
          const result = await supabase
            .from('sessions')
            .select('id, start_time, status');
          return result as any;
        },
        'fetch sessions for KPIs'
      );

      if (sessionsResult.error) {
        return { data: null, error: sessionsResult.error };
      }

      const swimmers = (swimmersResult.data || []) as any[];
      const sessions = (sessionsResult.data || []) as any[];
      const now = new Date();

      const kpis: AdminKPIs = {
        totalSwimmers: swimmers.length,
        activeSwimmers: swimmers.filter((s: any) => s.enrollment_status === 'active').length,
        pendingApprovals: swimmers.filter((s: any) => s.approval_status === 'pending').length,
        totalSessions: sessions.length,
        upcomingSessions: sessions.filter(
          (s: any) => new Date(s.start_time) > now && s.status === 'available'
        ).length,
      };

      return { data: kpis, error: null };
    } catch (error) {
      return {
        data: null,
        error: formatErrorMessage(error as Error, 'fetch admin KPIs'),
      };
    }
  },
};

// ==================== ASSESSMENTS API ====================

export const assessmentsApi = {
  /**
   * Create a new assessment
   */
  async create(assessmentData: CreateAssessmentData): Promise<ApiResponse<Assessment>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from("assessments")
          .insert([{
            swimmer_id: assessmentData.swimmer_id,
            session_id: assessmentData.session_id,
            scheduled_date: assessmentData.scheduled_date,
            status: assessmentData.status || "scheduled",
            approval_status: assessmentData.approval_status || "approved"
          }])
          .select()
          .single();
        return result as any;
      },
      "create assessment"
    );
  },

  /**
   * Get assessments by swimmer ID
   */
  async getBySwimmer(swimmerId: string): Promise<ApiResponse<Assessment[]>> {
    return executeWithRetry(
      async () => {
        const result = await supabase
          .from("assessments")
          .select("*")
          .eq("swimmer_id", swimmerId)
          .order("scheduled_date", { ascending: true });
        return result as any;
      },
      "fetch assessments by swimmer"
    );
  },

  /**
   * Get available assessment sessions
   */
  async getAvailableSessions(date?: string): Promise<ApiResponse<Session[]>> {
    return executeWithRetry(
      async () => {
        let query = supabase
          .from("sessions")
          .select(`
            *,
            bookings(
              id,
              status,
              swimmer_id
            )
          `)
          .eq("session_type", "initial_assessment")
          .eq("status", "available")
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true });

        if (date) {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          query = query
            .gte("start_time", startOfDay.toISOString())
            .lte("start_time", endOfDay.toISOString());
        }

        const result = await query;
        return result as any;
      },
      "fetch available assessment sessions"
    );
  },

  /**
   * Update assessment status
   */
  async updateStatus(id: string, status: string, notes?: string): Promise<ApiResponse<Assessment>> {
    return executeWithRetry(
      async () => {
        const updates: any = { status };

        if (status === "completed") {
          updates.completed_at = new Date().toISOString();
        }

        if (notes) {
          updates.instructor_notes = notes;
        }

        const result = await supabase
          .from("assessments")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        return result as any;
      },
      "update assessment status"
    );
  },
};
