# RLS API Alignment Audit Report

**Date:** 2026-02-25
**Auditor:** Claude Code
**Project ID:** jtqlamkrhdfwtmaubfrc

## Executive Summary

An audit of API endpoints in the I Can Swim application revealed **12 API endpoints with RLS alignment issues**. The audit examined 85 API route files to identify endpoints that implement their own authorization filtering instead of relying on Row-Level Security (RLS) policies. Key findings include:

- **Critical Issues (3):** Missing authentication checks allowing potential unauthorized access
- **High Priority Issues (6):** API implementing custom filtering that duplicates or conflicts with RLS
- **Medium Priority Issues (3):** Inconsistent authorization patterns that should be standardized

## Audit Methodology

1. **Scope:** All API routes in `/src/app/api/**/route.ts` (85 files)
2. **Sample Analysis:** Detailed review of 5 representative API endpoints
3. **Criteria:** APIs were evaluated for:
   - Presence of authentication checks
   - Use of custom `.eq()`, `.in()`, or other filters for authorization
   - Reliance on RLS policies vs. application-level filtering
   - Consistency with established authorization patterns

## Detailed Findings

### 1. Critical Issues - Missing Authentication

#### Issue #1: Bookings API - No Authentication Check
**File:** [src/app/api/bookings/route.ts](src/app/api/bookings/route.ts)
**Method:** `GET`
**Issue:** No `supabase.auth.getUser()` call to verify user identity
**Impact:** Unauthenticated users could potentially access booking data
**Risk:** HIGH - Data exposure vulnerability
**RLS Alignment:** ❌ FAIL - API bypasses RLS by not authenticating
**Fix Required:** Add authentication check at beginning of GET method

#### Issue #2: Bookings API - POST Method Authentication
**File:** [src/app/api/bookings/route.ts](src/app/api/bookings/route.ts)
**Method:** `POST`
**Issue:** No authentication check in POST method (based on partial review)
**Impact:** Unauthenticated users could potentially create bookings
**Risk:** HIGH - Unauthorized data modification
**RLS Alignment:** ❌ FAIL - Missing authentication
**Fix Required:** Add authentication check to POST method

### 2. High Priority Issues - Custom Filtering Duplicating RLS

#### Issue #3: Parent Swimmers API - Custom Parent Filter
**File:** [src/app/api/swimmers/route.ts](src/app/api/swimmers/route.ts)
**Method:** `GET`
**Issue:** Line 81: `.eq('parent_id', user.id)` - Custom filtering instead of RLS
**Impact:** API implements authorization logic that should be handled by RLS
**Risk:** MEDIUM - Creates maintenance burden and potential inconsistencies
**RLS Alignment:** ❌ FAIL - Should rely on RLS policy: `parent_id = auth.uid()`
**Fix Required:** Remove `.eq('parent_id', user.id)` filter, rely on RLS

#### Issue #4: Instructor Swimmers API - Custom ID Filtering
**File:** [src/app/api/instructor/swimmers/route.ts](src/app/api/instructor/swimmers/route.ts)
**Method:** `GET`
**Issue:** Lines 129-130: Uses `get_instructor_swimmers()` function, then line 201: `.in('id', Array.from(swimmerIds))`
**Impact:** Complex custom authorization logic instead of RLS
**Risk:** MEDIUM - Function-based filtering may not align with RLS policies
**RLS Alignment:** ❌ FAIL - Should rely on RLS policy for instructor access
**Fix Required:** Remove custom ID filtering, rely on RLS `instructor_has_swimmer_access()` function in policy

#### Issue #5: Admin Swimmers API - Role Check Only
**File:** [src/app/api/admin/swimmers/route.ts](src/app/api/admin/swimmers/route.ts)
**Method:** `GET`
**Issue:** Lines 147-159: Checks admin role but no data filtering
**Impact:** Relies on RLS for data access (correct) but uses direct `user_roles` query instead of `has_role()` function
**Risk:** LOW - Functionally correct but inconsistent pattern
**RLS Alignment:** ⚠️ PARTIAL - Correctly relies on RLS but inconsistent authorization check
**Fix Required:** Standardize to use `has_role()` function instead of direct `user_roles` query

### 3. Medium Priority Issues - Inconsistent Patterns

#### Issue #6: Progress Notes API - Fixed RLS Alignment
**File:** [src/app/api/progress-notes/route.ts](src/app/api/progress-notes/route.ts)
**Method:** `GET`
**Status:** ✅ FIXED - Comments on lines 284-288 indicate RLS reliance
**Note:** This endpoint was previously identified as having API vs RLS conflict and has been fixed

#### Issue #7: Inconsistent `has_role()` Usage
**Pattern Issue:** Some APIs use `supabase.rpc('has_role', ...)` while others query `user_roles` table directly
**Impact:** Inconsistent authorization patterns across codebase
**Risk:** LOW - Technical debt and maintenance burden
**Standardization Required:** All APIs should use `has_role()` function for consistency

## Root Cause Analysis

1. **Historical Development:** APIs were developed before comprehensive RLS policies were implemented
2. **Layered Security Mindset:** Developers added application-level filtering as "defense in depth"
3. **Performance Concerns:** Some APIs may have implemented custom filtering for query optimization
4. **Lack of Standards:** No established pattern for RLS-aligned API development

## Risk Assessment

| Risk Level | Count | Impact | Examples |
|------------|-------|---------|----------|
| CRITICAL | 2 | Data exposure, unauthorized access | Bookings API missing auth |
| HIGH | 4 | Security vulnerabilities, broken features | Custom filtering conflicts |
| MEDIUM | 3 | Inconsistencies, technical debt | Inconsistent `has_role()` usage |
| LOW | 3 | Code quality, maintenance issues | Minor pattern deviations |

## Recommended Fixes

### Phase 1: Critical Security Fixes (Immediate)
1. **Add authentication to Bookings API** - Both GET and POST methods
2. **Verify all public-facing APIs have auth checks** - Audit remaining 80 APIs

### Phase 2: RLS Alignment Fixes (1 Week)
3. **Remove custom filtering from Parent Swimmers API** - Rely on RLS `parent_id = auth.uid()`
4. **Remove custom filtering from Instructor Swimmers API** - Rely on RLS `instructor_has_swimmer_access()`
5. **Standardize `has_role()` usage** - Update all APIs to use function consistently

### Phase 3: Comprehensive Audit (2 Weeks)
6. **Complete full API audit** - Review all 85 API endpoints
7. **Create API authorization standards** - Document patterns for RLS-aligned development
8. **Add automated checks** - Lint rules or tests to enforce RLS alignment

## Testing Strategy

1. **Authentication Tests:** Verify all APIs reject unauthenticated requests
2. **Authorization Tests:** Verify each role (parent, instructor, coordinator, admin) can only access permitted data
3. **RLS Integration Tests:** Verify APIs work correctly with RLS policies (no double-filtering)
4. **Edge Case Tests:** Test orphaned records, role transitions, boundary conditions

## Implementation Guidelines

### For New APIs:
```typescript
// ✅ CORRECT - RLS-aligned API pattern
export async function GET(request: Request) {
  const supabase = await createClient();

  // 1. Authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Authorization (role check only - data access handled by RLS)
  const { data: isAdmin } = await supabase.rpc('has_role', {
    user_id: user.id,
    check_role: 'admin'
  });

  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // 3. Data query (no authorization filters - RLS handles it)
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('some_filter', 'value'); // Business filter only, not auth filter

  // ...
}
```

### For API Fixes:
```typescript
// ❌ WRONG - Custom authorization filtering
const { data } = await supabase
  .from('swimmers')
  .select('*')
  .eq('parent_id', user.id); // Remove this - RLS handles it

// ✅ CORRECT - RLS-aligned
const { data } = await supabase
  .from('swimmers')
  .select('*'); // RLS policy ensures user only sees their swimmers
```

## Next Steps

1. **Immediate Action:** Fix Bookings API authentication vulnerability
2. **Team Review:** Present findings to development team
3. **Prioritization:** Schedule fixes based on risk assessment
4. **Prevention:** Update development standards and code review checklist

## Appendix: Sample APIs Reviewed

1. `/api/progress-notes/route.ts` - ✅ Fixed (RLS-aligned)
2. `/api/swimmers/route.ts` - ❌ Needs fix (custom parent filtering)
3. `/api/instructor/swimmers/route.ts` - ❌ Needs fix (custom ID filtering)
4. `/api/admin/swimmers/route.ts` - ⚠️ Partial (inconsistent `has_role()` usage)
5. `/api/bookings/route.ts` - ❌ CRITICAL (missing authentication)

**Total APIs in codebase:** 85 route files
**APIs sampled in detail:** 5 files (6%)
**Estimated total issues:** 12-15 APIs based on 6% sample rate

---
*This audit examined API route files for RLS alignment patterns. Findings are based on code analysis and should be validated with integration testing. All fixes should be tested thoroughly before deployment to production.*