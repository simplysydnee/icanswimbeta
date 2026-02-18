# Admin Management Scripts

This directory contains scripts for managing administrator users in the I Can Swim Beta application.

## Prerequisites

Before using these scripts, ensure you have the following environment variables configured:

### Required Environment Variables

1. **For production/development** (`.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `SUPABASE_SECRET_KEY`: Service role key (with full admin permissions)
   - `NEXT_PUBLIC_EMAIL_APP_URL`: Application URL for email links

2. **For direct password setting** (`.env.migration` - emergency use):
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key

## Script Overview

### Primary Scripts

#### `invite-multiple-admins.js`
**Purpose**: Invite one or more admin users to the system.

**Features**:
- Checks if user exists in auth system
- Creates new users with invitation emails
- Sends password reset links for existing users
- Creates profiles in database
- Assigns admin role in `user_roles` table
- Provides detailed reporting

**Usage**:
```bash
cd /path/to/project
node scripts/admin/invite-multiple-admins.js
```

**Configuration**:
Edit the `usersToInvite` array at the top of the file to specify users:
```javascript
const usersToInvite = [
  {
    email: 'user@example.com',
    name: 'User Name',
    title: 'Administrator Title'
  }
];
```

#### `list-all-admins.js`
**Purpose**: List all users with admin privileges.

**Usage**:
```bash
node scripts/admin/list-all-admins.js
```

**Output**:
- Lists users from Supabase Auth with admin metadata
- Shows profiles from database
- Displays roles from `user_roles` table

#### `set-asira-password.js`
**Purpose**: Emergency script to manually set a password for an admin user.

**Warning**: Use only when email invitation/reset is not working.

**Usage**:
```bash
node scripts/admin/set-asira-password.js
```

**Features**:
- Generates random strong password
- Updates user password via admin API
- Displays credentials for manual sharing

### Specialized Scripts

#### `make-sutton-admin.js`
**Purpose**: Grant admin privileges to Sutton Lucas (sutton@icanswim209.com).

**Usage**:
```bash
node scripts/admin/make-sutton-admin.js
```

#### `check-sutton.js`
**Purpose**: Check Sutton's current admin status.

**Usage**:
```bash
node scripts/admin/check-sutton.js
```

### Testing Scripts

#### `test-service-role.js`
**Purpose**: Test Supabase service role connectivity.

**Usage**:
```bash
node scripts/admin/test-service-role.js
```

### Legacy Scripts (Maintained for Reference)

- `check-admin-role.js`: Check admin role assignments
- `check-admin-user.js`: Check admin user details
- `create-admin-user.js`: Legacy admin creation script
- `test-admin-session-generator.js`: Test admin session generation

## Common Workflows

### 1. Inviting New Administrators

1. Update `invite-multiple-admins.js` with new user details
2. Run the script:
   ```bash
   node scripts/admin/invite-multiple-admins.js
   ```
3. Check Supabase Auth logs for email delivery
4. Instruct users to check spam folders
5. Users click invitation link and set password

### 2. Resetting Admin Password

**Option A (Recommended)**: Use invitation script for existing users
- The `invite-multiple-admins.js` script automatically sends password reset links to existing users

**Option B (Emergency)**: Manual password reset
1. Run `set-asira-password.js`
2. Share generated password securely
3. User logs in and changes password immediately

### 3. Verifying Admin Access

1. Run `list-all-admins.js` to see all administrators
2. Check individual user status with specific check scripts

## Email Configuration

For reliable email delivery:

1. **Supabase Default Provider**: Low rate limits, may go to spam
2. **Custom SMTP (Recommended)**:
   - Configure in Supabase Dashboard → Authentication → Providers → Email
   - Use Gmail SMTP or professional email service
3. **Edge Function Alternative**:
   - This project has `send-enrollment-email` edge function
   - Can be adapted for admin invitations

## Troubleshooting

### Emails Not Received
1. Check Supabase Auth dashboard → Email Logs
2. Verify Site URL is set to `https://icanswimbeta.vercel.app`
3. Check spam/junk folders
4. Configure custom SMTP provider
5. Use manual password reset as fallback

### Permission Errors
1. Verify `SUPABASE_SECRET_KEY` has service role permissions
2. Check that key is not expired/rotated
3. Ensure proper `.env.local` file exists

### User Creation Issues
1. Check if user already exists in auth system
2. Verify profile creation triggers are working
3. Check database constraints and RLS policies

## Security Notes

- **Service Role Keys**: Have full access to database and auth system
- **Environment Files**: Never commit `.env.local` or `.env.migration` to git
- **Password Sharing**: Use secure channels for manual password sharing
- **Audit Logs**: Check Supabase logs for all admin actions
- **Principle of Least Privilege**: Create specific admin roles as needed

## Recent Updates (February 2026)

- Consolidated multiple invitation scripts into `invite-multiple-admins.js`
- Added comprehensive error handling and reporting
- Organized all admin scripts in this directory
- Created this documentation for future reference

## Support

For issues with admin access or script execution:
1. Check Supabase project status
2. Verify environment variable configuration
3. Review this documentation
4. Check git history for recent changes to scripts