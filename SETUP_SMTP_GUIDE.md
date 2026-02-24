# Supabase SMTP Configuration Guide

## Problem
Password reset emails are not being delivered due to Supabase's default email provider rate limits.

## Solution
Configure custom SMTP in Supabase Dashboard to bypass rate limits.

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