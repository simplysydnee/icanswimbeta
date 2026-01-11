# Swimmer Status Definitions

## Overview
This document defines the meaning and usage of all swimmer statuses in the I Can Swim application. Proper understanding of these statuses is critical for accurate swimmer management and communication.

## Enrollment Statuses

### Waitlist
- **Display**: "Waitlist" (Yellow background)
- **Meaning**: Swimmer has been approved and is waiting for their initial assessment to be booked and completed.
- **Action Required**: Admin needs to schedule assessment.
- **Next Steps**: Contact parent to schedule assessment appointment.

### Pending Enrollment
- **Display**: "Pending Enrollment" (Orange background)
- **Meaning**: Parent needs to complete enrollment process (action needed from parent).
- **Action Required**: Parent must complete forms, provide information, or take other required steps.
- **Next Steps**: Follow up with parent to complete enrollment.

### Pending Approval
- **Display**: "Pending Approval" (Blue background)
- **Meaning**: Admin needs to review and approve/decline the enrollment request.
- **Action Required**: Admin review of application, documents, or information.
- **Next Steps**: Admin should review application and make decision.

### Enrolled
- **Display**: "Enrolled" (Green background)
- **Meaning**: Active swimmer who has completed assessment and is currently taking lessons.
- **Action Required**: None (active status).
- **Next Steps**: Continue with regular lesson scheduling and progress tracking.

### Expired
- **Display**: "Expired" (Red background)
- **Meaning**: Authorization or funding has expired, needs renewal.
- **Action Required**: Renew authorization, update funding information.
- **Next Steps**: Contact coordinator for renewal or update payment information.

### Declined
- **Display**: "Declined" (Gray background)
- **Meaning**: Admin has declined the enrollment request.
- **Action Required**: None (final status).
- **Next Steps**: Inform parent of decision. Swimmer may reapply in future.

### Dropped
- **Display**: "Dropped" (Dark Gray background)
- **Meaning**: Swimmer was dropped after initial assessment for various reasons (behavioral issues, parent no-call/no-show, etc.).
- **Action Required**: None (final status).
- **Important**: Swimmer CANNOT re-enroll once marked as dropped.
- **Common Reasons**:
  - Behavioral issues during assessment
  - Parent no-call/no-show for multiple sessions
  - Safety concerns
  - Incompatibility with program

## Key Distinctions

### Waitlist vs. Pending Enrollment
- **Waitlist**: We approved them, they're waiting on US to schedule their assessment
- **Pending Enrollment**: They need to complete something on THEIR end

### Declined vs. Dropped
- **Declined**: Never started the program (application rejected)
- **Dropped**: Started but was removed from the program (cannot re-enroll)

## Status Workflow

```
Pending Enrollment → Pending Approval → Waitlist → Enrolled
         ↓                  ↓
     Declined           Expired → Renewal → Enrolled
                                 ↓
                              Dropped (FINAL)
```

## UI Implementation

### Color Coding
- **Green**: Active, positive status (Enrolled)
- **Yellow**: Waiting status (Waitlist)
- **Orange**: Action required (Pending Enrollment)
- **Blue**: Admin review needed (Pending Approval)
- **Red**: Problem/expired (Expired)
- **Gray**: Inactive/final (Declined)
- **Dark Gray**: Terminated (Dropped)

### Capitalization Rules
All status displays use proper capitalization (first letter capitalized, rest lowercase):
- ✅ "Waitlist" (not "waitlist" or "WAITLIST")
- ✅ "Pending Enrollment" (not "pending enrollment")
- ✅ "Pending Approval" (not "pending approval")
- ✅ "Enrolled" (not "enrolled")
- ✅ "Expired" (not "expired")
- ✅ "Declined" (not "declined")
- ✅ "Dropped" (not "dropped")

## Database Notes
- Status values are stored in lowercase (e.g., "waitlist", "pending", "enrolled")
- Display names are defined in `StatusBadge.tsx` and `swimmers-table.tsx`
- Never change swimmer statuses in database without proper workflow
- "Dropped" status is irreversible - use with caution

## Related Components
- `src/components/swimmers/StatusBadge.tsx` - Status badge component
- `src/components/features/admin/swimmers-table.tsx` - Admin table with status display
- `src/components/swimmers/SwimmerManagementTable.tsx` - General swimmer management table

## Last Updated
January 11, 2026 - Updated as part of admin dashboard fixes