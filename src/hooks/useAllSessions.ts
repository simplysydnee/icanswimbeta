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

async function fetchAllSessions(): Promise<AllSessionsResponse> {
  const response = await fetch('/api/admin/sessions/all');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch sessions' }));
    throw new Error(error.error || 'Failed to fetch sessions');
  }

  return response.json();
}

export function useAllSessions() {
  return useQuery<AllSessionsResponse, Error>({
    queryKey: ['all-sessions'],
    queryFn: fetchAllSessions,
    staleTime: 30 * 1000, // 30 seconds
  });
}