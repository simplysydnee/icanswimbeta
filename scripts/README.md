# Utility Scripts

This directory contains utility scripts for the I Can Swim Beta application.

## Directory Structure

- `admin/` - Administrator management scripts (invitations, permissions, etc.)
- Other scripts for data migration, testing, and maintenance

## Admin Scripts

For administrator user management, see [admin/README.md](admin/README.md).

Key scripts:
- `admin/invite-multiple-admins.js` - Invite new administrators
- `admin/list-all-admins.js` - List all administrators
- `admin/set-asira-password.js` - Emergency password reset

## Usage Notes

1. Most scripts require environment variables from `.env.local`
2. Admin scripts require service role keys with proper permissions
3. Always test scripts in development environment first
4. Review script code before execution

## Security

- Never commit environment files with secrets
- Use service role keys only when necessary
- Audit all script executions in Supabase logs