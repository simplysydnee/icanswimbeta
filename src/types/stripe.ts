import Stripe from 'stripe';

/**
 * Helper function to safely get period start from a Stripe subscription
 * Handles both old API (top-level fields) and new API (item-level fields)
 */
export function getSubscriptionPeriodStart(subscription: Stripe.Subscription): number | null {
  // Try new API structure first (items.data[0])
  const fromItems = subscription.items?.data?.[0]?.current_period_start;
  if (fromItems) return fromItems;
  
  // Fallback to old API structure (top-level) for backward compatibility
  // Using type assertion for fields that may exist in older API versions
  const fromTopLevel = (subscription as unknown as { current_period_start?: number })['current_period_start'];
  return fromTopLevel || null;
}

/**
 * Helper function to safely get period end from a Stripe subscription
 * Handles both old API (top-level fields) and new API (item-level fields)
 */
export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  // Try new API structure first (items.data[0])
  const fromItems = subscription.items?.data?.[0]?.current_period_end;
  if (fromItems) return fromItems;
  
  // Fallback to old API structure (top-level) for backward compatibility
  // Using type assertion for fields that may exist in older API versions
  const fromTopLevel = (subscription as unknown as { current_period_end?: number })['current_period_end'];
  return fromTopLevel || null;
}

/**
 * Helper function to safely get subscription ID from an invoice
 * The subscription field type has changed in newer API versions
 */
export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  // Check if subscription exists and extract ID
  const subscription = (invoice as unknown as { subscription?: string | { id: string } })['subscription'];
  
  if (!subscription) return null;
  
  // Handle both string ID and expanded object cases
  if (typeof subscription === 'string') {
    return subscription;
  }
  
  if (subscription && typeof subscription === 'object' && subscription.id) {
    return subscription.id;
  }
  
  return null;
}

/**
 * Type for Supabase query result with product join
 */
export interface SubscriptionWithProduct {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product: {
    id: string;
    name: string;
    description: string;
    features: Array<{
      feature_key: string;
      feature_value: unknown;
    }>;
    prices: Array<{
      amount: number;
      currency: string;
      interval_type: string;
    }>;
  };
}