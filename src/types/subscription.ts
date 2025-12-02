// Subscription-related types for future payment integration

import { SubscriptionTier, SubscriptionStatus } from '@/lib/types';

export interface PlanFeatures {
  max_users: number | -1; // -1 for unlimited
  api_calls_per_month: number | -1;
  storage_gb: number | -1;
  support_level: 'community' | 'email' | 'dedicated';
  custom_branding: boolean;
  advanced_analytics: boolean;
  priority_support: boolean;
  sso: boolean;
  team_collaboration?: boolean;
  white_label?: boolean;
  custom_integrations?: boolean;
  dedicated_account_manager?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number | null; // null for custom pricing
  currency: string;
  interval: 'month' | 'year';
  features: PlanFeatures;
  stripe_price_id?: string;
  popular?: boolean;
  description: string;
  trial_days?: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start: Date;
  current_period_end: Date;
  trial_start?: Date;
  trial_end?: Date;
  cancel_at_period_end: boolean;
  canceled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionUsage {
  user_id: string;
  period_start: Date;
  period_end: Date;
  users_count: number;
  api_calls_count: number;
  storage_used_gb: number;
  last_updated: Date;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  bank_account?: {
    bank_name: string;
    last4: string;
    account_type: string;
  };
  is_default: boolean;
  created_at: Date;
}

export interface BillingInfo {
  customer_id: string;
  email: string;
  name: string;
  address?: BillingAddress;
  payment_methods: PaymentMethod[];
  default_payment_method?: string;
  tax_id?: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  subscription_id: string;
  stripe_invoice_id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  created_at: Date;
  due_date?: Date;
  paid_at?: Date;
  period_start: Date;
  period_end: Date;
  line_items: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  quantity: number;
  unit_amount: number;
  period_start?: Date;
  period_end?: Date;
}

export interface SubscriptionChange {
  current_plan: SubscriptionPlan;
  new_plan: SubscriptionPlan;
  effective_date: Date;
  proration_amount?: number;
  proration_date?: Date;
}

export interface CancellationFeedback {
  reason: 'too_expensive' | 'missing_features' | 'poor_support' | 'switching_competitors' | 'other';
  feedback?: string;
  would_recommend: boolean;
}

// Stripe-specific types
export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer_email?: string;
  success_url: string;
  cancel_url: string;
}

export interface StripePortalSession {
  id: string;
  url: string;
  return_url: string;
}

// Subscription management types
export interface SubscriptionContextType {
  subscription: UserSubscription | null;
  usage: SubscriptionUsage | null;
  billing: BillingInfo | null;
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  
  // Actions
  upgradeSubscription: (plan_id: string) => Promise<StripeCheckoutSession>;
  downgradeSubscription: (plan_id: string) => Promise<void>;
  cancelSubscription: (feedback?: CancellationFeedback) => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  updatePaymentMethod: (payment_method_id: string) => Promise<void>;
  createPortalSession: () => Promise<StripePortalSession>;
  refreshUsage: () => Promise<void>;
  getInvoices: () => Promise<Invoice[]>;
}

// Feature access helpers
export interface FeatureGate {
  feature: string;
  required_tier: SubscriptionTier;
  usage_limit?: number;
  current_usage?: number;
}

export interface UsageLimits {
  [key: string]: {
    limit: number;
    current: number;
    percentage: number;
  };
}