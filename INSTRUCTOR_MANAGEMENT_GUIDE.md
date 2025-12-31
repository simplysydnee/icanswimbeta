# Instructor Management Guide - I Can Swim Admin

## Overview

This guide explains how to manage swim instructors in the I Can Swim system. There are **two separate management interfaces**:

1. **Instructors Management** (`/admin/instructors`) - Add/edit instructor profiles and credentials
2. **Team Management** (`/admin/team`) - Manage pay rates and employment details

## Accessing Instructor Management

### Step 1: Log in as Admin
1. Go to `https://icanswim209.com/login`
2. Log in with your admin credentials
3. You'll be taken to the Admin Dashboard

### Step 2: Navigate to Instructor Management
**Option A: Via Sidebar (if visible)**
- Look for "Instructors" in the left sidebar
- Click to access `/admin/instructors`

**Option B: Direct URL**
- Go directly to `https://icanswim209.com/admin/instructors`

## Adding a New Instructor

### Step 1: Open Add Instructor Dialog
1. On the Instructors page, click the **"Add Instructor"** button (blue button in top-right)
2. A dialog will open with a form

### Step 2: Fill in Instructor Details
**Required Fields:**
- **Full Name** - Instructor's full name (e.g., "Jane Smith")
- **Email** - Instructor's email address (must be unique)

**Optional Fields:**
- **Title** - Job title (e.g., "Lead Instructor", "Swim Instructor")
- **Phone** - Contact phone number
- **Bio** - Brief description of experience and specialties
- **Photo** - Upload instructor headshot

### Step 3: Upload Instructor Photo
1. Click **"Upload Photo"** under the avatar preview
2. Select an image file (JPG, PNG, etc.)
3. Maximum file size: 5MB
4. Photo will be automatically resized and stored

### Step 4: Save Instructor
1. Click **"Add Instructor"** button
2. The system will:
   - Create a user account for the instructor
   - Send a password setup email to the instructor
   - Add them to the "instructor" role
   - Display them on the public "Our Team" page (if `display_on_team` is enabled)

## Editing Existing Instructors

### Step 1: Find Instructor
1. Browse the instructor list on the main page
2. Each instructor shows:
   - Name and bio preview
   - Title badge
   - Email
   - Active status toggle
   - Edit button (pencil icon)

### Step 2: Edit Details
1. Click the **pencil icon** on the instructor's row
2. Edit any field except email (email cannot be changed)
3. Update photo if needed
4. Click **"Update Instructor"**

### Step 3: Toggle Active Status
- Use the **switch** in the "Active" column
- **On** = Instructor can log in and be assigned to sessions
- **Off** = Instructor cannot log in (temporarily deactivated)

## Managing Team Display on Public Website

### How Instructors Appear on Public "Our Team" Page
The public website at `https://icanswim209.com/team` automatically displays instructors with:
- `display_on_team` = `true` (default for new instructors)
- Sorted by `display_order` (lower numbers appear first)

### Controlling Team Display
**To hide an instructor from the public team page:**
1. Edit the instructor
2. Set `display_on_team` to `false` (requires database update - contact developer)

**To reorder instructors on the team page:**
1. Update `display_order` field (requires database update - contact developer)
2. Lower numbers appear first (0, 1, 2, etc.)

## Managing Pay Rates and Employment (Team Page)

### Access Team Management
Go to `https://icanswim209.com/admin/team`

### Edit Pay Rates
1. Click **"Edit"** button next to any instructor
2. Update:
   - **Pay Rate** (in dollars per hour, e.g., 25.00 = $25/hour)
   - **Employment Type** (hourly, salary, or contractor)
3. Click **"Save Changes"**

### View Team Summary
The Team page shows:
- Total number of instructors
- Average pay rate
- Count of hourly employees

## Instructor Credentials and Certifications

### Adding Credentials
Currently, credentials can only be added via database update. Contact developer to:
1. Add certifications to the `credentials` array field
2. Examples: "CPR Certified", "First Aid", "Swim Angelfish Level 2"

### Display on Public Team Page
Credentials appear as badges under each instructor's bio on the public team page.

## Common Tasks

### Reset Instructor Password
If an instructor forgets their password:
1. They can use "Forgot Password" on login page
2. Or admin can trigger reset via database (contact developer)

### Remove Instructor from System
**Do NOT delete instructor accounts!** Instead:
1. Set `is_active` to `false` (toggle switch off)
2. Set `display_on_team` to `false` if needed
3. This preserves historical data (sessions, progress notes)

### Bulk Add Instructors
Currently requires manual entry one by one. For bulk imports, contact developer.

## Troubleshooting

### Instructor Can't Log In
1. Check `is_active` is `true`
2. Verify email is correct
3. Check if password reset email was sent (system sends automatically)

### Photo Not Displaying
1. Check file size (< 5MB)
2. Check file type (JPG, PNG supported)
3. Try re-uploading

### Instructor Not on Public Team Page
1. Check `display_on_team` is `true`
2. Check `is_active` is `true`
3. Contact developer to verify database settings

## Data Structure Reference

### Instructor Profile Fields
- `full_name` - Display name
- `email` - Login email (unique)
- `title` - Job title
- `bio` - Biography text
- `phone` - Contact number
- `avatar_url` - Photo URL
- `is_active` - Can log in (true/false)
- `display_on_team` - Show on public page (true/false)
- `display_order` - Sort order (0, 1, 2...)
- `credentials` - Array of certifications
- `pay_rate_cents` - Pay in cents (2500 = $25.00)
- `employment_type` - hourly/salary/contractor

### Database Tables Used
- `profiles` - Instructor profile data
- `user_roles` - Links users to "instructor" role
- `auth.users` - Authentication (managed by Supabase)

## Support

For issues not covered in this guide:
1. **Technical problems**: Contact developer
2. **Data updates needed**: Contact developer for database changes
3. **Feature requests**: Submit via development team

---

*Last Updated: December 2025*
*System Version: I Can Swim Beta*