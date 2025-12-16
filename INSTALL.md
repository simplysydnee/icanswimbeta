# Vibin Coders SaaS Accelerator - Installation Guide for macOS

This comprehensive installation guide will help you set up the Vibin Coders SaaS Accelerator with complete Supabase authentication, Stripe payments, and all necessary integrations. This guide is optimized for use with **Claude Code** and its MCPs (Model Context Protocols) to automate most of the setup process.

## Quick Start with Claude Code

If you're using Claude Code with MCPs enabled, simply share this document and ask:

> "Please walk me through setting up this SaaS accelerator using the INSTALL.md guide. Use your MCPs to automate everything possible and guide me through any manual steps."

Claude Code will then use its Supabase, Stripe, and Playwright MCPs to automate most of the setup for you.

## Prerequisites

Before starting, ensure you have:

- macOS with Homebrew installed
- Node.js 18+ and npm
- A Supabase account (free tier works)
- A Stripe account (test mode for development)
- Git for cloning the repository

## Phase 1: Initial Project Setup

### 1.1 Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/vibin-coders-saas-accelerator.git
cd vibin-coders-saas-accelerator

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

### 1.2 Install Required MCPs (for Claude Code users)

If using Claude Code, ensure these MCPs are installed and configured:
- **Supabase MCP**: For database setup and configuration
- **Stripe MCP**: For payment processing setup
- **Playwright MCP**: For end-to-end testing

## Phase 2: Supabase Setup

### 2.1 Create Supabase Project (Manual Step)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project:
   - **Name**: `vibin-coders-saas-accelerator`
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your location
5. Wait for project creation (2-3 minutes)

### 2.2 Configure Environment Variables (Claude Code Automated)

**For Claude Code users**: Ask Claude to execute:
```
"Get my Supabase project URL and keys and update my .env.local file"
```

**Manual Alternative**:
1. In your Supabase dashboard, go to Settings → API
2. Copy the following values to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-service-role-key
```

### 2.3 Set Up Database Schema (Claude Code Automated)

**For Claude Code users**: Ask Claude to execute:
```
"Apply the authentication and subscription database schema to my Supabase project"
```

**Manual Alternative**: Run this SQL in your Supabase SQL Editor:

```sql
-- Core subscription tables for Stripe integration
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

CREATE TABLE IF NOT EXISTS prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  stripe_price_id VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  interval_type VARCHAR(20) DEFAULT 'month',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  feature_key VARCHAR(255) NOT NULL,
  feature_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_features_product_id ON features(product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

### 2.4 Configure Google OAuth (Manual Steps)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Configure OAuth consent screen
6. Create OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Authorized redirect URIs**: 
     - `https://your-project-ref.supabase.co/auth/v1/callback`

7. In Supabase Dashboard → Authentication → Providers:
   - Enable Google provider
   - Add your Google Client ID and Client Secret
   - Save configuration

### 2.5 Configure Email/SMTP (Manual Steps)

**Option A: Supabase Built-in Email (Development)**
- Default configuration works for development
- Limited to 3 emails per hour

**Option B: Custom SMTP (Recommended for Production)**
1. In Supabase Dashboard → Settings → Auth
2. Scroll to SMTP Settings
3. Configure your SMTP provider:
   - **Host**: Your SMTP host (e.g., smtp.gmail.com)
   - **Port**: 587 or 465
   - **Username**: Your email
   - **Password**: App-specific password
   - **Sender name**: Your app name

## Phase 3: Stripe Setup

### 3.1 Create Stripe Account (Manual Step)

1. Go to [stripe.com](https://stripe.com)
2. Create account and complete verification
3. Access your Dashboard

### 3.2 Configure Stripe Products and Prices (Claude Code Automated)

**For Claude Code users**: Ask Claude to execute:
```
"Create the Free, Pro, and Enterprise subscription products in Stripe with their prices and update my database"
```

**Manual Alternative**:

1. **Create Products** (use Stripe Dashboard or CLI):
   - **Free Plan**: $0/month
   - **Pro Plan**: $29/month  
   - **Enterprise Plan**: $99/month

2. **Get API Keys**: In Stripe Dashboard → Developers → API keys
   - Copy Publishable key and Secret key

3. **Add to .env.local**:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 3.3 Set Up Customer Portal (Manual Step)

1. Go to Stripe Dashboard → Customer Portal
2. Configure settings:
   - **Invoice history**: ON
   - **Update payment methods**: ON
   - **Cancel subscriptions**: ON
   - **Switch plans**: ON
   - **Proration**: ON

3. Add your products to the portal catalog
4. Save configuration

### 3.4 Configure Webhooks (Claude Code Assisted)

**For Development**:
```bash
# Install Stripe CLI (if not already installed)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/subscriptions/webhook
```

**For Claude Code users**: Ask Claude to help you:
```
"Help me set up Stripe webhooks for local development and add the webhook secret to my environment"
```

Add the webhook secret to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Phase 4: Final Configuration

### 4.1 Update App URL

Add to your `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.2 Seed Database with Products (Claude Code Automated)

**For Claude Code users**: Ask Claude to execute:
```
"Populate my database with the Free, Pro, and Enterprise products and their features"
```

**Manual Alternative**: Run this SQL in Supabase:

```sql
-- Insert products (replace stripe_product_id with actual IDs)
INSERT INTO products (name, description, stripe_product_id, sort_order, active) VALUES
('Free', 'Basic features for individuals', 'prod_XXXXXX', 1, true),
('Pro', 'Everything you need to scale your business', 'prod_XXXXXX', 2, true),
('Enterprise', 'Custom enterprise solution', 'prod_XXXXXX', 3, true);

-- Insert prices (replace with actual Stripe price IDs)
INSERT INTO prices (product_id, stripe_price_id, amount, currency, interval_type, active) VALUES
((SELECT id FROM products WHERE name = 'Free'), 'price_XXXXXX', 0, 'usd', 'month', true),
((SELECT id FROM products WHERE name = 'Pro'), 'price_XXXXXX', 2900, 'usd', 'month', true),
((SELECT id FROM products WHERE name = 'Enterprise'), 'price_XXXXXX', 9900, 'usd', 'month', true);

-- Insert features for each plan
INSERT INTO features (product_id, feature_key, feature_value) VALUES
-- Free plan features
((SELECT id FROM products WHERE name = 'Free'), 'max_users', '1000'),
((SELECT id FROM products WHERE name = 'Free'), 'api_calls_per_month', '10000'),
((SELECT id FROM products WHERE name = 'Free'), 'storage_gb', '1'),
((SELECT id FROM products WHERE name = 'Free'), 'support_level', '"Community"'),
-- Pro plan features
((SELECT id FROM products WHERE name = 'Pro'), 'max_users', '10000'),
((SELECT id FROM products WHERE name = 'Pro'), 'api_calls_per_month', '100000'),
((SELECT id FROM products WHERE name = 'Pro'), 'storage_gb', '10'),
((SELECT id FROM products WHERE name = 'Pro'), 'support_level', '"Email"'),
((SELECT id FROM products WHERE name = 'Pro'), 'custom_branding', 'true'),
((SELECT id FROM products WHERE name = 'Pro'), 'advanced_analytics', 'true'),
-- Enterprise plan features
((SELECT id FROM products WHERE name = 'Enterprise'), 'max_users', '-1'),
((SELECT id FROM products WHERE name = 'Enterprise'), 'api_calls_per_month', '-1'),
((SELECT id FROM products WHERE name = 'Enterprise'), 'storage_gb', '-1'),
((SELECT id FROM products WHERE name = 'Enterprise'), 'support_level', '"Dedicated"'),
((SELECT id FROM products WHERE name = 'Enterprise'), 'custom_branding', 'true'),
((SELECT id FROM products WHERE name = 'Enterprise'), 'advanced_analytics', 'true'),
((SELECT id FROM products WHERE name = 'Enterprise'), 'sso', 'true');
```

## Phase 5: Testing and Verification

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Test Authentication Flow (Claude Code Automated)

**For Claude Code users**: Ask Claude to execute:
```
"Test the authentication flow on my application using Playwright"
```

**Manual Testing**:
1. Visit `http://localhost:3000`
2. Click "Login" 
3. Sign up with email or Google
4. Verify redirect to dashboard
5. Test logout functionality

### 5.3 Test Subscription Flow (Claude Code Automated)

**For Claude Code users**: Ask Claude to execute:
```
"Test the complete subscription flow including plan switching"
```

**Manual Testing**:
1. Navigate to `/subscriptions` or pricing page
2. Click "Subscribe" on Pro plan
3. Complete Stripe checkout with test card: `4242424242424242`
4. Verify subscription appears in dashboard
5. Test plan switching through Customer Portal

### 5.4 Verify Integration (Claude Code Automated)

**For Claude Code users**: Ask Claude to check:
```
"Verify all my integrations are working: check database tables, Stripe products, and webhook endpoints"
```

## Phase 6: Production Preparation

### 6.1 Environment Variables for Production

When deploying, update these environment variables with production values:
- Replace Stripe test keys with live keys
- Update Supabase URLs if using different project for production
- Set proper `NEXT_PUBLIC_APP_URL` for your domain

### 6.2 Webhook Configuration for Production

1. In Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/subscriptions/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

stripe listen --forward-to localhost:3000/api/subscriptions/webhook --events
  checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.payme
  nt_succeeded,invoice.payment_failed

## Troubleshooting

### Common Issues and Solutions

**Authentication Issues**:
- Verify Supabase URL and keys in `.env.local`
- Check Google OAuth configuration
- Ensure email confirmations are enabled

**Subscription Issues**:
- Verify webhook endpoint is receiving events
- Check Stripe product IDs match database
- Ensure Customer Portal is properly configured

**Database Issues**:
- Verify all migrations have been applied
- Check foreign key relationships
- Ensure proper indexes are created

### Getting Help

**With Claude Code**: Simply ask:
```
"I'm having issues with [specific problem]. Help me debug and fix this."
```

**Manual Debugging**:
1. Check browser console for errors
2. Review Stripe Dashboard logs
3. Check Supabase logs and auth settings
4. Verify all environment variables are set

## MCP Commands Reference (for Claude Code)

### Supabase MCP Commands
- `mcp__supabase__get_project_url()` - Get project URL
- `mcp__supabase__get_anon_key()` - Get anonymous key
- `mcp__supabase__list_tables()` - List database tables
- `mcp__supabase__execute_sql(query)` - Execute SQL
- `mcp__supabase__apply_migration(name, query)` - Apply migration

### Stripe MCP Commands  
- `mcp__stripe__list_products()` - List products
- `mcp__stripe__create_product(name, description)` - Create product
- `mcp__stripe__create_price(product, unit_amount, currency)` - Create price
- `mcp__stripe__list_subscriptions()` - List subscriptions
- `mcp__stripe__create_payment_link(price, quantity)` - Create payment link

### Playwright MCP Commands
- `mcp__playwright__browser_navigate(url)` - Navigate to URL
- `mcp__playwright__browser_click(element, ref)` - Click element
- `mcp__playwright__browser_fill_form(fields)` - Fill form
- `mcp__playwright__browser_snapshot()` - Take page snapshot

## Success Criteria

After completing this installation, you should have:

✅ **Authentication System**
- User registration and login working
- Google OAuth integration
- Email verification functional
- Protected routes working

✅ **Payment System**  
- Stripe products and prices created
- Subscription flow working
- Plan switching functional
- Webhooks synchronized

✅ **Database Integration**
- All tables created and indexed
- User subscriptions tracked
- Features properly configured

✅ **Development Environment**
- Local development server running
- Hot reload working
- Linting and type checking passing
- Test card payments working

You now have a fully functional SaaS accelerator ready for customization and feature development!

