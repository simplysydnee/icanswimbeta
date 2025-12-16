# Instructor Login & Progress Update Workflow Testing

This document summarizes the instructor testing setup created for the I Can Swim application.

## Created Test Resources

### 1. Instructor Test User
- **Email**: `instructor@test.com`
- **Password**: `TestPassword123!`
- **Name**: Test Instructor
- **Title**: Senior Swim Instructor
- **Phone**: 555-123-4567
- **Bio**: Certified swim instructor with 5+ years of experience teaching adaptive swim lessons for children with special needs. Specializes in water safety and building confidence in the water.
- **Role**: `instructor` (also has `parent` role for testing flexibility)

### 2. Test Data for Progress Update Workflow
- **Swimmer**: Test Swimmer (born 2020-01-01)
- **Session**: Tomorrow at 10:00 AM at "Test Location"
- **Booking**: Links swimmer to session
- **Progress Note**: Sample progress note created
- **Swim Levels**: White, Red, Yellow, Green, Blue levels created if not existing

## Files Created

### 1. `create-instructor-user.js`
Creates the instructor test user in Supabase Auth and sets up the profile.

**Usage:**
```bash
node create-instructor-user.js
```

**Notes:**
- Uses anon key for authentication
- May show RLS policy warnings (expected)
- Provides manual SQL commands if automatic creation fails

### 2. `create-simple-progress-test.js`
Creates minimal test data for progress update workflow testing.

**Usage:**
```bash
node create-simple-progress-test.js
```

**Creates:**
- Simple swimmer record
- Session for tomorrow
- Booking linking swimmer to session
- Sample progress note

### 3. `test-instructor-login.js`
Tests the instructor login and verifies access to instructor-specific resources.

**Usage:**
```bash
node test-instructor-login.js
```

**Tests:**
- Authentication with instructor credentials
- Profile existence and data
- Role assignment (instructor role)
- Session access
- Progress notes access

### 4. `create-progress-test-data.js` (Advanced)
More comprehensive test data creation (may have schema compatibility issues).

## Testing the Progress Update Workflow

### Step 1: Start the Development Server
```bash
npm run dev
```
The app should be accessible at `http://localhost:3000` (or your configured port).

### Step 2: Log In as Instructor
1. Navigate to `/login`
2. Use credentials:
   - **Email**: `instructor@test.com`
   - **Password**: `TestPassword123!`

### Step 3: Access Instructor Features
1. **Dashboard**: Navigate to `/instructor/progress`
   - Should show today's/tomorrow's sessions
   - Should display "Test Swimmer" in session list

2. **Session Management**: Click on a session to:
   - View swimmer details
   - Add/update progress notes
   - Track skills worked on/mastered
   - Mark attendance

3. **Progress Notes**:
   - Create new progress notes for sessions
   - Update existing notes
   - Share notes with parents
   - Track swimmer mood, water comfort, focus level

### Step 4: Test Key Functionality
1. **Skill Tracking**:
   - Mark skills as "in progress", "mastered", or "not started"
   - Test automatic level promotion when all skills at a level are mastered

2. **Attendance Recording**:
   - Mark swimmers as present, absent, or late
   - Test attendance status updates

3. **Parent Communication**:
   - Toggle "shared_with_parent" on progress notes
   - Test parent-facing vs instructor-only notes

4. **Session Management**:
   - View weekly schedule
   - Check session capacity and booking status

## Database Schema Notes

### Key Tables for Progress Workflow:
1. **`profiles`**: User profiles with instructor-specific columns (`title`, `bio`, `is_active`)
2. **`user_roles`**: Role assignments (`instructor`, `parent`, `admin`, `vmrc_coordinator`)
3. **`swimmers`**: Swimmer data with medical, behavioral, and progress information
4. **`sessions`**: Lesson/assessment sessions with instructor assignment
5. **`bookings`**: Links swimmers to sessions
6. **`progress_notes`**: Post-lesson documentation by instructors
7. **`swim_levels`**: Progression system (White, Red, Yellow, Green, Blue)
8. **`skills`**: Skills for each level
9. **`swimmer_skills`**: Tracks skill mastery per swimmer

### RLS Policies:
- Instructors can view/update their own progress notes
- Instructors can view/update swimmer skills for swimmers they teach
- Automatic level promotion when all skills at a level are mastered

## Troubleshooting

### Common Issues:

1. **"Invalid login credentials"**
   - Run `create-instructor-user.js` to create the user
   - Check if email is confirmed in Supabase Dashboard

2. **"No sessions found"**
   - Run `create-simple-progress-test.js` to create test data
   - Check session date (session is created for tomorrow)

3. **RLS Policy Errors**
   - Use service role key for admin operations
   - Check `user_roles` table for instructor role assignment

4. **Missing Columns**
   - Ensure migrations have been applied
   - Check `supabase/migrations/` for schema updates

### Manual SQL Commands (if needed):

```sql
-- Create instructor profile
INSERT INTO profiles (id, email, full_name, phone, title, bio, is_active)
VALUES ('1e8eb152-6b26-4b22-b774-751cce7892c3', 'instructor@test.com', 'Test Instructor', '555-123-4567', 'Senior Swim Instructor', 'Certified swim instructor with 5+ years of experience...', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  title = EXCLUDED.title,
  bio = EXCLUDED.bio,
  is_active = EXCLUDED.is_active;

-- Assign instructor role
INSERT INTO user_roles (user_id, role)
VALUES ('1e8eb152-6b26-4b22-b774-751cce7892c3', 'instructor')
ON CONFLICT DO NOTHING;
```

## Next Steps for Testing

1. **Comprehensive Workflow Testing**:
   - Create progress note for a session
   - Mark skills as mastered
   - Verify automatic level promotion
   - Share progress note with parent
   - Test parent view of shared notes

2. **Edge Cases**:
   - Cancelled sessions
   - No-show swimmers
   - Multiple swimmers per session
   - Skill regression tracking

3. **Integration Testing**:
   - Instructor ↔ Parent communication
   - Progress note email notifications
   - Mobile responsiveness
   - Accessibility testing

## Security Notes

- Instructor can only access their own sessions and progress notes
- Parent notes are separate from instructor-only notes
- RLS policies enforce data isolation
- Service role key should be kept secure and not used in client-side code

---

**Last Updated**: 2025-12-15
**Test Status**: ✅ Instructor login and basic progress workflow tested successfully