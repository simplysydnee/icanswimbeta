// Core user types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
}

// Subscription types
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// Feature flags and permissions
export interface Feature {
  name: string;
  description: string;
  tier_required: SubscriptionTier;
  enabled: boolean;
}

export interface FeatureAccess {
  [key: string]: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Analytics types
export interface AnalyticsData {
  id: string;
  user_id: string;
  event_name: string;
  event_data: Record<string, unknown>;
  timestamp: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AnalyticsSummary {
  total_users: number;
  active_users: number;
  new_users_today: number;
  revenue_this_month: number;
  conversion_rate: number;
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoice_pdf?: string;
  created_at: string;
  due_date?: string;
  paid_at?: string;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
  processed: boolean;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface PaginatedTableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (value: unknown, record: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

// Form types
export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'select' | 'checkbox' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
  };
}

export interface FormData {
  [key: string]: unknown;
}

export interface FormErrors {
  [key: string]: string;
}