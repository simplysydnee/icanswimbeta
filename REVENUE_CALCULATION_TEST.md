# Revenue Calculation Test

## SQL Verification Query

Run this query in Supabase SQL Editor to verify revenue calculations:

```sql
-- Test Revenue Calculation Logic
WITH revenue_data AS (
  SELECT
    b.id as booking_id,
    b.status as booking_status,
    s.payment_type as swimmer_payment_type,
    ses.price_cents as session_price_cents,
    ses.start_time as session_start_time,
    ses.price_cents / 100.0 as session_price_dollars,
    CASE
      WHEN b.status = 'completed' THEN TRUE
      WHEN b.status = 'confirmed' AND ses.start_time < NOW() THEN TRUE
      ELSE FALSE
    END as is_attended
  FROM bookings b
  JOIN swimmers s ON b.swimmer_id = s.id
  JOIN sessions ses ON b.session_id = ses.id
  WHERE (b.status = 'confirmed' OR b.status = 'completed')
    AND ses.start_time >= DATE_TRUNC('month', NOW())
    AND ses.start_time < NOW()
)
SELECT
  swimmer_payment_type,
  COUNT(*) as booking_count,
  SUM(CASE WHEN is_attended THEN session_price_cents ELSE 0 END) as total_cents,
  SUM(CASE WHEN is_attended THEN session_price_dollars ELSE 0 END) as total_dollars,
  SUM(CASE WHEN is_attended AND swimmer_payment_type = 'private_pay' THEN session_price_dollars ELSE 0 END) as private_pay_revenue,
  SUM(CASE WHEN is_attended AND swimmer_payment_type IN ('vmrc', 'scholarship', 'other') THEN session_price_dollars ELSE 0 END) as funded_revenue
FROM revenue_data
GROUP BY swimmer_payment_type
ORDER BY swimmer_payment_type;
```

## Expected Results

The query should show:
1. Only `confirmed` or `completed` bookings
2. Only sessions from current month
3. Revenue split by payment type:
   - `private_pay` → Private Pay Revenue
   - `vmrc`, `scholarship`, `other` → Funded Revenue
4. Only count sessions as attended if:
   - Status is `completed` OR
   - Status is `confirmed` AND session start time is in the past

## Manual Test Steps

1. **Check Admin Dashboard** (`/admin`):
   - Verify Private Pay Revenue shows correct amount
   - Verify Funded Revenue shows correct amount
   - Verify Total = Private Pay + Funded

2. **Check Billing Report** (`/admin/reports`):
   - Verify Private Pay section shows correct monthly/YTd revenue
   - Verify Funded Revenue section shows correct monthly/YTd revenue

3. **Test Edge Cases**:
   - Future confirmed bookings should NOT count as revenue
   - Cancelled bookings should NOT count as revenue
   - No-show bookings should NOT count as revenue
   - Completed bookings should ALWAYS count as revenue
   - Past confirmed bookings should count as revenue

## Business Logic Summary

### Revenue Counting Rules
**A session counts toward revenue if:**
1. Booking status is `'confirmed'` OR `'completed'`
2. AND session start_time is in the past (for confirmed bookings)
3. NOT if status is `'cancelled'` or `'no_show'`

### Revenue Type Determination
- `payment_type = 'private_pay'` → **Private Pay Revenue**
- `payment_type = 'vmrc'` → **Funded Revenue**
- `payment_type = 'scholarship'` → **Funded Revenue**
- `payment_type = 'other'` → **Funded Revenue**

### Pricing
- Use `sessions.price_cents` field
- Convert to dollars: `price_cents / 100`
- Typical prices:
  - Private Pay Lesson: 7500 cents ($75.00)
  - VMRC Lesson: 9644 cents ($96.44)
  - Assessment: 6500 cents ($65.00)

## Files Modified

1. `src/app/admin/page.tsx` - Admin dashboard revenue calculation
2. `src/app/api/reports/billing/route.ts` - Billing report API
3. `src/components/reports/ComprehensiveBillingReport.tsx` - Billing report component interface
4. `src/hooks/useAdminRevenue.ts` - New React Query hook for revenue calculations

## Database Schema Reference

### Key Tables
- `bookings`: `id`, `session_id`, `swimmer_id`, `status`, `created_at`
- `sessions`: `id`, `start_time`, `price_cents`, `session_type`
- `swimmers`: `id`, `payment_type`, `first_name`, `last_name`

### Key Fields
- `bookings.status`: `'confirmed'`, `'cancelled'`, `'completed'`, `'no_show'`
- `swimmers.payment_type`: `'private_pay'`, `'vmrc'`, `'scholarship'`, `'other'`
- `sessions.price_cents`: Price in cents (divide by 100 for dollars)