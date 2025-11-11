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
