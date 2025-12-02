import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/server';
import { SubscriptionWithProduct } from '@/types/stripe';

export async function GET() {
  try {
    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }

    // If no subscription found, user is on free plan
    if (!subscription) {
      // Get free plan details
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

      if (freePlanError) {
        console.error('Error fetching free plan:', freePlanError);
        return NextResponse.json(
          { error: 'Failed to fetch plan details' },
          { status: 500 }
        );
      }

      // Convert features array to object
      const features = freePlan?.features.reduce((acc, feature) => {
        acc[feature.feature_key] = feature.feature_value;
        return acc;
      }, {} as Record<string, unknown>) || {};

      return NextResponse.json({
        subscription: null,
        plan: {
          id: freePlan.id,
          name: freePlan.name,
          description: freePlan.description,
          price: freePlan.prices[0] || { amount: 0, currency: 'usd', interval_type: 'month' },
          features,
          tier: 'free'
        }
      });
    }

    // Type the subscription result
    const typedSubscription = subscription as unknown as SubscriptionWithProduct;
    const product = typedSubscription.product;
    
    // Convert features array to object
    const features = product?.features?.reduce((acc: Record<string, unknown>, feature) => {
      acc[feature.feature_key] = feature.feature_value;
      return acc;
    }, {} as Record<string, unknown>) || {};

    // Determine tier based on plan name
    const getTier = (name: string) => {
      switch (name.toLowerCase()) {
        case 'pro': return 'pro';
        case 'enterprise': return 'enterprise';
        default: return 'free';
      }
    };

    return NextResponse.json({
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
        tier: getTier(product?.name || '')
      }
    });

  } catch (error) {
    console.error('Error in /api/subscriptions/current:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}