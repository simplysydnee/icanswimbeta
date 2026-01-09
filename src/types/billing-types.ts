// Billing system types for VMRC eBilling

export type BillingPeriodStatus = 'draft' | 'generated' | 'reviewed' | 'submitted' | 'paid';
export type BillingLineItemStatus = 'pending' | 'included' | 'no_service' | 'deferred';

export interface BillingPeriod {
  id: string;
  month: number;
  year: number;
  status: BillingPeriodStatus;
  total_units: number;
  total_amount_cents: number;
  line_item_count: number;
  generated_at: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  xml_file_url: string | null;
  xml_file_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BillingLineItem {
  id: string;
  billing_period_id: string;
  swimmer_id: string;
  purchase_order_id: string;
  swimmer_name: string;
  uci_number: string;
  authorization_number: string;
  auth_start_date: string | null;
  auth_end_date: string | null;
  service_code: string;
  subcode: string;
  unit_type: string;
  units_billed: number;
  days_attended: number;
  rate_cents: number;
  gross_amount_cents: number;
  status: BillingLineItemStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase_orders?: {
    sessions_authorized: number;
    billed_amount_cents: number | null;
    billing_status: string | null;
  } | null;
}

export interface FundingSource {
  id: string;
  short_name: string;
  name: string;
  is_active: boolean;
}

export interface BillingPeriodFormData {
  month: number;
  year: number;
  funding_source_id?: string;
  notes?: string;
}

export interface GenerateBillingResponse {
  inserted_count: number;
  message: string;
}

export interface XMLExportResponse {
  xml_content: string;
  export_date: string;
  record_count: number;
  total_amount: number;
}

// Zod schemas for validation
import { z } from 'zod';

export const billingPeriodSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  funding_source_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const billingFilterSchema = z.object({
  funding_source_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'generated', 'reviewed', 'submitted', 'paid']).optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020).max(2100).optional(),
});

export type BillingPeriodFormValues = z.infer<typeof billingPeriodSchema>;
export type BillingFilterValues = z.infer<typeof billingFilterSchema>;