# SwimmerManagementTable Component

A comprehensive swimmer management table component for admin and instructor roles with filtering, sorting, pagination, and detail views.

## Features

### Core Features
- **Role-based access**: Different actions for admin vs instructor
- **Search**: Debounced 300ms search across swimmer names, parent names, and emails
- **Filters**: Status, funding type, and swim level filters
- **Sorting**: Click column headers to sort (asc/desc)
- **Pagination**: 25/50/100 items per page with navigation
- **Detail View**: Click rows to open detail drawer with swimmer information
- **URL Persistence**: All state stored in URL search params

### Admin Actions
- View Details
- Approve/Decline (for pending swimmers)
- Edit Swimmer
- View Progress
- Book Session

### Instructor Actions
- View Details
- Add Progress Note
- View Progress

## Usage

```tsx
import { SwimmerManagementTable } from "@/components/swimmers/SwimmerManagementTable"

// Admin view
<SwimmerManagementTable role="admin" />

// Instructor view
<SwimmerManagementTable role="instructor" />
```

## API Integration

The component expects API endpoints to return data in this format:

```typescript
interface SwimmersResponse {
  swimmers: Swimmer[];
  total: number;
  page: number;
  totalPages: number;
}

interface Swimmer {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
  enrollmentStatus: string;
  assessmentStatus: string;
  currentLevel?: {
    id: string;
    name: string;
    displayName: string;
    color?: string;
  } | null;
  paymentType: string;
  isVmrcClient: boolean;
  photoUrl?: string;
  vmrcSessionsUsed?: number;
  vmrcSessionsAuthorized?: number;
  vmrcCurrentPosNumber?: string;
  vmrcPosExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  } | null;
  lessonsCompleted: number;
  nextSession?: {
    startTime: string;
    instructorName?: string;
  } | null;
}
```

### API Endpoints
- **Admin**: `/api/admin/swimmers`
- **Instructor**: `/api/instructor/swimmers`

### Query Parameters
The component passes these query parameters to the API:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `search` | Search term | `search=john` |
| `status` | Enrollment status filter | `status=enrolled` |
| `funding` | Payment type filter | `funding=vmrc` |
| `level` | Swim level filter | `level=blue` |
| `sortBy` | Sort field | `sortBy=name` |
| `sortOrder` | Sort direction | `sortOrder=asc` |
| `page` | Page number | `page=2` |
| `limit` | Items per page | `limit=50` |

## Styling

The component uses shadcn/ui components with the ocean theme colors defined in `globals.css`.

### Status Badge Colors
- `enrolled`: Green
- `waitlist`: Yellow
- `pending`: Blue
- `inactive`: Gray
- `dropped`: Red

### Funding Badge Colors
- `private_pay`: Blue
- `vmrc`: Purple
- `scholarship`: Orange
- `other`: Gray

## Demo

A demo page is available at `/test-swimmer-management` showing both admin and instructor views.

## Dependencies

- `date-fns`: For date formatting and age calculation
- `lucide-react`: For icons
- `next/navigation`: For URL state management
- `shadcn/ui`: For UI components

## Props

```typescript
interface SwimmerManagementTableProps {
  role: 'admin' | 'instructor';
}
```