# I Can Swim - Project Overview

**I Can Swim** is a full-stack swim lesson booking and progress tracking platform built on the Vibin Coders SaaS Accelerator framework. It serves both private-pay families and Regional Center state-funded clients with adaptive swim lessons for swimmers with special needs.

## Business Information

- **Company**: I Can Swim, LLC
- **Owner**: Sutton Lucas
- **Phone**: 209-778-7877
- **Email**: info@icanswim209.com
- **Website**: icanswim209.com
- **Locations**:
  - Modesto: 1212 Kansas Ave, Modesto, CA 95351
  - Merced: 750 Motel Dr, Merced, CA 95340

## Technology Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Authentication**: Supabase Auth with JWT tokens
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with ocean-themed design system
- **UI Components**: shadcn/ui component library
- **Theming**: next-themes for dark/light mode support
- **Icons**: Lucide React
- **Payments**: Stripe (for private-pay clients only)
- **Package Manager**: npm
- **Hosting**: Vercel

## Development Commands

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run type-check      # Run TypeScript type checking

# Utilities
npm run clean           # Clean build artifacts
```

## Project Architecture

### Directory Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── (marketing)/         # Public website route group
│   │   ├── layout.tsx       # Marketing layout with PublicHeader/Footer
│   │   ├── page.tsx         # Homepage
│   │   ├── about/           # About I Can Swim
│   │   ├── team/            # Dynamic team from profiles table
│   │   ├── programs/        # Private pay & Regional Center info
│   │   ├── pricing/         # Assessment & lesson pricing
│   │   ├── regional-centers/ # RC partner information
│   │   ├── faq/             # Common questions
│   │   └── contact/         # Contact form & info
│   ├── admin/               # Admin dashboard routes
│   ├── instructor/          # Instructor routes
│   ├── parent/              # Parent routes
│   ├── coordinator/         # Coordinator routes
│   ├── api/                 # API routes
│   ├── login/               # Login page
│   ├── signup/              # Registration page
│   ├── forgot-password/     # Password reset
│   ├── reset-password/      # Password reset confirmation
│   └── layout.tsx           # Root layout
├── components/
│   ├── marketing/           # PublicHeader, PublicFooter, MobileNav
│   ├── admin/               # Admin components
│   ├── instructor/          # Instructor components
│   ├── swimmers/            # Swimmer management components
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Layout components
│   ├── auth/                # Authentication components
│   ├── booking/             # Booking components
│   ├── enrollment/          # Enrollment components
│   ├── progress/            # Progress tracking components
│   ├── schedule/            # Schedule components
│   └── common/              # Shared utility components
├── contexts/
│   ├── AuthContext.tsx      # Authentication context
│   └── NavigationContext.tsx # Navigation context
├── hooks/
│   ├── useAuth.ts           # Auth hook
│   ├── useSwimmers.ts       # Swimmer data hooks
│   ├── useSessions.ts       # Session hooks
│   └── useBooking.ts        # Booking hooks
├── lib/
│   ├── auth/
│   │   └── server.ts        # Server-side auth utilities
│   ├── supabase/
│   │   ├── client.ts        # Browser Supabase client
│   │   └── server.ts        # Server Supabase client
│   ├── utils.ts             # Utility functions
│   ├── constants.ts         # App configuration
│   └── types.ts             # Shared TypeScript interfaces
├── types/
│   ├── auth.ts              # Auth type definitions
│   ├── swimmer.ts           # Swimmer types
│   ├── session.ts           # Session types
│   ├── booking.ts           # Booking types
│   └── purchase-order.ts    # Regional Center PO types
└── middleware.ts            # Route protection middleware
```

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (for private-pay only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🌐 Public Marketing Website

The public-facing website uses Next.js route groups for clean URL structure:

| Page | Route | Description |
|------|-------|-------------|
| Homepage | `/` | Landing page with hero, features, CTA |
| About | `/about` | Company story, mission, location |
| Team | `/team` | Dynamic team from profiles table |
| Programs | `/programs` | Private pay & Regional Center info |
| Pricing | `/pricing` | Assessment & lesson pricing |
| Regional Centers | `/regional-centers` | RC partner information |
| FAQ | `/faq` | Common questions |
| Contact | `/contact` | Contact form & info |

## User Roles & Access Control

### Four User Roles

1. **Parent** (default role)
   - Book lessons for their swimmers
   - View swimmer progress and upcoming sessions
   - Complete enrollment forms
   - Cancel bookings (24-hour policy)
   - Protected routes: `/parent/*`

2. **Instructor**
   - View all schedules and bookings
   - Mark attendance
   - Update swimmer progress and skill tracking
   - Create progress notes
   - Request POS renewals for Regional Center clients
   - Protected routes: `/instructor/*`

3. **Admin**
   - Full system access
   - Approve/decline new swimmers
   - Manage sessions (create, edit, cancel)
   - Generate session batches
   - View analytics and KPIs
   - Protected routes: `/admin/*`

4. **Regional Center Coordinator**
   - Submit referrals for new Regional Center clients
   - Approve POS (Purchase Order) requests
   - View assigned swimmers
   - Review progress update requests
   - Protected routes: `/coordinator/*`

### Route Protection Configuration

```typescript
// In middleware.ts
const protectedRoutes = {
  '/parent': ['parent', 'admin'],
  '/instructor': ['instructor', 'admin'],
  '/admin': ['admin'],
  '/coordinator': ['vmrc_coordinator', 'admin'],
}
```

## Database Schema

### Core Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  title TEXT,
  credentials TEXT,
  display_on_team BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (separate table for role assignments)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'instructor', 'admin', 'vmrc_coordinator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Swimmers
CREATE TABLE swimmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  client_number TEXT UNIQUE,
  -- Medical/Safety fields
  has_allergies BOOLEAN DEFAULT FALSE,
  allergies_description TEXT,
  has_medical_conditions BOOLEAN DEFAULT FALSE,
  medical_conditions_description TEXT,
  diagnosis TEXT[],
  history_of_seizures BOOLEAN DEFAULT FALSE,
  toilet_trained BOOLEAN,
  non_ambulatory BOOLEAN DEFAULT FALSE,
  -- Behavioral fields
  self_injurious_behavior BOOLEAN DEFAULT FALSE,
  self_injurious_description TEXT,
  aggressive_behavior BOOLEAN DEFAULT FALSE,
  aggressive_behavior_description TEXT,
  elopement_history BOOLEAN DEFAULT FALSE,
  elopement_description TEXT,
  -- Swimming fields
  previous_swim_lessons BOOLEAN DEFAULT FALSE,
  comfortable_in_water TEXT,
  swim_goals TEXT[],
  current_level_id UUID REFERENCES swim_levels(id),
  -- Payment & Regional Center
  payment_type TEXT DEFAULT 'private_pay' CHECK (payment_type IN ('private_pay', 'vmrc', 'scholarship', 'other')),
  is_vmrc_client BOOLEAN DEFAULT FALSE,
  vmrc_coordinator_name TEXT,
  vmrc_coordinator_email TEXT,
  vmrc_coordinator_phone TEXT,
  vmrc_sessions_used INTEGER DEFAULT 0,
  vmrc_sessions_authorized INTEGER DEFAULT 0,
  vmrc_current_pos_number TEXT,
  vmrc_pos_expires_at TIMESTAMPTZ,
  -- Status
  enrollment_status TEXT DEFAULT 'waitlist',
  assessment_status TEXT DEFAULT 'not_started',
  approval_status TEXT DEFAULT 'pending',
  flexible_swimmer BOOLEAN DEFAULT FALSE,
  -- Legal
  signed_waiver BOOLEAN DEFAULT FALSE,
  photo_release BOOLEAN DEFAULT FALSE,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES profiles(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  day_of_week INTEGER,
  location TEXT,
  session_type TEXT DEFAULT 'lesson' CHECK (session_type IN ('lesson', 'assessment')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'available', 'open', 'booked', 'cancelled', 'completed')),
  max_capacity INTEGER DEFAULT 1,
  booking_count INTEGER DEFAULT 0,
  is_full BOOLEAN DEFAULT FALSE,
  price_cents INTEGER DEFAULT 7500, -- $75.00
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  swimmer_id UUID REFERENCES swimmers(id),
  parent_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  cancel_reason TEXT,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders (Regional Center)
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID REFERENCES swimmers(id),
  coordinator_id UUID REFERENCES profiles(id),
  po_type TEXT CHECK (po_type IN ('assessment', 'lessons')),
  authorization_number TEXT,
  allowed_lessons INTEGER NOT NULL,
  lessons_booked INTEGER DEFAULT 0,
  lessons_used INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Swim Levels
CREATE TABLE swim_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  sequence INTEGER NOT NULL
);

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID REFERENCES swim_levels(id),
  name TEXT NOT NULL,
  description TEXT,
  sequence INTEGER
);

-- Progress Notes
CREATE TABLE progress_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  booking_id UUID REFERENCES bookings(id),
  swimmer_id UUID REFERENCES swimmers(id),
  instructor_id UUID REFERENCES profiles(id),
  lesson_summary TEXT,
  skills_working_on TEXT[],
  skills_mastered TEXT[],
  shared_with_parent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Business Rules

### Booking Rules
- **24-hour cancellation policy**: Parents cannot cancel < 24h before session
- **Late cancellation penalty**: Sets `flexible_swimmer = true`
- **Capacity limits**: Sessions have `max_capacity`, auto-mark `is_full`
- **Booking limits**: Swimmers have max 4 bookings per day by default

### Regional Center-Specific Rules
- **Assessment PO**: 1 session authorized
- **Lessons PO**: 12 sessions over 3 months
- **PO renewal alert**: Triggered at lesson 11/12
- **Coordinator approval**: Required for all POs

### Session Opening Logic
- Admin creates sessions as `status: 'draft'`
- Sessions open on last Sunday of month at 6pm PT
- Draft → Open transition changes visibility to parents

## Pricing Structure

| Type | Price | Notes |
|------|-------|-------|
| Initial Assessment | $65 | One-time, 30 minutes |
| Regular Lesson (Private Pay) | $75 | Per session |
| Regional Center Lesson | $0 | Billed to state, tracked against PO |

## Swim Levels

| Level | Name | Description |
|-------|------|-------------|
| White | Water Readiness | Entry level, building comfort |
| Red | Body Position | Floating, body awareness |
| Yellow | Forward Movement | Basic propulsion |
| Green | Water Competency | Treading, survival skills |
| Blue | Streamlines | Stroke development |

## Key Workflows to Implement

### 1. New Regional Center Client Onboarding
```
Coordinator submits referral
  → Admin reviews & approves
  → System creates swimmer record
  → Parent invitation email sent
  → Parent claims invitation
  → Parent books assessment
  → Assessment PO created (1 session)
  → Coordinator approves PO
  → Instructor completes assessment
  → Lessons PO auto-created (12 sessions)
  → Coordinator approves Lessons PO
  → Parent books regular lessons
```

### 2. Weekly Booking Flow
```
Parent selects swimmer(s)
  → Selects day of week
  → Selects time slot
  → Selects instructor
  → System checks conflicts
  → Shows available dates for month
  → Parent confirms selection
  → 5-minute hold on sessions
  → Payment (private pay) or PO validation (Regional Center)
  → Bookings created
```

### 3. Progress Update & PO Renewal
```
Swimmer reaches lesson 11/12
  → instructor_notification created
  → Instructor opens progress update
  → Fills progress summary, skills mastered
  → Sends to coordinator
  → Coordinator reviews & approves new PO
  → New 12-session PO created
```

## Development Guidelines

### Adding New Components
1. Follow shadcn/ui patterns for consistency
2. Use TypeScript interfaces from `src/types/`
3. Implement responsive design with Tailwind
4. Add proper ARIA attributes for accessibility

### Styling Conventions
- Use custom CSS variables for brand colors
- Follow mobile-first responsive design
- Implement smooth transitions and animations
- Maintain consistent spacing with Tailwind utilities

### Type Safety
- All components must be properly typed
- Use existing type definitions from `src/types/`
- Extend types in `src/lib/types.ts` for shared interfaces
- Maintain strict TypeScript configuration

## Testing with Playwright

```bash
# Run tests
npx playwright test

# Run specific test
npx playwright test tests/booking/weekly-booking.spec.ts

# Run with UI
npx playwright test --ui
```

## Deployment

1. Push to GitHub
2. Vercel auto-deploys from main branch
3. Set environment variables in Vercel dashboard
4. Configure Stripe webhook for production URL

## Key Constants (src/lib/constants.ts)

```typescript
export const APP_CONFIG = {
  name: 'I Can Swim',
  description: 'Simply Better Swim Software',
  url: process.env.NEXT_PUBLIC_APP_URL,
  owner: 'Sutton Lucas',
  email: 'info@icanswim209.com',
  phone: '209-778-7877',
};

export const PRICING = {
  ASSESSMENT: 6500, // $65.00 in cents
  LESSON_PRIVATE_PAY: 7500, // $75.00 in cents
  VMRC_LESSON: 0, // Billed to state
};

export const VMRC_CONFIG = {
  ASSESSMENT_SESSIONS: 1,
  LESSONS_PER_PO: 12,
  PO_DURATION_MONTHS: 3,
  RENEWAL_ALERT_THRESHOLD: 11, // Alert at 11/12 sessions
};

export const SESSION_STATUSES = {
  DRAFT: 'draft',
  AVAILABLE: 'available',
  OPEN: 'open',
  BOOKED: 'booked',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};
```

## Current Phase

**Public website launch, skills tracking improvements**

The project has successfully launched the public marketing website with dynamic content and is currently focused on improving swimmer skills tracking and progress monitoring features.

## Development Best Practices

For detailed React, Next.js, and TypeScript best practices, see [BEST_PRACTICES.md](./BEST_PRACTICES.md) in the project root. Key areas covered:

### Critical Rules
- Never remove functionality when refactoring
- Proper useEffect dependencies
- No 'any' types
- Next.js Image component usage
- Loading states with skeletons
- Accessibility requirements

### Component Structure
- Maximum component size limits
- Component splitting patterns
- File naming conventions

### Security & Performance
- Server-side validation
- SQL injection prevention
- Image optimization
- Bundle size optimization

### Testing Requirements
- Component testing patterns
- E2E testing with Playwright
- Accessibility testing

### Code Review Checklists
- Before submitting PR checklist
- Performance checklist
- Security checklist

---

*Last Updated: December 23, 2025*
*Current Version: 2.0.0*
*Maintainer: Development Team*