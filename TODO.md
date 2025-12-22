# I Can Swim - Development To-Do List

*Last Updated: December 21, 2025*

---

## 🔴 Critical Gaps (Need Fixing)

### 1. Parent Account Linking Gap
- **Issue**: Parent completes enrollment but doesn't get prompted to create account
- **Impact**: Swimmers created without parent link, parents can't access or book lessons
- **Current state**:
  - ✅ Parent info captured in referrals
  - ✅ Parent invitation email with token link
  - ✅ Parent can complete enrollment form
  - ❌ No parent account creation prompt
  - ❌ parent_id can be null on swimmers
  - ❌ No "claim my swimmer" flow
  - ❌ No parent_invitations tracking table
- **Fixes needed**:
  - [ ] Add parent account creation to enrollment completion flow
  - [ ] Create `parent_invitations` table for tracking
  - [ ] Update `parent_id` when parent creates account with matching email
  - [ ] Add "Claim My Swimmer" functionality for existing parents
  - [ ] Add invitation status tracking (sent, claimed, expired)
- **Status**: 🔴 Not Started
- **Effort**: 6-8 hours

---

## 🟡 High Priority Features

### 2. Skills Tracking on Dashboard (Admin & Instructor)
- **Location**: Admin Dashboard + Instructor Dashboard
- **Feature**: Card showing swimmers who need progress/skills updated after sessions
- **Components needed**:
  - [ ] "Needs Progress Update" card on dashboard
  - [ ] Shows swimmers from today's completed sessions
  - [ ] "Update Progress" button for each swimmer
  - [ ] Skills tracker modal/drawer:
    - [ ] Shows swimmer's current level and photo
    - [ ] Checklist of skills for that level
    - [ ] Toggle: Not Started → In Progress → Mastered
    - [ ] Option to advance swimmer to next level
    - [ ] Notes field for instructor comments
    - [ ] Submit button
  - [ ] After submission:
    - [ ] Updates `swimmer_skills` table
    - [ ] Creates `progress_notes` record
    - [ ] Removes swimmer from "needs update" list
    - [ ] Button disappears until next completed session
- **Who sees it**:
  - Admin: All swimmers needing updates from today
  - Instructor: Only swimmers from their completed sessions today
- **Database tables**:
  - `swimmer_skills` (status: not_started/in_progress/mastered)
  - `progress_notes`
  - `swim_levels`
  - `skills`
  - `sessions` (to check completed sessions)
- **Status**: 🔴 Not Started
- **Effort**: 6-8 hours

### 3. Instructor Dashboard UI Update
- **Current**: Basic layout, no sidebar
- **Needs**:
  - [ ] Collapsible sidebar (like admin)
  - [ ] Today's schedule view with session cards
  - [ ] Quick actions (mark attendance, add progress note)
  - [ ] "Needs Progress Update" card (from #2 above)
  - [ ] Upcoming sessions this week
  - [ ] My swimmers list
  - [ ] Notifications panel
  - [ ] Timecard quick entry (future)
- **Status**: 🔴 Not Started
- **Effort**: 4-6 hours

### 4. Coordinator Dashboard UI Update
- **Current**: Only POS page, no dashboard
- **Needs**:
  - [ ] Collapsible sidebar (like admin)
  - [ ] Dashboard with KPIs:
    - [ ] Pending referrals count
    - [ ] POs needing approval
    - [ ] Active clients count
  - [ ] My assigned swimmers list (using new coordinator_id)
  - [ ] Quick actions
  - [ ] Recent activity feed
- **Status**: 🔴 Not Started
- **Effort**: 4-6 hours

### 5. Instructor Timecards
- **For Instructors**:
  - [ ] Clock in/out functionality
  - [ ] View weekly hours
  - [ ] Submit timecard for approval
  - [ ] View past timecards
- **For Admin**:
  - [ ] View all instructor hours
  - [ ] Approve/reject timecards
  - [ ] Generate payroll reports
  - [ ] Edit timecard entries
- **Database tables needed**:
  - `timecards` (id, instructor_id, week_start, status, submitted_at, approved_at, approved_by)
  - `timecard_entries` (id, timecard_id, date, clock_in, clock_out, break_minutes, notes)
- **Status**: 🔴 Not Started
- **Effort**: 8-10 hours

### 6. Admin Reports Page
- **Location**: `src/app/admin/reports/page.tsx`
- **Reports needed**:
  - [ ] Revenue report (by date range, payment type)
  - [ ] Session utilization (booked vs available)
  - [ ] Instructor performance (lessons taught, attendance rate)
  - [ ] Swimmer progress (level advancement over time)
  - [ ] PO status summary (by funding source)
  - [ ] Cancellation report
- **Features**:
  - [ ] Date range picker
  - [ ] Export to CSV/PDF
  - [ ] Charts and visualizations
- **Status**: 🔴 Not Started
- **Effort**: 6-8 hours

---

## 🟢 Medium Priority

### 7. Airtable Data Migration
- **Current data in Airtable**: 26 tables
- **Steps**:
  - [ ] Map Airtable fields to Supabase schema
  - [ ] Create migration scripts
  - [ ] Test with sample data
  - [ ] Full migration
  - [ ] Verify data integrity
  - [ ] Link migrated swimmers to users
- **Status**: 🔴 Not Started
- **Effort**: 8-12 hours

### 8. Testing (Playwright E2E)
- **Critical flows to test**:
  - [ ] Login/logout for all roles
  - [ ] Book assessment (private pay)
  - [ ] Book assessment (funded with PO)
  - [ ] Complete assessment and assign level
  - [ ] Book weekly lessons
  - [ ] Cancel booking (24hr rule)
  - [ ] PO approval workflow
  - [ ] Progress note creation
  - [ ] Skills tracking update
- **Status**: 🔴 Not Started
- **Effort**: 8-12 hours

---

## ✅ Recently Completed

- [x] Admin sidebar navigation (collapsible, all pages)
- [x] Admin dashboard with clickable KPI cards
- [x] POS Management page with approval workflow
- [x] User Management page with role management
- [x] Coordinator ID linking (database + referral flow)
- [x] Swimmer linking to parents (User Management)
- [x] Transfer Client feature (coordinator changes)
- [x] Dashboard role-based redirect
- [x] Session Generator restored with time options (8am-7pm, 15-min)
- [x] Swimmer Management - removed exclusion message
- [x] Remove .next from git tracking
- [x] Stub email notifications (Resend)
- [x] **VMRC → Generic Funding Source Migration (Complete)**
  - Database: Updated column names from `vmrc_*` to generic `funding_*` and `authorized_*`
  - Code: Updated all API routes, services, and hooks to use new column names
  - UI: Replaced all hardcoded "VMRC" strings with "Funded" / "Funding Source" terminology
  - Types: Updated TypeScript interfaces and payment_type enum from 'vmrc' to 'funded'
- [x] **User roles fixed to use user_roles table**
- [x] **Booking flow improvements**
  - Instructor selection functionality
  - Waitlist assessment rule implementation
  - Calendly-style time slot selection
- [x] **SESSION holds and conflict detection**
- [x] **Email confirmations system**

---

## 📋 Quick Reference

### File Locations
- Admin pages: `src/app/admin/`
- Instructor pages: `src/app/instructor/`
- Coordinator pages: `src/app/coordinator/`
- Parent pages: `src/app/parent/`
- API routes: `src/app/api/`
- Components: `src/components/`

### Key Database Tables
- `swimmers` - Client records with parent_id, coordinator_id
- `profiles` - User accounts with roles
- `sessions` - Lesson time slots
- `bookings` - Session reservations
- `purchase_orders` - Funding authorizations
- `progress_notes` - Lesson documentation
- `swimmer_skills` - Skill tracking per swimmer
- `swim_levels` / `skills` - Level progression system

### Suggested Order of Work
1. Parent Account Linking Gap (critical for new clients)
2. Skills Tracking Dashboard Card
3. Instructor Dashboard UI
4. Coordinator Dashboard UI
5. Airtable Migration (get real data in)
6. Timecards
7. Reports
8. Testing