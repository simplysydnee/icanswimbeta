import { createClient } from '@/lib/supabase/server';
import type { SubscriptionWithProduct } from '@/types/stripe';
import { SubscriptionTier } from '@/lib/types';

export interface UserSubscription {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    interval_type: string;
  };
  features: Record<string, unknown>;
  tier: SubscriptionTier;
}

export interface SubscriptionWithPlan {
  subscription: UserSubscription | null;
  plan: Plan;
}

/**
 * Get user's current subscription with plan details
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
  const supabase = await createClient();

  try {
    // Get user's current subscription with product and features
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        stripe_subscription_id,
        stripe_customer_id,
        product:products!inner (
          id,
          name,
          description,
          features (
            feature_key,
            feature_value
          ),
          prices (
            amount,
            currency,
            interval_type
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError);
      return null;
    }

    // If no subscription found, user is on free plan
    if (!subscription) {
      const freePlan = await getFreePlan();
      if (!freePlan) return null;

      return {
        subscription: null,
        plan: freePlan
      };
    }

    // Convert features array to object
    const typedSubscription = subscription as unknown as SubscriptionWithProduct;
    const product = typedSubscription.product;
    const features = product?.features?.reduce((acc: Record<string, unknown>, feature: { feature_key: string; feature_value: unknown }) => {
      acc[feature.feature_key] = feature.feature_value;
      return acc;
    }, {}) || {};

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        stripe_subscription_id: subscription.stripe_subscription_id,
        stripe_customer_id: subscription.stripe_customer_id,
      },
      plan: {
        id: product?.id,
        name: product?.name,
        description: product?.description,
        price: product?.prices?.[0] || { amount: 0, currency: 'usd', interval_type: 'month' },
        features,
        tier: getTierFromName(product?.name || '')
      }
    };

  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

/**
 * Get free plan details
 */
async function getFreePlan(): Promise<Plan | null> {
  const supabase = await createClient();

  try {
    const { data: freePlan, error: freePlanError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        features (
          feature_key,
          feature_value
        ),
        prices (
          amount,
          currency,
          interval_type
        )
      `)
      .eq('name', 'Free')
      .single();

    if (freePlanError || !freePlan) {
      console.error('Error fetching free plan:', freePlanError);
      return null;
    }

    const features = freePlan.features.reduce((acc: Record<string, unknown>, feature: { feature_key: string; feature_value: unknown }) => {
      acc[feature.feature_key] = feature.feature_value;
      return acc;
    }, {});

    return {
      id: freePlan.id,
      name: freePlan.name,
      description: freePlan.description,
      price: freePlan.prices[0] || { amount: 0, currency: 'usd', interval_type: 'month' },
      features,
      tier: SubscriptionTier.FREE
    };

  } catch (error) {
    console.error('Error getting free plan:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string, 
  featureKey: string, 
  requiredValue?: unknown
): Promise<boolean> {
  const subscriptionData = await getUserSubscription(userId);
  if (!subscriptionData) return false;

  const { plan } = subscriptionData;
  const featureValue = plan.features[featureKey];

  // If no required value specified, just check if feature exists and is truthy
  if (requiredValue === undefined) {
    return !!featureValue;
  }

  // For numeric features (like limits), check if current is >= required
  if (typeof featureValue === 'number' && typeof requiredValue === 'number') {
    // -1 typically means unlimited
    if (featureValue === -1) return true;
    return featureValue >= requiredValue;
  }

  // For boolean features
  if (typeof featureValue === 'boolean') {
    return featureValue === requiredValue;
  }

  // For string features
  if (typeof featureValue === 'string') {
    return featureValue === requiredValue;
  }

  return featureValue === requiredValue;
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscriptionData = await getUserSubscription(userId);
  if (!subscriptionData || !subscriptionData.subscription) return false;

  return subscriptionData.subscription.status === 'active';
}

/**
 * Get subscription tier from plan name
 */
function getTierFromName(name: string): SubscriptionTier {
  switch (name.toLowerCase()) {
    case 'pro': return SubscriptionTier.PRO;
    case 'enterprise': return SubscriptionTier.ENTERPRISE;
    default: return SubscriptionTier.FREE;
  }
}

/**
 * Get all available plans
 */
export async function getAvailablePlans(): Promise<Plan[]> {
  const supabase = await createClient();

  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        stripe_product_id,
        sort_order,
        prices (
          id,
          amount,
          currency,
          interval_type,
          stripe_price_id
        ),
        features (
          feature_key,
          feature_value
        )
      `)
      .eq('active', true)
      .order('sort_order');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return [];
    }

    return products?.map(product => {
      // Convert features array to object
      const features = product.features.reduce((acc: Record<string, unknown>, feature: { feature_key: string; feature_value: unknown }) => {
        acc[feature.feature_key] = feature.feature_value;
        return acc;
      }, {});

      // Get the primary price
      const price = product.prices[0];

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: {
          amount: price?.amount || 0,
          currency: price?.currency || 'usd',
          interval_type: price?.interval_type || 'month',
          stripe_price_id: price?.stripe_price_id
        },
        features,
        tier: getTierFromName(product.name)
      };
    }) || [];

  } catch (error) {
    console.error('Error getting available plans:', error);
    return [];
  }
}