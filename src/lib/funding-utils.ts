import { createClient } from '@/lib/supabase/client';

export interface FundingSource {
  id: string;
  name: string;
  short_name: string;
  type: 'regional_center' | 'private_pay' | 'scholarship' | 'other';
  requires_authorization: boolean;
  authorization_label: string | null;
  price_cents: number;
  lessons_per_po: number;
  assessment_sessions: number;
  po_duration_months: number;
  renewal_alert_threshold: number;
}

export function requiresAuthorization(fundingSource: FundingSource | null): boolean {
  return fundingSource?.requires_authorization ?? false;
}

export function isRegionalCenter(fundingSource: FundingSource | null): boolean {
  return fundingSource?.type === 'regional_center';
}

export function getSessionPrice(fundingSource: FundingSource | null): number {
  return fundingSource?.price_cents ?? 7500; // Default to $75 private pay
}

export function getAuthorizationLabel(fundingSource: FundingSource | null): string {
  return fundingSource?.authorization_label ?? 'Authorization';
}

export function getLessonsPerPO(fundingSource: FundingSource | null): number {
  return fundingSource?.lessons_per_po ?? 12;
}

export function getAssessmentSessions(fundingSource: FundingSource | null): number {
  return fundingSource?.assessment_sessions ?? 1;
}

export function getPODurationMonths(fundingSource: FundingSource | null): number {
  return fundingSource?.po_duration_months ?? 3;
}

export function getRenewalAlertThreshold(fundingSource: FundingSource | null): number {
  return fundingSource?.renewal_alert_threshold ?? 11;
}

// Helper to get funding source by ID
export async function getFundingSourceById(id: string): Promise<FundingSource | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('funding_sources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching funding source:', error);
    return null;
  }

  return data as FundingSource;
}

// Helper to get all funding sources
export async function getAllFundingSources(): Promise<FundingSource[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('funding_sources')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching funding sources:', error);
    return [];
  }

  return data as FundingSource[];
}

// Helper to get funding source for a swimmer
export async function getSwimmerFundingSource(swimmerId: string): Promise<FundingSource | null> {
  const supabase = createClient();

  // First get the swimmer's funding_source_id
  const { data: swimmer, error: swimmerError } = await supabase
    .from('swimmers')
    .select('funding_source_id')
    .eq('id', swimmerId)
    .single();

  if (swimmerError || !swimmer?.funding_source_id) {
    console.error('Error fetching swimmer funding source:', swimmerError);
    return null;
  }

  // Then get the funding source
  return getFundingSourceById(swimmer.funding_source_id);
}