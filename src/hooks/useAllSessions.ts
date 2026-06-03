import { useQuery } from '@tanstack/react-query';

export interface SessionWithBookings {
  id: string;
  instructor_id: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
  location: string;
  max_capacity: number;
  booking_count: number;
  is_full: boolean;
  session_type: string;
  status: string;
  price_cents: number;
  batch_id: string;
  created_at: string;
  updated_at: string;
  open_at: string | null;
  instructor_name?: string;
  bookings?: Array<{
    id: string;
    status: string;
    swimmer?: {
      id: string;
      first_name: string;
      last_name: string;
    };
    parent?: {
      id: string;
      full_name: string;
      email: string;
      phone: string;
    };
  }>;
}

interface AllSessionsResponse {
  sessions: SessionWithBookings[];
  stats: {
    total: number;
    draft: number;
    open: number;
    booked: number;
    completed: number;
    cancelled: number;
    no_shows: number;
  };
}

// Filters applied server-side (in the database) by /api/admin/sessions/all.
// All fields are optional; omitted/'all'/empty values mean "no filter".
export interface SessionFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  dayOfWeek?: string;
  timeFilter?: string;
  instructorId?: string;
  location?: string;
  search?: string;
}

async function fetchAllSessions(
  month?: number,
  year?: number,
  filters?: SessionFilters
): Promise<AllSessionsResponse> {
  const url = new URL('/api/admin/sessions/all', window.location.origin);

  if (month !== undefined && year !== undefined) {
    url.searchParams.set('month', month.toString());
    url.searchParams.set('year', year.toString());
  }

  if (filters) {
    const append = (key: string, value?: string) => {
      if (value && value !== 'all') url.searchParams.set(key, value);
    };
    append('status', filters.status);
    append('startDate', filters.startDate);
    append('endDate', filters.endDate);
    append('dayOfWeek', filters.dayOfWeek);
    append('timeFilter', filters.timeFilter);
    append('instructorId', filters.instructorId);
    append('location', filters.location);
    append('search', filters.search?.trim());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch sessions' }));
    throw new Error(error.error || 'Failed to fetch sessions');
  }

  return response.json();
}

export function useAllSessions(month?: number, year?: number, filters?: SessionFilters) {
  return useQuery<AllSessionsResponse, Error>({
    queryKey: ['all-sessions', month, year, filters],
    queryFn: () => fetchAllSessions(month, year, filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}