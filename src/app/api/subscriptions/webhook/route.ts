import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getSubscriptionPeriodStart, getSubscriptionPeriodEnd, getInvoiceSubscriptionId } from '@/types/stripe';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Webhook processing is disabled.' },
      { status: 503 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Create Supabase client with service role for webhook operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.subscription) {
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const userId = session.metadata?.user_id;
          const productId = session.metadata?.product_id;

          if (userId && productId) {
            // Get period dates using helper functions
            const periodStart = getSubscriptionPeriodStart(subscription);
            const periodEnd = getSubscriptionPeriodEnd(subscription);
            
            // Create subscription record
            const { error } = await supabase
              .from('subscriptions')
              .upsert({
                user_id: userId,
                product_id: productId,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer as string,
                status: subscription.status,
                current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
                current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date().toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              }, {
                onConflict: 'stripe_subscription_id'
              });

            if (error) {
              console.error('Error creating subscription record:', error);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status
        const updateData: Record<string, string | boolean> = {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        };

        // Get period dates using helper functions
        const periodStart = getSubscriptionPeriodStart(subscription);
        const periodEnd = getSubscriptionPeriodEnd(subscription);
        
        // Only update period dates if they exist
        if (periodStart) {
          updateData.current_period_start = new Date(periodStart * 1000).toISOString();
        }
        if (periodEnd) {
          updateData.current_period_end = new Date(periodEnd * 1000).toISOString();
        }

        // Check if the subscription items changed (plan switching)
        if (subscription.items && subscription.items.data.length > 0) {
          const stripePriceId = subscription.items.data[0].price.id;
          
          // Find the product_id for this price in our database
          const { data: priceData, error: priceError } = await supabase
            .from('prices')
            .select('product_id')
            .eq('stripe_price_id', stripePriceId)
            .single();

          if (!priceError && priceData) {
            updateData.product_id = priceData.product_id;
          } else {
            console.error('Error finding product for price:', stripePriceId, priceError);
          }
        }

        const { error } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Mark subscription as canceled
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error canceling subscription:', error);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (subscriptionId) {
          // Update subscription status to active on successful payment
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            console.error('Error updating subscription on payment success:', error);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        const subscriptionId = getInvoiceSubscriptionId(invoice);
        if (subscriptionId) {
          // Update subscription status to past_due on failed payment
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            console.error('Error updating subscription on payment failure:', error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}