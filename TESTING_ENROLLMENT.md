# Testing Enrollment and Signup Flow

This document provides instructions for testing the enrollment and signup flow for I Can Swim.

## Test Environment Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   Server runs on: http://localhost:3001 (or 3000 if available)

2. **Ensure Supabase is configured:**
   - Check `.env.local` has correct Supabase credentials
   - Database should have the core tables (profiles, swimmers, etc.)

## Manual Test Steps

### Test 1: New User Signup

1. Navigate to http://localhost:3001/signup
2. Fill out the signup form:
   - Full Name: `Test Parent`
   - Email: `test-parent-{timestamp}@example.com` (use unique email)
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
   - Check "I agree to the Terms of Service and Privacy Policy"
3. Click "Create Account"
4. **Expected Result:** Redirected to `/dashboard` or `/parent` dashboard

### Test 2: Login with Existing Test User

1. Navigate to http://localhost:3001/login
2. Use test credentials:
   - Email: `test-free@example.com`
   - Password: `TestPassword123!`
3. Click "Sign In"
4. **Expected Result:** Redirected to authenticated page

### Test 3: Enroll a New Swimmer (Private Pay)

**Prerequisite:** Logged in as parent user

1. Navigate to http://localhost:3001/enroll/private
2. Complete the 7-section enrollment form:

   **Section 1: Parent Information**
   - Parent Name: `Test Parent`
   - Parent Email: `test-parent@example.com`
   - Parent Phone: `555-123-4567`
   - Address: `123 Test St, Test City, CA 95382`

   **Section 2: Child Information**
   - First Name: `Test`
   - Last Name: `Swimmer`
   - Date of Birth: `2020-01-15`
   - Gender: `Male`

   **Section 3: Medical & Safety Information**
   - Accept all defaults (all "No")

   **Section 4: Behavioral Information**
   - Accept all defaults (all "No")

   **Section 5: Swimming Background**
   - Comfortable in Water: `Somewhat`
   - Swim Goals: Select at least one (e.g., "Water Safety")

   **Section 6: Scheduling & Availability**
   - Preferred Location: `Either`
   - Availability: Select at least one time slot

   **Section 7: Consent & Agreement**
   - Check all agreement boxes
   - Emergency Contact: `Emergency Contact (555-987-6543, Grandparent)`

3. Click "Submit Enrollment"
4. **Expected Result:** Success message, swimmer created with `enrollment_status: 'pending_enrollment'`

### Test 4: Verify Swimmer in Parent Dashboard

1. Navigate to http://localhost:3001/parent
2. Click "My Swimmers" or navigate to `/parent/swimmers`
3. **Expected Result:** See enrolled swimmer in list with "Pending Enrollment" status

## Automated Tests

We have created Playwright tests in `tests/enrollment/`:

### Files Created:
1. `enrollment-flow.spec.ts` - Comprehensive enrollment flow tests
2. `signup-smoke.spec.ts` - Basic signup page tests
3. `utils/enrollment-helpers.ts` - Helper functions for enrollment tests

### Running Tests:
```bash
# Run all enrollment tests
BASE_URL=http://localhost:3001 npx playwright test tests/enrollment/

# Run specific test file
BASE_URL=http://localhost:3001 npx playwright test tests/enrollment/signup-smoke.spec.ts

# Run with visible browser
BASE_URL=http://localhost:3001 npx playwright test tests/enrollment/ --headed
```

### Test Data:
Test users are defined in `tests/utils/auth-helpers.ts`:
```typescript
export const TEST_USERS = {
  free: { email: 'test-free@example.com', password: 'TestPassword123!' },
  // ... other users
};
```

**Note:** These test users need to exist in your Supabase database with proper profiles and 'parent' role in `user_roles` table.

## Database Requirements for Testing

For automated tests to work, ensure your database has:

1. **Test users** in `auth.users` table
2. Corresponding **profiles** in `profiles` table
3. **User roles** in `user_roles` table with 'parent' role

You can create test users manually via:
- Supabase Dashboard → Authentication → Users
- Or via SQL:
  ```sql
  -- Create test user (password: TestPassword123!)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'test-free@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    now(),
    now(),
    now()
  ) ON CONFLICT (email) DO NOTHING;

  -- Then create profile and user_role records
  ```

## Common Issues & Solutions

1. **Login fails in tests**: Test users don't exist in database
2. **Checkbox interaction fails**: Use `page.locator('input[name="termsAccepted"]').click()` instead of `.check()`
3. **Multiple element matches**: Use more specific selectors like `page.getByRole('heading', { name: 'Create Account' })`
4. **Port conflicts**: Server runs on 3001 if 3000 is occupied

## Next Steps for Test Improvement

1. **Create database seeding script** for test users
2. **Fix checkbox interaction** in Playwright tests
3. **Add test cleanup** to delete test data after tests
4. **Configure CI/CD** to run tests automatically

## Verification Checklist

- [ ] Signup page loads correctly
- [ ] New user can sign up successfully
- [ ] Existing user can log in
- [ ] Enrollment form loads for authenticated users
- [ ] Enrollment form validates required fields
- [ ] Swimmer can be successfully enrolled
- [ ] Enrolled swimmer appears in parent dashboard
- [ ] Unauthenticated users redirected to login when accessing `/enroll/private`