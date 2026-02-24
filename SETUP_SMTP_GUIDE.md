# Complete Password Reset Fix Guide

## Problems Identified
1. **Password reset emails not sending** - Supabase rate limiting
2. **Wrong redirect URL in reset links** - Supabase Dashboard misconfiguration
3. **Reset links not working** - Hash fragment handling and Site URL issues

## Solutions

### Fix 1: Supabase Dashboard Configuration (MOST IMPORTANT)

Go to: https://supabase.com/dashboard/project/jtqlamkrhdfwtmaubfrc/auth/url-configuration

**Set these exact values:**

1. **Site URL**: `https://icanswimbeta.vercel.app`
   - This tells Supabase your production domain

2. **Redirect URLs** (add all of these):
   - `https://icanswimbeta.vercel.app/reset-password`
   - `https://icanswimbeta.vercel.app/auth/callback`
   - `http://localhost:3000/reset-password` (for development)
   - `http://localhost:3000/auth/callback` (for development)

3. **Click "Save"**

**Why this fixes the issue:**
- Supabase uses the Site URL to construct `redirect_to` parameters
- Without this, reset links point to wrong URLs (like `http://localhost:3000`)
- Redirect URLs tell Supabase where it's allowed to send users

### Fix 2: Configure Custom SMTP (for email delivery)

## Steps to Configure Custom SMTP

### Option 1: Gmail SMTP (Recommended for testing)

1. **Generate Gmail App Password**:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification if not already enabled
   - Go to "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

2. **Configure in Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/jtqlamkrhdfwtmaubfrc/auth/providers
   - Click "Email" provider
   - Enable "Custom SMTP"
   - Fill in the following:
     ```
     SMTP Host: smtp.gmail.com
     SMTP Port: 587 (or 465 for SSL)
     SMTP User: your-email@gmail.com
     SMTP Password: [16-character app password]
     SMTP Sender Email: your-email@gmail.com
     ```
   - Enable "Use TLS" (for port 587) or "Use SSL" (for port 465)
   - Click "Save"

### Option 2: Resend (Recommended for production)

1. **Sign up for Resend**:
   - Go to https://resend.com
   - Create account and verify domain

2. **Get API Key**:
   - Go to https://resend.com/api-keys
   - Create new API key

3. **Configure in Supabase**:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Password: [Resend API key]
   SMTP Sender Email: noreply@yourdomain.com
   ```

### Option 3: SendGrid

1. **Sign up for SendGrid**:
   - Go to https://sendgrid.com
   - Create account and verify sender

2. **Get API Key**:
   - Create API key with "Mail Send" permissions

3. **Configure in Supabase**:
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Password: [SendGrid API key]
   SMTP Sender Email: noreply@yourdomain.com
   ```

## Verify Configuration

1. **Test email sending**:
   - Go to Supabase Dashboard → Authentication → Users
   - Find a test user
   - Click "Send magic link" or "Send reset password email"
   - Check if email arrives

2. **Check logs**:
   - Go to Authentication → Logs
   - Look for email sending events

3. **Test in application**:
   - Go to `/forgot-password`
   - Enter test email
   - Check if success message appears
   - Check if email arrives (including spam folder)

## Important Notes

1. **Rate Limits**:
   - Supabase default: Very low (causing "25 seconds" error)
   - Gmail: 500 emails/day free tier
   - Resend: 100 emails/day free tier
   - SendGrid: 100 emails/day free tier

2. **Email Deliverability**:
   - Configure SPF/DKIM/DMARC for production
   - Use a domain you control for "From" address
   - Monitor spam complaints

3. **Fallback Strategy**:
   - Keep manual password reset scripts as backup
   - `scripts/admin/set-asira-password.js` for emergencies
   - `scripts/admin/invite-multiple-admins.js` for bulk resets

## Testing After Configuration

Run the debug script to verify:
```bash
node scripts/admin/debug-email-delivery.js
```

Test password reset in UI:
1. Navigate to https://icanswimbeta.vercel.app/forgot-password
2. Enter valid email
3. Check for success message
4. Check email inbox (including spam)

## Troubleshooting

### If reset links still don't work:

1. **Check the actual reset link URL**:
   - Click "View email source" or copy link address
   - It should look like: `https://jtqlamkrhdfwtmaubfrc.supabase.co/auth/v1/verify?token=XXX&type=recovery&redirect_to=https://icanswimbeta.vercel.app/reset-password`
   - The `redirect_to` MUST be `https://icanswimbeta.vercel.app/reset-password`

2. **Check browser console**:
   - Open Developer Tools (F12) → Console
   - Click the reset link
   - Look for "ResetPasswordForm:" logs
   - Check for errors

3. **Test the flow manually**:
   ```javascript
   // In browser console on https://icanswimbeta.vercel.app/reset-password
   // Manually set a hash fragment to test
   window.location.hash = '#access_token=test&refresh_token=test&type=recovery';
   // The page should detect tokens and show password reset form
   ```

4. **Verify Supabase logs**:
   - Go to Authentication → Logs
   - Look for "Recovery" events
   - Check if emails are being sent

### Common Error Messages:

- **"Invalid Reset Link"**: Tokens not found in URL or expired
- **"Email sending rate limit reached"**: Wait 25 seconds, configure SMTP
- **No error but form doesn't show**: Hash fragment not being read properly

## How Password Reset Should Work:

1. User enters email at `/forgot-password`
2. Supabase sends email with link to its verify endpoint
3. User clicks link, goes to Supabase
4. Supabase verifies token, redirects to your app with hash fragment
5. Your app reads hash, establishes session, shows reset form
6. User enters new password, app updates it

The fixes above ensure steps 2 and 4 work correctly.