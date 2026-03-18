import { useQuery } from '@tanstack/react-query';

export interface SwimmerInstructorAssignmentItem {
  id: string;
  swimmerId: string;
  instructorId: string;
  assignedBy: string | null;
  assignedAt: string;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  instructor: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

async function fetchInstructorsBySwimmer(swimmerId: string): Promise<SwimmerInstructorAssignmentItem[]> {
  const response = await fetch(`/api/swimmers/${swimmerId}/instructors`);

  if (!response.ok) {
    let errorMessage = 'Failed to fetch assigned instructors';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return Array.isArray(data?.instructors) ? data.instructors : [];
}

export function useInstructorsBySwimmer(swimmerId: string | null) {
  return useQuery({
    queryKey: ['swimmer-instructors', swimmerId],
    queryFn: () => fetchInstructorsBySwimmer(swimmerId!),
    enabled: !!swimmerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
