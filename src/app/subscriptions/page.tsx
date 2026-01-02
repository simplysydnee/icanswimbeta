'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    interval_type: string;
    stripe_price_id?: string;
  };
  features: Record<string, unknown>;
  tier: string;
}

interface CurrentSubscription {
  subscription: {
    id: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
  plan: Plan;
}

function SubscriptionsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Handle success/cancel messages from Stripe checkout
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success) {
      alert('Subscription successful! Your plan is now active.');
      // Remove the query parameter
      router.replace('/subscriptions');
    }

    if (canceled) {
      alert('Subscription canceled. You can try again anytime.');
      router.replace('/subscriptions');
    }
  }, [searchParams, router]);

  // Fetch plans and current subscription
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch available plans
        const plansResponse = await fetch('/api/plans');
        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          setPlans(plansData.plans || []);
        }

        // Fetch current subscription if user is logged in
        if (user) {
          const subscriptionResponse = await fetch('/api/subscriptions/current');
          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json();
            setCurrentSubscription(subscriptionData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!priceId) return;

    try {
      setActionLoading(priceId);
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      setActionLoading('manage');
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create portal session');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Failed to access customer portal');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: Plan['price']) => {
    if (price.amount === 0) return 'Free';
    const amount = price.amount / 100;
    return `$${amount}/${price.interval_type || 'month'}`;
  };

  const formatFeatureValue = (key: string, value: unknown) => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (value === -1) return 'Unlimited';
    if (key === 'storage_gb' && typeof value === 'number') return `${value} GB`;
    if (key === 'max_users' && typeof value === 'number') return value.toLocaleString();
    if (key === 'api_calls_per_month' && typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'string') return value.charAt(0).toUpperCase() + value.slice(1);
    return String(value);
  };

  const getFeatureLabel = (key: string) => {
    const labels: Record<string, string> = {
      max_users: 'Max Users',
      api_calls_per_month: 'API Calls/Month',
      storage_gb: 'Storage',
      support_level: 'Support Level',
      custom_branding: 'Custom Branding',
      advanced_analytics: 'Advanced Analytics',
      priority_support: 'Priority Support',
      sso: 'Single Sign-On'
    };
    return labels[key] || key;
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan.id === planId;
  };

  const canSubscribe = (plan: Plan) => {
    // Can't subscribe to Free plan
    if (plan.name === 'Free') return false;
    // Can't subscribe if already on this plan
    if (isCurrentPlan(plan.id)) return false;
    // Can't subscribe if don't have a price ID
    if (!plan.price.stripe_price_id) return false;
    return true;
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Choose the plan that&apos;s right for you
          </p>
        </div>

        {/* Current Subscription Status */}
        {user && currentSubscription && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{currentSubscription.plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatPrice(currentSubscription.plan.price)}
                  </p>
                  {currentSubscription.subscription && (
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Status: <Badge variant={currentSubscription.subscription.status === 'active' ? 'default' : 'destructive'}>
                        {currentSubscription.subscription.status}
                      </Badge></p>
                      {currentSubscription.subscription.cancel_at_period_end && (
                        <p className="text-orange-600">Cancels at period end</p>
                      )}
                    </div>
                  )}
                </div>
                {currentSubscription.subscription && (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={actionLoading === 'manage'}
                    variant="outline"
                  >
                    {actionLoading === 'manage' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Manage Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className={isCurrentPlan(plan.id) ? 'border-blue-500 shadow-md' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrentPlan(plan.id) && <Badge>Current</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-2xl font-bold">{formatPrice(plan.price)}</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Features List */}
                  <div className="space-y-2">
                    {Object.entries(plan.features).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">
                          {getFeatureLabel(key)}: <strong>{formatFeatureValue(key, value)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    {!user ? (
                      <Button 
                        className="w-full"
                        onClick={() => router.push('/login')}
                      >
                        Sign In to Subscribe
                      </Button>
                    ) : isCurrentPlan(plan.id) ? (
                      <Button className="w-full" variant="outline" disabled>
                        Current Plan
                      </Button>
                    ) : canSubscribe(plan) ? (
                      <Button
                        className="w-full"
                        onClick={() => currentSubscription?.subscription ? handleManageSubscription() : handleSubscribe(plan.price.stripe_price_id!)}
                        disabled={actionLoading === plan.price.stripe_price_id || actionLoading === 'manage'}
                      >
                        {(actionLoading === plan.price.stripe_price_id || (currentSubscription?.subscription && actionLoading === 'manage')) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {currentSubscription?.subscription ? 'Switch Plan' : 'Subscribe'}
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        {plan.name === 'Free' ? 'Default Plan' : 'Contact Sales'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Note for unauthenticated users */}
        {!user && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
            <p>Sign in to view your current subscription and manage your plan</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    }>
      <SubscriptionsContent />
    </Suspense>
  );
}