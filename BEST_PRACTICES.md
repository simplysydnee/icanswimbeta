# I Can Swim - React & Next.js Best Practices

## 🚨 CRITICAL RULES - Always Follow

### 1. Never Remove Functionality When Refactoring
- Before modifying any component, document ALL existing features
- After refactoring, verify ALL features still work
- If simplifying UI, ensure all data and actions remain accessible
- **Example**: A modal with 5 tabs must keep all 5 tabs when refactored

### 2. useEffect Dependencies
Always include dependencies and use useCallback for fetch functions:
```typescript
// ✅ CORRECT
const fetchData = useCallback(async () => {
  // fetch logic
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);

// ❌ WRONG - Missing dependency
useEffect(() => {
  fetchData();
}, []); // fetchData not in deps
```

### 3. No 'any' Types
Always use proper TypeScript interfaces:
```typescript
// ✅ CORRECT
interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
}

const swimmers: Swimmer[] = data;

// ❌ WRONG
const swimmers: any[] = data;
swimmers.map((s: any) => ...)
```

### 4. Use Next.js Image Component
Always use Next.js Image for optimization:
```typescript
// ✅ CORRECT
import Image from 'next/image';

<Image
  src={photo_url}
  alt="Swimmer"
  width={40}
  height={40}
  className="rounded-full object-cover"
  unoptimized // Use for external URLs like Supabase
/>

// ❌ WRONG
<img src={photo_url} alt="Swimmer" className="rounded-full" />
```

### 5. Loading States with Skeletons
Use Skeleton components, not just spinners:
```typescript
// ✅ CORRECT
if (loading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// ❌ WRONG
if (loading) {
  return <Loader2 className="animate-spin" />;
}
```

### 6. Accessibility - aria-labels on Icon Buttons
```typescript
// ✅ CORRECT
<Button size="icon" aria-label="Close modal">
  <X className="h-4 w-4" />
</Button>

// ❌ WRONG
<Button size="icon">
  <X className="h-4 w-4" />
</Button>
```

### 7. Error Boundaries for Critical Components
Wrap components that fetch data in error boundaries:
```typescript
// ✅ CORRECT
<ErrorBoundary fallback={<ErrorMessage />}>
  <SwimmerList />
</ErrorBoundary>
```

### 8. Form Validation with Zod
Use Zod for form validation:
```typescript
// ✅ CORRECT
import { z } from 'zod';

const swimmerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});
```

---

## 📐 Component Structure

### Maximum Component Size
- **Target**: < 300 lines per component
- **Warning**: > 400 lines - consider splitting
- **Critical**: > 600 lines - must split

### Component Splitting Pattern
```typescript
// Parent Component (SwimmerProfile.tsx)
export default function SwimmerProfile({ swimmerId }: { swimmerId: string }) {
  const { data: swimmer } = useSwimmer(swimmerId);

  return (
    <div className="space-y-6">
      <SwimmerHeader swimmer={swimmer} />
      <SwimmerDetails swimmer={swimmer} />
      <SwimmerProgress swimmerId={swimmerId} />
    </div>
  );
}

// Child Component (SwimmerHeader.tsx)
export function SwimmerHeader({ swimmer }: { swimmer: Swimmer }) {
  return (
    <div className="flex items-center gap-4">
      <Image src={swimmer.photo_url} alt={swimmer.first_name} />
      <div>
        <h1>{swimmer.first_name} {swimmer.last_name}</h1>
        <p>{swimmer.client_number}</p>
      </div>
    </div>
  );
}
```

### File Naming Convention
- **Component files**: `PascalCase.tsx` (e.g., `SwimmerCard.tsx`)
- **Utility files**: `kebab-case.ts` (e.g., `format-date.ts`)
- **Hook files**: `useCamelCase.ts` (e.g., `useSwimmers.ts`)
- **Type files**: `kebab-case.ts` (e.g., `swimmer-types.ts`)

---

## 🎨 Styling & Design System

### Tailwind CSS Best Practices
```typescript
// ✅ CORRECT - Use design system classes
className="text-primary hover:text-primary-dark"
className="bg-destructive text-destructive-foreground"

// ❌ WRONG - Hardcoded colors
className="text-blue-600 hover:text-blue-700"
className="bg-red-500 text-white"
```

### Responsive Design
```typescript
// ✅ CORRECT - Mobile-first approach
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Left column</div>
  <div className="w-full md:w-1/2">Right column</div>
</div>
```

### Dark Mode Support
```typescript
// ✅ CORRECT - Use theme-aware classes
className="bg-background text-foreground border-border"
```

---

## 🔒 Security & Performance

### 1. Server-Side Validation
Always validate on server, even with client-side validation:
```typescript
// ✅ CORRECT
export async function POST(request: Request) {
  const body = await request.json();
  const result = swimmerSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: result.error.format() }, { status: 400 });
  }

  // Process data
}
```

### 2. SQL Injection Prevention
Use Supabase parameterized queries:
```typescript
// ✅ CORRECT
const { data } = await supabase
  .from('swimmers')
  .select('*')
  .eq('id', swimmerId); // Parameterized

// ❌ WRONG
const { data } = await supabase
  .from('swimmers')
  .select('*')
  .eq('id', `${swimmerId}`); // String concatenation
```

### 3. Image Optimization
```typescript
// ✅ CORRECT
<Image
  src={url}
  alt="Description"
  width={500}
  height={300}
  priority={false} // Only for above-the-fold images
  loading="lazy"
/>
```

### 4. Bundle Size Optimization
- Use dynamic imports for large components
- Tree-shake unused imports
- Monitor bundle size with `@next/bundle-analyzer`

---

## 🧪 Testing Requirements

### 1. Component Testing
```typescript
// ✅ CORRECT - Test user interactions
test('should show loading state', () => {
  render(<SwimmerList />);
  expect(screen.getByRole('status')).toBeInTheDocument();
});

test('should display swimmers after loading', async () => {
  render(<SwimmerList />);
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 2. E2E Testing with Playwright
```typescript
// ✅ CORRECT
test('parent can book a session', async ({ page }) => {
  await page.goto('/parent/book');
  await page.selectSwimmer('John Doe');
  await page.selectTimeSlot('Monday 3:00 PM');
  await page.clickBook();
  await expect(page.getByText('Booking confirmed')).toBeVisible();
});
```

### 3. Accessibility Testing
```typescript
// ✅ CORRECT
test('should be accessible', async () => {
  const { container } = render(<SwimmerForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 📊 Data Fetching Patterns

### 1. Server Components (Recommended)
```typescript
// ✅ CORRECT - Server Component
export default async function SwimmerPage({ params }: { params: { id: string } }) {
  const swimmer = await getSwimmer(params.id);

  return (
    <div>
      <h1>{swimmer.first_name} {swimmer.last_name}</h1>
      <SwimmerDetails swimmer={swimmer} />
    </div>
  );
}
```

### 2. Client Components with SWR/React Query
```typescript
// ✅ CORRECT - Client Component with caching
export function SwimmerList() {
  const { data: swimmers, isLoading } = useSwimmers();

  if (isLoading) return <SkeletonList />;

  return (
    <div>
      {swimmers.map(swimmer => (
        <SwimmerCard key={swimmer.id} swimmer={swimmer} />
      ))}
    </div>
  );
}
```

### 3. Real-time Updates
```typescript
// ✅ CORRECT - Supabase real-time
useEffect(() => {
  const channel = supabase
    .channel('swimmer-updates')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'swimmers' },
      (payload) => {
        // Update local state
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 🚀 Deployment & Monitoring

### 1. Environment Variables
```bash
# ✅ CORRECT - Use .env.local for secrets
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
```

### 2. Error Monitoring
```typescript
// ✅ CORRECT - Log errors to service
try {
  await bookSession();
} catch (error) {
  console.error('Booking failed:', error);
  // Send to Sentry/LogRocket
  captureException(error);
}
```

### 3. Performance Monitoring
- Use Vercel Analytics
- Monitor Core Web Vitals
- Set up alerts for slow pages

---

## 🔄 Code Review Checklist

### Before Submitting PR:
- [ ] No `any` types used
- [ ] All `useEffect` dependencies correct
- [ ] Loading states implemented
- [ ] Error boundaries for data fetching
- [ ] Accessibility labels on interactive elements
- [ ] Responsive design tested
- [ ] Dark mode compatibility
- [ ] No functionality removed during refactoring
- [ ] Tests updated/added
- [ ] Bundle size impact reviewed

### Performance Checklist:
- [ ] Images optimized with Next.js Image
- [ ] Dynamic imports for large components
- [ ] No unnecessary re-renders
- [ ] Memoization used where appropriate
- [ ] Database queries optimized

### Security Checklist:
- [ ] Server-side validation
- [ ] No SQL injection vulnerabilities
- [ ] Authentication checks on protected routes
- [ ] Environment variables not exposed

---

## 🆘 Common Pitfalls & Solutions

### 1. Infinite useEffect Loop
**Problem**: Missing dependency causes stale data
**Solution**: Add all dependencies to useEffect array

### 2. Memory Leaks
**Problem**: Subscriptions not cleaned up
**Solution**: Always return cleanup function
```typescript
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### 3. Prop Drilling
**Problem**: Passing props through multiple levels
**Solution**: Use Context or component composition

### 4. State Management Complexity
**Problem**: Too much useState in large components
**Solution**: Split into smaller components or use useReducer

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

*Last Updated: 2025-12-18*
*Maintainer: Development Team*
*Version: 1.0.0*