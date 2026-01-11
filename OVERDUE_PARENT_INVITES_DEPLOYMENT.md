# Overdue Parent Invites Auto-Task System - Deployment Guide

## Overview
This system automatically creates follow-up tasks for Taylor (info@icanswim209.com) when parents haven't completed enrollment 7+ days after being invited.

## System Components

### 1. Database Migration
**File:** `supabase/migrations/20260111000002_add_invitation_tracking_to_swimmers.sql`

Adds two columns to the `swimmers` table:
- `invited_at` (TIMESTAMPTZ) - When parent invitation was sent
- `follow_up_task_created` (BOOLEAN DEFAULT false) - Prevents duplicate task creation

### 2. Edge Function
**File:** `supabase/functions/check-overdue-invites/index.ts`

Daily cron job that:
1. Queries swimmers with overdue invites (7+ days, no parent linked, no follow-up task)
2. Creates tasks for Taylor with priority based on overdue duration
3. Marks swimmers as having follow-up task created

### 3. Admin Dashboard Integration
**File:** `src/app/admin/tasks/page.tsx`

Existing tasks page already supports:
- "follow_up" task category
- Filtering by category, priority, status
- Task completion functionality
- Kanban board view

## Deployment Steps

### Step 1: Apply Database Migration
```bash
npx supabase db push
```

### Step 2: Deploy Edge Function
```bash
npx supabase functions deploy check-overdue-invites
```

### Step 3: Set Environment Variables
In Supabase Dashboard → Edge Functions → check-overdue-invites → Settings:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### Step 4: Configure Cron Schedule
In Supabase Dashboard → Edge Functions → check-overdue-invites → Schedule:
- **Cron Expression:** `0 16 * * *` (8am Pacific = 16:00 UTC)
- **Description:** "Daily check for overdue parent invites"

### Step 5: Test Manually
```bash
curl -X POST https://[project-ref].supabase.co/functions/v1/check-overdue-invites \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json"
```

### Step 6: Verify in Admin Dashboard
1. Go to `/admin/tasks`
2. Filter by category "Follow-up"
3. Verify tasks appear for Taylor (info@icanswim209.com)

## Logic Details

### Query Criteria
Swimmers are considered "overdue" when ALL conditions are met:
1. `parent_id IS NULL` (not linked to parent)
2. `invited_at IS NOT NULL` (was invited)
3. `invited_at < NOW() - INTERVAL '7 days'` (7+ days ago)
4. `follow_up_task_created = false` (no task created yet)

### Task Creation
For each overdue swimmer:
- **Title:** "Follow up: [Swimmer Name] - Parent enrollment overdue (X days)"
- **Category:** `follow_up`
- **Priority:** `high` if >14 days, `medium` if 7-14 days
- **Assigned To:** Taylor (info@icanswim209.com)
- **Due Date:** Today (immediate)
- **Description:** Includes swimmer details, parent contact info, coordinator info, days since invite

### Prevention of Duplicates
- `follow_up_task_created` column prevents creating multiple tasks for same swimmer
- Once task is created, swimmer is marked as `follow_up_task_created = true`

## Integration Points

### 1. Parent Invitation Flow
When sending parent invitations, update the `invited_at` column:
```sql
UPDATE swimmers SET invited_at = NOW() WHERE id = :swimmer_id;
```

### 2. Parent Enrollment Completion
When parent completes enrollment and links to swimmer:
```sql
UPDATE swimmers
SET parent_id = :parent_id,
    follow_up_task_created = false
WHERE id = :swimmer_id;
```

### 3. Manual Task Management
Admins can:
- View all follow-up tasks in `/admin/tasks`
- Filter by category "Follow-up"
- Mark tasks as complete
- Reassign tasks if needed
- Add comments or update priority

## Monitoring & Maintenance

### 1. Check Function Logs
Supabase Dashboard → Edge Functions → check-overdue-invites → Logs

### 2. Monitor Task Volume
Admin Dashboard → Tasks → Filter by "Follow-up" category

### 3. Adjust Thresholds (if needed)
To change from 7 days to a different threshold:
1. Update Edge Function line: `- 7 * 24 * 60 * 60 * 1000`
2. Redeploy function: `npx supabase functions deploy check-overdue-invites`

### 4. Update Priority Logic
Current priority logic:
- 7-14 days overdue: `medium` priority
- 15+ days overdue: `high` priority

## Troubleshooting

### Common Issues

#### 1. No Tasks Being Created
- Check if `invited_at` column is being set when invitations are sent
- Verify Taylor's user exists (info@icanswim209.com in profiles table)
- Check Edge Function logs for errors

#### 2. Duplicate Tasks
- Ensure `follow_up_task_created` column is being updated to `true`
- Check if Edge Function is running multiple times (verify cron schedule)

#### 3. Tasks Not Appearing in Dashboard
- Verify user has admin/instructor role
- Check if filtering is applied (clear filters)
- Confirm task category is "follow_up"

#### 4. Edge Function Failing
- Check environment variables are set
- Verify service role key has proper permissions
- Check Supabase project is active (not paused)

## Rollback Plan

### If Issues Occur:
1. **Disable cron:** Remove schedule from Supabase Dashboard
2. **Manual cleanup:** Delete any incorrectly created tasks
3. **Reset swimmers:** `UPDATE swimmers SET follow_up_task_created = false WHERE follow_up_task_created = true;`
4. **Redeploy:** Fix issues and redeploy function

## Support
For issues or questions:
1. Check Edge Function logs in Supabase Dashboard
2. Review this deployment guide
3. Contact system administrator

---

**Last Updated:** 2026-01-11
**System Status:** Ready for deployment