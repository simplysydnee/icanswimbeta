# Assessment Swimmer Selection Fix

## Problem
Users were unable to complete assessments and select swimmers because the system only showed swimmers with **scheduled assessment bookings for today**. This was too restrictive for practical use.

## Root Cause
The `BasicInfoStep` component in the assessment wizard only fetched swimmers from `/api/assessments/scheduled`, which queries the `bookings` table with:
- `session_type = 'assessment'`
- `status = 'confirmed'`
- Today's date only

## Solution Implemented
Modified the `BasicInfoStep` component to include two swimmer selection methods:

### 1. Scheduled Assessments (Existing Functionality)
- Shows swimmers with scheduled assessments for today
- Convenient for poolside assessments where swimmers are already scheduled
- Preserved as the default view

### 2. Search All Swimmers (New Functionality)
- Allows searching for any swimmer in the system
- Searches by first name or last name
- Shows swimmers with enrollment status: `enrolled`, `approved`, `pending`, or `waitlist`
- Displays swimmer details including enrollment status and payment type

## Technical Changes

### File Modified
- `src/components/assessments/steps/BasicInfoStep.tsx`

### Key Changes:
1. **Added new interfaces**:
   - `ScheduledSwimmer` (existing functionality)
   - `SearchSwimmer` (new search functionality)

2. **Added state variables**:
   - `scheduledSwimmers`: List of swimmers with scheduled assessments
   - `searchSwimmers`: List of swimmers from search results
   - `searchQuery`: Current search term
   - `selectedSwimmer`: Currently selected swimmer from search
   - `showSearch`: Toggle between scheduled and search views

3. **Added search functionality**:
   - `performSwimmerSearch()`: Searches swimmers table using Supabase
   - `handleSearch()`: Handles search input changes
   - `handleSelectSwimmer()`: Handles swimmer selection from search results

4. **Updated UI**:
   - Added toggle buttons between "Scheduled Assessments" and "Search All Swimmers"
   - Search input with real-time results
   - Selected swimmer preview with details
   - Helper functions for status colors and payment type labels

## User Experience

### Before:
- Only swimmers with scheduled assessments for today could be selected
- If no scheduled assessments, users couldn't complete assessments
- Message: "No swimmers have scheduled assessments today. Please schedule an assessment first."

### After:
- **Option 1**: Select from scheduled assessments (default)
- **Option 2**: Search and select any swimmer in the system
- If no scheduled assessments, helpful message: "No swimmers have scheduled assessments today. Use 'Search All Swimmers' to find and assess any swimmer."

## Database Queries

### Scheduled Swimmers Query (Existing):
```sql
SELECT bookings with:
- session_type = 'assessment'
- status = 'confirmed'
- today's date
- Ordered by start_time
```

### Swimmer Search Query (New):
```sql
SELECT swimmers with:
- first_name ILIKE %query% OR last_name ILIKE %query%
- enrollment_status IN ('enrolled', 'approved', 'pending', 'waitlist')
- Limit 10 results
- Includes parent email and full name
```

## Testing Considerations

1. **Scheduled Assessments View**:
   - Verify swimmers with today's assessment bookings appear
   - Verify loading state works correctly
   - Verify empty state message appears when no scheduled assessments

2. **Search All Swimmers View**:
   - Verify search input works with 2+ characters
   - Verify search results show swimmer details
   - Verify swimmer selection updates the form
   - Verify "Change" button clears selection

3. **Toggle Functionality**:
   - Verify toggle between views works
   - Verify selection persists when toggling back
   - Verify search state is preserved

## Migration Notes
No database changes required. The fix only modifies the frontend component to provide additional search capabilities while preserving existing functionality.

## Future Enhancements
1. Add filters to search (enrollment status, payment type, etc.)
2. Add ability to create new swimmers directly from assessment wizard
3. Add swimmer photos to search results
4. Add recent assessments history for selected swimmers