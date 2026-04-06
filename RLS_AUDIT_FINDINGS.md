# RLS & Function Audit Report
## I Can Swim Database - March 5, 2026

## Executive Summary

Audit of RLS policies and database functions revealed 7 critical issues, primarily caused by migration file conflicts where a comprehensive migration (`20260226150000_fix_all_public_policies_to_authenticated.sql`) overwrote corrected policies from earlier migrations. Created 6 fix migration files to address security vulnerabilities and access control issues.

## Issues Found & Fixes

### 1. Coordinator access on swimmers is broken
**Root Cause**: Policy bundles coordinator + admin + parent into one PERMISSIVE policy using OR. No INSERT/UPDATE/DELETE policies for coordinators.
**Location**: `20260226160000_fix_swimmers_rls_recursion.sql`
**Fix**: `fix_rls_coordinator_swimmers.sql` - Creates separate, scoped policies for coordinators
**Test**: `SELECT * FROM swimmers WHERE coordinator_id = '2d8d4f3f-13a6-463b-b5e8-53a5284099ec';`

### 2. Coordinator access on purchase_orders uses wrong join
**Root Cause**: Policy uses `swimmer_instructor_assignments` join instead of `coordinator_has_swimmer_access()` or direct `swimmers.coordinator_id` check.
**Location**: `20260226150000_fix_all_public_policies_to_authenticated.sql` (overwrote corrected policy from `20260225092827_create_coordinator_has_swimmer_access_function.sql`)
**Fix**: `fix_rls_coordinator_purchase_orders.sql` - Uses `coordinator_has_swimmer_access()` function
**Test**: `SELECT po.* FROM purchase_orders po JOIN swimmers s ON po.swimmer_id = s.id WHERE s.coordinator_id = '2d8d4f3f-13a6-463b-b5e8-53a5284099ec';`

### 3. Bookings table has same wrong coordinator join
**Root Cause**: Same issue as #2 - wrong `swimmer_instructor_assignments` join.
**Location**: `20260226150000_fix_all_public_policies_to_authenticated.sql` (overwrote corrected policy from `20260225093030_add_coordinator_access_policies.sql`)
**Fix**: `fix_rls_coordinator_bookings.sql` - Uses `coordinator_has_swimmer_access()` function
**Test**: `SELECT b.* FROM bookings b JOIN swimmers s ON b.swimmer_id = s.id WHERE s.coordinator_id = '2d8d4f3f-13a6-463b-b5e8-53a5284099ec';`

### 4. Progress notes: parents can see internal notes
**Root Cause**: Parent branch missing `AND shared_with_parent = true` filter. Coordinator branch uses wrong join.
**Location**: `20260226150000_fix_all_public_policies_to_authenticated.sql` (overwrote corrected policy from `20260225093030_add_coordinator_access_policies.sql`)
**Fix**: `fix_rls_progress_notes_parent_filter.sql` - Adds `shared_with_parent = true` filter for parents, fixes coordinator join
**Test**: `SELECT pn.* FROM progress_notes pn JOIN swimmers s ON pn.swimmer_id = s.id WHERE s.parent_id = '9b8a4ba0-dbd1-4eaa-9d42-bb54fb870f49' AND pn.shared_with_parent = true;`

### 5. swimmer_targets and swimmer_strategies are open to all instructors
**Root Cause**: Duplicate SELECT policies - one with proper `swimmer_instructor_assignments` check, one with `USING (true)` allowing ANY authenticated user.
**Location**: `20260226150000_fix_all_public_policies_to_authenticated.sql`
**Fix**: `fix_rls_targets_strategies_scope.sql` - Removes `USING (true)` policies
**Test**: Instructors should only see targets/strategies for swimmers they're assigned to via `swimmer_instructor_assignments`

### 6. check_pos_renewal_needed() trigger hardcodes 12 sessions
**Root Cause**: Function not found in migration files (may exist only in live database). Hardcodes `sessions_authorized = 12` instead of calculating remaining sessions.
**Location**: Unknown - not in codebase
**Fix**: `fix_trigger_pos_renewal_sessions.sql` - Requires business decision (remove auto-creation or fix calculation)
**Recommendation**: Remove auto-creation for manual control

### 7. has_role vs has_role_2 function duplication
**Root Cause**: `has_role_2` mentioned in prompt but not found in codebase. `has_role` used in most policies.
**Location**: Unknown - functions not in migration files
**Fix**: Standardize on `has_role()` function. Check live database for duplicate functions.

## Migration File Conflicts

The primary issue is timestamp ordering:
1. `20260225092827_create_coordinator_has_swimmer_access_function.sql` (Feb 25, 09:28) - CORRECT policies
2. `20260225093030_add_coordinator_access_policies.sql` (Feb 25, 09:30) - CORRECT policies
3. `20260226150000_fix_all_public_policies_to_authenticated.sql` (Feb 26, 15:00) - WRONG policies (overwrites corrections)

## Test Accounts for Verification

- Coordinator: `anas.coordinator@icanswim.com` | user_id: `2d8d4f3f-13a6-463b-b5e8-53a5284099ec`
- Parent (private pay): `anas.parent@icanswim209.com` | user_id: `9b8a4ba0-dbd1-4eaa-9d42-bb54fb870f49`
- Parent (funded): `anas.parent-vmrc@icanswim.com` | user_id: `a19a5052-9d19-4200-a3b2-77401fe69e0a`
- Instructor: `anas.instructor@icanswim.com`
- All passwords: `TestICS2025!`

## Recommended Deployment Order

1. **Immediate fixes** (Issues 1-5): Apply migration files 1-5
2. **Business decision** (Issue 6): Consult Sydnee/Taylor on PO renewal approach
3. **Function audit** (Issue 7): Check live database for `has_role` vs `has_role_2`

## Security Impact

- **High**: Parents can view internal progress notes (Issue 4)
- **High**: Any authenticated user can view all swimmer targets/strategies (Issue 5)
- **Medium**: Coordinators cannot access their assigned data (Issues 1-3)
- **Medium**: Incorrect PO renewal calculations (Issue 6)

## Files Created

1. `fix_rls_coordinator_swimmers.sql`
2. `fix_rls_coordinator_purchase_orders.sql`
3. `fix_rls_coordinator_bookings.sql`
4. `fix_rls_progress_notes_parent_filter.sql`
5. `fix_rls_targets_strategies_scope.sql`
6. `fix_trigger_pos_renewal_sessions.sql` (placeholder - needs business decision)

## Next Steps

1. Apply migrations 1-5 to production
2. Test with coordinator/parent/instructor test accounts
3. Decide on PO renewal approach (Issue 6)
4. Audit live database functions (Issue 7)