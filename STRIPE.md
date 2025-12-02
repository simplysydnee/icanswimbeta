# Stripe Integration Setup

Complete Stripe subscription integration with webhook synchronization.

## ⚠️ IMPORTANT: CODE IS ALREADY WORKING

**This is a fully functional codebase. All application code is correct and tested.**

- ✅ **Do NOT modify any application code** (API routes, components, types, etc.)
- ✅ **All issues are Stripe configuration problems** - not code problems
- ✅ **Focus only on Stripe setup and environment configuration**
- ✅ **If something doesn't work, it's a Stripe config issue, not a code bug**

The subscription system, webhooks, and database sync are already implemented and working. This guide only handles external setup (Stripe dashboard, CLI, environment variables).

## Prerequisites

- ✅ Supabase project is set up and running
- ✅ Environment variables configured in `.env.local`
- ✅ Stripe account created (test mode for development)
- ✅ Stripe CLI installed (`brew install stripe/stripe-cli/stripe`)
- ✅ Claude Code with Stripe and Supabase MCP tools enabled

## 1. Database Setup

```sql
-- Products table (subscription plans)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  stripe_product_id VARCHAR(255) UNIQUE,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prices table (pricing for each product)
CREATE TABLE IF NOT EXISTS prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stripe_price_id VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  currency VARCHAR(3) DEFAULT 'usd',
  interval_type VARCHAR(20) DEFAULT 'month',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Features table (plan features and limits - sample data)
CREATE TABLE IF NOT EXISTS features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  feature_key VARCHAR(255) NOT NULL,
  feature_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table (user subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_features_product_id ON features(product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

## 2. Stripe Product & Price Creation

⚠️ **Important MCP Constraint**: The Stripe MCP cannot create subscription prices. You must use the Stripe API directly for price creation, but can use MCP for products.

### Create Products Using Stripe MCP

**Using Stripe MCP:**

```bash
# Create Free product
mcp__stripe__create_product(name="Free", description="Basic features for individuals")

# Create Pro product
mcp__stripe__create_product(name="Pro", description="Everything you need to scale your business with advanced features and priority support")

# Create Enterprise product
mcp__stripe__create_product(name="Enterprise", description="Custom enterprise solution with unlimited features, dedicated support, and SSO integration")
```

**Save the returned product IDs** - you'll need them for the next step.

### Set Up Default Prices (CRITICAL STEP)

⚠️ **CRITICAL**: Products must have default prices set or checkout sessions will default to payment mode instead of subscription mode.

**Get your Stripe secret key from `.env.local`:**
```bash
# Look for: STRIPE_SECRET_KEY=sk_test_...
```

**Create prices using curl:**

```bash
# Free plan price ($0/month)
curl https://api.stripe.com/v1/prices \
  -u sk_test_YOUR_SECRET_KEY: \
  -d currency=usd \
  -d unit_amount=0 \
  -d "recurring[interval]=month" \
  -d product=prod_YOUR_FREE_PRODUCT_ID

# Pro plan price ($29/month) 
curl https://api.stripe.com/v1/prices \
  -u sk_test_YOUR_SECRET_KEY: \
  -d currency=usd \
  -d unit_amount=2900 \
  -d "recurring[interval]=month" \
  -d product=prod_YOUR_PRO_PRODUCT_ID

# Enterprise plan price ($99/month)
curl https://api.stripe.com/v1/prices \
  -u sk_test_YOUR_SECRET_KEY: \
  -d currency=usd \
  -d unit_amount=9900 \
  -d "recurring[interval]=month" \
  -d product=prod_YOUR_ENTERPRISE_PRODUCT_ID
```


**Save the returned price IDs** - you'll need them for database population.

### Set Default Prices on Products (REQUIRED)

**For each product, set the default price using curl:**
```bash
# Set default price for Free product
curl https://api.stripe.com/v1/products/prod_YOUR_FREE_PRODUCT_ID \
  -u sk_test_YOUR_SECRET_KEY: \
  -d default_price=price_YOUR_FREE_PRICE_ID

# Set default price for Pro product  
curl https://api.stripe.com/v1/products/prod_YOUR_PRO_PRODUCT_ID \
  -u sk_test_YOUR_SECRET_KEY: \
  -d default_price=price_YOUR_PRO_PRICE_ID

# Set default price for Enterprise product
curl https://api.stripe.com/v1/products/prod_YOUR_ENTERPRISE_PRODUCT_ID \
  -u sk_test_YOUR_SECRET_KEY: \
  -d default_price=price_YOUR_ENTERPRISE_PRICE_ID
```

**Verify default prices are set:**
```bash
mcp__stripe__list_products()
```

Each product should show `"default_price": "price_XXXXXX"` in the output.

## 3. Database Population

Sync your Stripe products and prices to the Supabase database.

### Insert Products
**Replace `prod_XXXXXX` with your actual Stripe product IDs:**

```sql
-- Insert products with actual Stripe product IDs and proper sort order
INSERT INTO products (name, description, stripe_product_id, sort_order, active) VALUES
('Free', 'Basic features for individuals', 'prod_YOUR_FREE_PRODUCT_ID', 1, true),
('Pro', 'Everything you need to scale your business with advanced features and priority support', 'prod_YOUR_PRO_PRODUCT_ID', 2, true),
('Enterprise', 'Custom enterprise solution with unlimited features, dedicated support, and SSO integration', 'prod_YOUR_ENTERPRISE_PRODUCT_ID', 3, true);
```

### Insert Prices
**Replace `price_XXXXXX` with your actual Stripe price IDs:**

```sql
-- Insert prices with actual Stripe price IDs
INSERT INTO prices (product_id, stripe_price_id, amount, currency, interval_type, active) VALUES
((SELECT id FROM products WHERE name = 'Free'), 'price_YOUR_FREE_PRICE_ID', 0, 'usd', 'month', true),
((SELECT id FROM products WHERE name = 'Pro'), 'price_YOUR_PRO_PRICE_ID', 2900, 'usd', 'month', true),
((SELECT id FROM products WHERE name = 'Enterprise'), 'price_YOUR_ENTERPRISE_PRICE_ID', 9900, 'usd', 'month', true);
```

### Add Sample Features (Template Data)

⚠️ **Note**: These are sample features for demonstration. Customize these based on your actual application features.

```sql
-- Sample features for Free plan
INSERT INTO features (product_id, feature_key, feature_value) VALUES
((SELECT id FROM products WHERE name = 'Free'), 'max_users', '1000'),
((SELECT id FROM products WHERE name = 'Free'), 'api_calls_per_month', '10000'),
((SELECT id FROM products WHERE name = 'Free'), 'storage_gb', '1'),
((SELECT id FROM products WHERE name = 'Free'), 'support_level', '"Community"');

-- Sample features for Pro plan  
INSERT INTO features (product_id, feature_key, feature_value) VALUES
((SELECT id FROM products WHERE name = 'Pro'), 'max_users', '10000'),
((SELECT id FROM products WHERE name = 'Pro'), 'api_calls_per_month', '100000'),
((SELECT id FROM products WHERE name = 'Pro'), 'storage_gb', '10'),
((SELECT id FROM products WHERE name = 'Pro'), 'support_level', '"Email"');

-- Sample features for Enterprise plan
INSERT INTO features (product_id, feature_key, feature_value) VALUES
((SELECT id FROM products WHERE name = 'Enterprise'), 'max_users', '-1'),
((SELECT id FROM products WHERE name = 'Enterprise'), 'api_calls_per_month', '-1'),
((SELECT id FROM products WHERE name = 'Enterprise'), 'storage_gb', '-1'),
((SELECT id FROM products WHERE name = 'Enterprise'), 'support_level', '"Dedicated"');
```

### Verify Database Population
```bash
# Check products
mcp__supabase__execute_sql("SELECT * FROM products ORDER BY sort_order;")

# Check prices
mcp__supabase__execute_sql("SELECT p.name, pr.amount, pr.stripe_price_id FROM products p JOIN prices pr ON p.id = pr.product_id ORDER BY p.sort_order;")

# Check features count
mcp__supabase__execute_sql("SELECT p.name, COUNT(f.id) as feature_count FROM products p LEFT JOIN features f ON p.id = f.product_id GROUP BY p.name, p.sort_order ORDER BY p.sort_order;")
```

Expected: 3 products, 3 prices, 12 features (4 per plan).

## 4. Environment Variables

**Ensure your `.env.local` has Stripe keys:**

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=   # Set during webhook setup
```

## 5. Webhook Setup and Testing

### Ensure Stripe CLI Authentication

**CRITICAL: Authenticate Stripe CLI (prevents webhook failures):**
```bash
# This command MUST work for webhooks to function
stripe login
```

Enter your test API keys when prompted.

### Start Webhook Forwarding
```bash
stripe listen --forward-to localhost:3000/api/subscriptions/webhook --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed
```

⚠️ **CRITICAL**: Copy the webhook signing secret (`whsec_...`) to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**Restart your development server:** `npm run dev`

### Test Webhook Functionality

**BEFORE testing subscriptions, verify webhooks work:**

**In a new terminal, trigger test events:**
```bash
# Test basic webhook connectivity
stripe trigger checkout.session.completed
```

**Monitor webhook activity:**
- Check the Stripe CLI terminal shows: `[200] POST /api/subscriptions/webhook`
- Check your Next.js application logs show successful webhook processing
- If you see `[400]` or signature errors, the webhook secret is wrong
- If you see connection errors, restart both servers

**If webhooks fail:**
1. Verify `stripe login` worked
2. Check webhook secret in `.env.local` matches CLI output exactly
3. Restart development server: `npm run dev`
4. Restart webhook forwarding: `stripe listen --forward-to...`

## 6. Integration Verification

### End-to-End Testing Procedure

**Follow these steps in order:**

1. **⚠️ CRITICAL: Kill any existing processes on port 3000:**
   ```bash
   # Check if anything is running on port 3000
   lsof -ti:3000
   
   # If output shows process IDs, kill them:
   lsof -ti:3000 | xargs kill -9
   
   # Alternative single command:
   kill -9 $(lsof -ti:3000) 2>/dev/null || echo "Port 3000 is free"
   ```

2. **Start your application:**
   ```bash
   npm run dev
   ```

3. **Ensure webhook forwarding is running:**
   ```bash
   stripe listen --forward-to localhost:3000/api/subscriptions/webhook --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed
   ```

4. **Test subscription creation:**
   - Navigate to `http://localhost:3000/subscriptions` (or your pricing page)
   - Sign in with a test user
   - Click "Subscribe" on the Pro plan
   - Use test card: `4242424242424242` (any future date, any CVC)
   - Complete the checkout process

5. **Verify subscription in database:**
   ```bash
   mcp__supabase__execute_sql("SELECT s.*, p.name as plan_name FROM subscriptions s JOIN products p ON s.product_id = p.id ORDER BY s.created_at DESC LIMIT 1;")
   ```

6. **Test plan switching:**
   - Navigate to subscription management page
   - Click "Manage Subscription" (should redirect to Customer Portal)
   - Switch from Pro to Enterprise plan
   - Verify the change syncs back to your database

### Verification Commands

**Check Stripe integration:**
```bash
# List recent subscriptions in Stripe
mcp__stripe__list_subscriptions(limit=5)

# Verify products are correctly configured
mcp__stripe__list_products()
```

**Check Supabase synchronization:**
```bash
# Check all subscriptions with plan names
mcp__supabase__execute_sql("SELECT s.status, s.stripe_subscription_id, p.name as plan_name, s.created_at FROM subscriptions s JOIN products p ON s.product_id = p.id ORDER BY s.created_at DESC;")

# Verify all products have prices
mcp__supabase__execute_sql("SELECT p.name, pr.amount/100 as price_dollars, pr.stripe_price_id FROM products p JOIN prices pr ON p.id = pr.product_id ORDER BY p.sort_order;")

# Check feature count per plan
mcp__supabase__execute_sql("SELECT p.name, COUNT(f.id) as feature_count FROM products p LEFT JOIN features f ON p.id = f.product_id GROUP BY p.name, p.sort_order ORDER BY p.sort_order;")
```

### Troubleshooting Common Issues

**Issue: Checkout creates payment instead of subscription**
- ❌ **Root Cause**: Missing default prices on products  
- ✅ **Solution**: Set default prices (see Section 2.3)

**Issue: "Webhook signature verification failed"**
- ❌ **Root Cause**: Webhook secret in `.env.local` doesn't match CLI output
- ✅ **Solution**: Copy exact secret from `stripe listen` output to `.env.local`

**Issue: Webhook connectivity problems**
- ❌ **Root Cause**: Port conflicts or authentication issues
- ✅ **Solution**: Kill existing processes, restart dev server, re-run `stripe login`

### Success Criteria

✅ **Installation Complete When:**
- Database: 4 tables, 3 products, 3 prices, 12 features
- Stripe: 3 products with default prices set ($0, $29, $99)
- Webhooks: Test event shows `[200] POST /api/subscriptions/webhook`
- End-to-end: Subscription checkout and plan switching work

## Next Steps

After completing this installation:

1. **Customize Features**: Replace sample features with your actual application features
2. **Production Setup**: Configure live Stripe keys and production webhook endpoints  
3. **UI Integration**: Connect your frontend components to the subscription data
4. **Testing**: Run comprehensive tests with different user scenarios
5. **Monitoring**: Set up logging and alerts for webhook processing

Your Stripe integration is now fully functional and ready for development!

## Customer Portal Setup

**IMPORTANT**: Complete these manual steps in the Stripe Dashboard to enable plan switching:

### Step 1: Enable Customer Portal
1. Go to **[Stripe Dashboard → Customer Portal](https://dashboard.stripe.com/test/settings/billing/portal)**
2. Click **"Activate Customer Portal"** if not already active

### Step 2: Configure Portal Features
Enable these features:
- ✅ **Invoice history**: ON
- ✅ **Update payment methods**: ON  
- ✅ **Cancel subscriptions**: ON
- ✅ **Switch plans**: ON ← **CRITICAL for plan switching**
- ✅ **Proration**: ON

### Step 3: Add Products to Portal Catalog
1. Scroll to **"Product catalog"** section
2. Click **"Add products"**
3. Select all three products: **Free**, **Pro**, **Enterprise**
4. For each product, ensure **"Allow customers to switch to this product"** is checked
5. Set switching behavior: **"Update immediately"** for downgrades
6. Click **"Save"**

### Step 4: Test Portal Configuration
1. In Customer Portal settings, click **"Preview portal"**
2. Verify all three plans appear in the subscription management interface
3. Test the plan switching functionality works correctly
4. Confirm pricing displays properly ($0, $29, $99/month)

### Step 5: Verify Integration
```bash
# Test that your application can generate portal links
curl -X POST http://localhost:3000/api/subscriptions/customer-portal \
  -H "Content-Type: application/json" \
  -d '{"return_url": "http://localhost:3000/dashboard"}'
```

**✅ Customer Portal is now configured for seamless plan switching!**
