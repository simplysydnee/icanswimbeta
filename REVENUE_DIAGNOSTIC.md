# Revenue Calculation Diagnostic

## SQL Queries to Diagnose Issues

### 1. Check Payment Types Distribution
```sql
-- What payment types actually exist in the database?
SELECT
  payment_type,
  COUNT(*) as swimmer_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM swimmers
GROUP BY payment_type
ORDER BY swimmer_count DESC;
```

### 2. Check Bookings with Session Data
```sql
-- Check bookings with their session and swimmer data for current month
SELECT
  b.id as booking_id,
  b.status as booking_status,
  s.payment_type as swimmer_payment_type,
  ses.price_cents,
  ses.start_time,
  CASE
    WHEN b.status = 'completed' THEN 'COMPLETED - Counts'
    WHEN b.status = 'confirmed' AND ses.start_time < NOW() THEN 'CONFIRMED (Past) - Counts'
    WHEN b.status = 'confirmed' AND ses.start_time >= NOW() THEN 'CONFIRMED (Future) - Does NOT count'
    ELSE 'OTHER - Does NOT count'
  END as revenue_status,
  CASE
    WHEN s.payment_type = 'private_pay' THEN 'Private Pay'
    WHEN s.payment_type IN ('vmrc', 'scholarship', 'other') THEN 'Funded'
    ELSE 'Unknown/Other'
  END as revenue_type
FROM bookings b
JOIN swimmers s ON b.swimmer_id = s.id
JOIN sessions ses ON b.session_id = ses.id
WHERE (b.status = 'confirmed' OR b.status = 'completed')
  AND ses.start_time >= DATE_TRUNC('month', NOW())
  AND ses.start_time < NOW()
ORDER BY ses.start_time DESC;
```

### 3. Calculate Revenue by Payment Type (Current Month)
```sql
WITH revenue_data AS (
  SELECT
    b.id as booking_id,
    b.status as booking_status,
    s.payment_type as swimmer_payment_type,
    ses.price_cents,
    ses.start_time,
    -- Determine if should count as revenue
    CASE
      WHEN b.status = 'completed' THEN TRUE
      WHEN b.status = 'confirmed' AND ses.start_time < NOW() THEN TRUE
      ELSE FALSE
    END as should_count
  FROM bookings b
  JOIN swimmers s ON b.swimmer_id = s.id
  JOIN sessions ses ON b.session_id = ses.id
  WHERE (b.status = 'confirmed' OR b.status = 'completed')
    AND ses.start_time >= DATE_TRUNC('month', NOW())
    AND ses.start_time < NOW()
)
SELECT
  swimmer_payment_type,
  COUNT(*) as total_bookings,
  SUM(CASE WHEN should_count THEN 1 ELSE 0 END) as counted_bookings,
  SUM(CASE WHEN should_count THEN price_cents ELSE 0 END) as total_cents,
  ROUND(SUM(CASE WHEN should_count THEN price_cents ELSE 0 END) / 100.0, 2) as total_dollars,
  CASE
    WHEN swimmer_payment_type = 'private_pay' THEN 'Private Pay Revenue'
    WHEN swimmer_payment_type IN ('vmrc', 'scholarship', 'other') THEN 'Funded Revenue'
    ELSE 'Unknown/Other'
  END as revenue_category
FROM revenue_data
GROUP BY swimmer_payment_type
ORDER BY total_dollars DESC;
```

### 4. Check for NULL or Empty Payment Types
```sql
-- Find swimmers with problematic payment types
SELECT
  id,
  first_name,
  last_name,
  payment_type,
  enrollment_status
FROM swimmers
WHERE payment_type IS NULL
  OR payment_type = ''
  OR payment_type NOT IN ('private_pay', 'vmrc', 'scholarship', 'other');
```

### 5. Verify Session Pricing
```sql
-- Check session prices and types
SELECT
  session_type,
  COUNT(*) as session_count,
  AVG(price_cents) as avg_price_cents,
  MIN(price_cents) as min_price_cents,
  MAX(price_cents) as max_price_cents,
  ROUND(AVG(price_cents) / 100.0, 2) as avg_price_dollars
FROM sessions
WHERE start_time >= DATE_TRUNC('month', NOW())
GROUP BY session_type
ORDER BY session_count DESC;
```

## Common Issues to Check

### Issue 1: Incorrect Date Filtering
- **Problem**: Using wrong date range (year vs month)
- **Check**: Compare `yearStart` vs `monthStart` in queries
- **Fix**: Ensure monthly revenue uses `monthStart`, YTD uses `yearStart`

### Issue 2: NULL Payment Types
- **Problem**: `neq('payment_type', 'private_pay')` includes NULL values
- **Check**: Run query #4 above
- **Fix**: Use `in('vmrc', 'scholarship', 'other')` instead of `neq()`

### Issue 3: Timezone Issues
- **Problem**: UTC vs local time conversions
- **Check**: Compare `NOW()` in SQL vs `new Date()` in JavaScript
- **Fix**: Ensure consistent timezone handling

### Issue 4: Missing Session/Swimmer Data
- **Problem**: Bookings without linked session or swimmer data
- **Check**: Look for `skippedCount` in console logs
- **Fix**: Ensure foreign key relationships are valid

## Debugging Steps

1. **Run the diagnostic queries** in Supabase SQL Editor
2. **Check console logs** in browser developer tools
3. **Compare SQL results** with dashboard display
4. **Verify date ranges** match expected business logic
5. **Check for data consistency** across tables

## Expected Results

After fixing issues, you should see:
1. **Private Pay Revenue**: Only from `payment_type = 'private_pay'`
2. **Funded Revenue**: Only from `payment_type IN ('vmrc', 'scholarship', 'other')`
3. **No revenue** from NULL, empty, or unknown payment types
4. **Correct date ranges**: Monthly revenue for current month only
5. **Accurate totals**: Sum of all valid attended sessions