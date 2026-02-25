# RLS Test Suite

Comprehensive test suite for Row-Level Security (RLS) policies in the I Can Swim application.

## Overview

This test suite verifies that RLS policies correctly enforce data access controls for different user roles:

- **Parent**: Can only see own swimmers and shared progress notes
- **Coordinator**: Can only see assigned swimmers and their purchase orders
- **Instructor**: Can see all swimmers and their own progress notes
- **Admin**: Has full access to all data

## Test Files

### 1. `rls-basic.spec.ts`
**Basic API-level RLS tests** that verify:
- Authentication requirements for protected APIs
- Role-based access to different API endpoints
- Cross-role access restrictions
- Error handling for invalid/expired tokens

**Usage:**
```bash
npm run test:e2e tests/rls/rls-basic.spec.ts
```

### 2. `rls-authorization.spec.ts`
**Comprehensive database-level RLS tests** that verify:
- Direct database access with different user roles
- Complex data relationships and foreign key constraints
- Edge cases (orphaned records, role transitions)
- Purchase order access for coordinators
- Progress note sharing between parents and instructors

**Note:** This test requires test user setup and may need environment configuration.

### 3. `rls-test-helpers.ts`
**Test utilities** for:
- Creating test users with specific roles
- Setting up test data (swimmers, progress notes, purchase orders)
- Cleaning up test data after tests
- Running RLS test scenarios programmatically

## Test Data Requirements

### Test Users
The test suite requires test users for each role. These can be created:

1. **Manually** in the Supabase dashboard
2. **Programmatically** using the test helpers (requires service role key)

### Test User Credentials
Update `rls-basic.spec.ts` with actual test user credentials:

```typescript
const testUsers = {
  parent: {
    email: 'test-parent@example.com',    // ← Update with real test user
    password: 'TestPassword123!'
  },
  // ... other roles
};
```

## Running Tests

### Basic Tests (Recommended)
```bash
# Run basic RLS tests
npm run test:e2e tests/rls/rls-basic.spec.ts

# Run with UI
npm run test:e2e:ui tests/rls/rls-basic.spec.ts

# Run in headed mode for debugging
npm run test:e2e:headed tests/rls/rls-basic.spec.ts
```

### Comprehensive Tests (Advanced)
```bash
# Run comprehensive RLS tests
npm run test:e2e tests/rls/rls-authorization.spec.ts
```

## Test Coverage

### Authentication & Authorization
- [x] Unauthenticated users cannot access protected APIs
- [x] Each role can access appropriate APIs
- [x] Roles cannot access unauthorized APIs
- [x] Invalid/expired tokens are rejected

### Parent Role
- [x] Can access `/api/swimmers` (own swimmers only)
- [x] Cannot access `/api/admin/swimmers`
- [x] Can see shared progress notes via `/api/progress-notes`

### Coordinator Role
- [x] Can access `/api/pos` (assigned swimmers only)
- [x] Cannot access `/api/admin/swimmers`
- [x] Cannot access other parent's data

### Instructor Role
- [x] Can access `/api/instructor/swimmers`
- [x] Can access `/api/progress-notes` (own notes)
- [x] Can see all swimmers (no assignment restriction)

### Admin Role
- [x] Can access all admin APIs (`/api/admin/*`)
- [x] Can access all bookings (`/api/bookings`)
- [x] Has full data access

### Data Isolation
- [x] Parents cannot see other parents' swimmers
- [x] Coordinators cannot see unassigned swimmers' POs
- [x] Progress notes respect `shared_with_parent` flag
- [x] Role boundaries are enforced

## Environment Setup

### Required Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Optional (for programmatic test setup)
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Test Maintenance

### Adding New Tests
1. Add test cases to `rls-basic.spec.ts` for API-level tests
2. Add comprehensive scenarios to `rls-authorization.spec.ts` for database tests
3. Update test helpers in `rls-test-helpers.ts` if new utilities are needed

### Updating Test Data
1. Update test user credentials in `rls-basic.spec.ts`
2. Modify test data setup in `rls-test-helpers.ts`
3. Run tests to verify changes

### Troubleshooting
- **401 Errors**: Check test user credentials and JWT tokens
- **403 Errors**: Verify user roles are correctly assigned
- **Database Errors**: Check foreign key constraints and test data cleanup
- **Timeout Errors**: Increase test timeout or check network connectivity

## Integration with CI/CD

Add to your CI pipeline:
```yaml
- name: Run RLS Tests
  run: npm run test:e2e tests/rls/rls-basic.spec.ts --reporter=line
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Security Considerations

1. **Test Data Isolation**: Tests should not affect production data
2. **Cleanup**: Test data should be cleaned up after tests
3. **Credentials**: Test user credentials should not be committed to git
4. **Permissions**: Test users should have minimal necessary permissions

## Related Documentation

- [RLS Audit Report](../RLS_AUDIT_REPORT.md)
- [RLS Prioritized Fixes](../RLS_PRIORITIZED_FIXES.md)
- [RLS API Alignment](../RLS_API_ALIGNMENT.md)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)