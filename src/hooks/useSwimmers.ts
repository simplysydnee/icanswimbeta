import { useQuery } from '@tanstack/react-query';
import type { Swimmer } from '@/types/booking';

function transformSwimmer(raw: Record<string, unknown>): Swimmer {
  const fundingSource = raw.fundingSource as Record<string, unknown> | null;

  const paymentTypeMap: Record<string, string> = {
    private_pay: 'private_pay',
    funding_source: 'funded',
    scholarship: 'scholarship',
    other: 'other',
  };

  return {
    approvalStatus: (raw.approvalStatus as string) || '',
    id: raw.id as string,
    firstName: raw.firstName as string,
    lastName: raw.lastName as string,
    dateOfBirth: raw.dateOfBirth as string,
    enrollmentStatus: raw.enrollmentStatus as Swimmer['enrollmentStatus'],
    assessmentStatus: (raw.assessmentStatus as string) || null,
    currentLevelId: (raw.currentLevelId as string) || null,
    currentLevelName: (raw.currentLevel as Record<string, unknown>)?.displayName as string | undefined,
    paymentType: (paymentTypeMap[raw.paymentType as string] as Swimmer['paymentType']) || 'private_pay',
    isFundedClient: raw.paymentType === 'funding_source' || !!fundingSource,
    flexibleSwimmer: raw.flexibleSwimmer as boolean || false,
    fundingSourceId: (fundingSource?.id as string) || (raw.fundingSourceId as string) || null,
    fundingSourceName: fundingSource?.name as string | undefined,
    fundingSourceShortName: fundingSource?.short_name as string | undefined,
    fundingSourcePriceCents: fundingSource?.price_cents as number | undefined,
    fundingSourceType: fundingSource?.type as string | undefined,
    fundingSourceRequiresAuth: fundingSource?.requires_authorization as boolean | undefined,
    sessionsUsed: (raw.authorizedSessionsUsed as number) || 0,
    sessionsAuthorized: (raw.authorizedSessionsTotal as number) || 0,
    photoUrl: raw.photoUrl as string | undefined,
    coordinatorName: raw.fundingCoordinatorName as string | undefined,
    coordinatorEmail: raw.fundingCoordinatorEmail as string | undefined,
    coordinatorPhone: raw.fundingCoordinatorPhone as string | undefined,
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