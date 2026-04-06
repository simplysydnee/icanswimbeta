# Vibin Coders SaaS Accelerator - Installation Guide for macOS

This comprehensive installation guide will help you set up the I Can Swim application with complete Supabase authentication and all necessary integrations. This guide is optimized for use with **Claude Code** and its MCPs (Model Context Protocols) to automate most of the setup process.

## Quick Start with Claude Code

If you're using Claude Code with MCPs enabled, simply share this document and ask:

> "Please walk me through setting up this SaaS accelerator using the INSTALL.md guide. Use your MCPs to automate everything possible and guide me through any manual steps."

Claude Code will then use its Supabase and Playwright MCPs to automate most of the setup for you.

## Prerequisites

Before starting, ensure you have:

- macOS with Homebrew installed
- Node.js 18+ and npm
- A Supabase account (free tier works)
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
-- Core application tables
-- Note: This application does not use Stripe payments
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


## Phase 4: Final Configuration

### 4.1 Update App URL

Add to your `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
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


### 5.4 Verify Integration (Claude Code Automated)

**For Claude Code users**: Ask Claude to check:
```
"Verify all my integrations are working: check database tables and endpoints"
```

## Phase 6: Production Preparation

### 6.1 Environment Variables for Production

When deploying, update these environment variables with production values:
- Update Supabase URLs if using different project for production
- Set proper `NEXT_PUBLIC_APP_URL` for your domain


## Troubleshooting

### Common Issues and Solutions

**Authentication Issues**:
- Verify Supabase URL and keys in `.env.local`
- Check Google OAuth configuration
- Ensure email confirmations are enabled


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
2. Check Supabase logs and auth settings
3. Verify all environment variables are set

## MCP Commands Reference (for Claude Code)

### Supabase MCP Commands
- `mcp__supabase__get_project_url()` - Get project URL
- `mcp__supabase__get_anon_key()` - Get anonymous key
- `mcp__supabase__list_tables()` - List database tables
- `mcp__supabase__execute_sql(query)` - Execute SQL
- `mcp__supabase__apply_migration(name, query)` - Apply migration


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

