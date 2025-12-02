import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all active products with their prices and features
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
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      );
    }

    // Transform the data to a more usable format
    const plans = products?.map(product => {
      // Convert features array to object
      const features = product.features.reduce((acc, feature) => {
        acc[feature.feature_key] = feature.feature_value;
        return acc;
      }, {} as Record<string, unknown>);

      // Get the primary price (should only be one per product in our simple setup)
      const price = product.prices[0];

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: {
          amount: price?.amount || 0,
          currency: price?.currency || 'usd',
          interval: price?.interval_type || 'month',
          stripe_price_id: price?.stripe_price_id
        },
        features,
        stripe_product_id: product.stripe_product_id
      };
    }) || [];

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error in /api/plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}