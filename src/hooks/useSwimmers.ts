import { useQuery } from '@tanstack/react-query';
import type { Swimmer } from '@/types/booking';

function transformSwimmer(raw: Record<string, unknown>): Swimmer {
  const fundingSource = raw.funding_source as Record<string, unknown> | null;

  const paymentTypeMap: Record<string, string> = {
    private_pay: 'private_pay',
    funding_source: 'funded',
    scholarship: 'scholarship',
    other: 'other',
  };

  return {
    approvalStatus: (raw.approval_status as string) || '',
    id: raw.id as string,
    firstName: raw.first_name as string,
    lastName: raw.last_name as string,
    dateOfBirth: raw.date_of_birth as string,
    enrollmentStatus: raw.enrollment_status as Swimmer['enrollmentStatus'],
    assessmentStatus: (raw.assessment_status as string) || null,
    currentLevelId: (raw.current_level_id as string) || null,
    currentLevelName: (raw.current_level as Record<string, unknown>)?.name as string | undefined,
    paymentType: (paymentTypeMap[raw.payment_type as string] as Swimmer['paymentType']) || 'private_pay',
    isFundedClient: raw.payment_type === 'funding_source' || !!fundingSource,
    flexibleSwimmer: raw.flexible_swimmer as boolean || false,
    fundingSourceId: (fundingSource?.id as string) || (raw.funding_source_id as string) || null,
    fundingSourceName: fundingSource?.name as string | undefined,
    fundingSourceShortName: fundingSource?.short_name as string | undefined,
    fundingSourcePriceCents: fundingSource?.price_cents as number | undefined,
    fundingSourceType: fundingSource?.type as string | undefined,
    fundingSourceRequiresAuth: fundingSource?.requires_authorization as boolean | undefined,
    sessionsUsed: (raw.authorized_sessions_used as number) || 0,
    sessionsAuthorized: (raw.authorized_sessions_total as number) || 0,
    photoUrl: raw.photo_url as string | undefined,
    coordinatorName: raw.funding_coordinator_name as string | undefined,
    coordinatorEmail: raw.funding_coordinator_email as string | undefined,
    coordinatorPhone: raw.funding_coordinator_phone as string | undefined,
  };
}

async function fetchSwimmers(): Promise<Swimmer[]> {
  const response = await fetch('/api/swimmers');

  if (!response.ok) {
    let errorMessage = 'Failed to fetch swimmers';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // ignore
    }
    console.error('Swimmers API error:', response.status, errorMessage);
    throw new Error(errorMessage);
  }
  const data = await response.json();

  const rawSwimmers = Array.isArray(data?.swimmers) ? data.swimmers : [];
  return rawSwimmers.map(transformSwimmer);
}

export function useSwimmers() {
  return useQuery({
    queryKey: ['swimmers'],
    queryFn: fetchSwimmers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}