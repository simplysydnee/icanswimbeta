import { useQuery } from '@tanstack/react-query';

export interface DraftSession {
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
}

export interface BatchGroup {
  batch_id: string;
  created_at: string;
  session_count: number;
  date_range: {
    start: string;
    end: string;
  };
  location: string;
  instructor: {
    id: string;
    name: string;
  };
  sessions: DraftSession[];
}

interface DraftSessionsResponse {
  batches: BatchGroup[];
}

async function fetchDraftSessions(): Promise<DraftSessionsResponse> {
  const response = await fetch('/api/admin/sessions/drafts');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch draft sessions' }));
    throw new Error(error.error || 'Failed to fetch draft sessions');
  }

  return response.json();
}

export function useDraftSessions() {
  return useQuery<DraftSessionsResponse, Error>({
    queryKey: ['draft-sessions'],
    queryFn: fetchDraftSessions,
    staleTime: 30 * 1000, // 30 seconds - drafts change frequently
  });
}