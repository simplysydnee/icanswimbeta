# Funding Source Revenue Calculation Fixes

## 🎯 **Critical Issue Fixed**

The revenue calculations were incorrectly using `'vmrc'` as a payment type, but the system has been migrated to support **multiple funding sources** with the payment type `'funding_source'`.

## 📊 **Database Schema Update**

**Migration File**: `supabase/migrations/012_create_funding_sources_system.sql`

### Key Changes:
1. **New Table**: `funding_sources` - Stores multiple funding sources (VMRC, CVRC, etc.)
2. **Updated Swimmers Table**:
   - Added `funding_source_id` (references `funding_sources.id`)
   - Changed `payment_type` constraint to include `'funding_source'` instead of `'vmrc'`
   - Removed VMRC-specific columns
3. **Payment Types** (from [src/lib/constants.ts:80-83](src/lib/constants.ts#L80-L83)):
   - `'private_pay'` - Private Pay Revenue
   - `'funding_source'` - Funded Revenue (connected to specific funding source)
   - `'scholarship'` - Funded Revenue (special case)
   - `'other'` - Funded Revenue (other funding types)

## 🔧 **Files Updated**

### 1. [src/app/admin/page.tsx](src/app/admin/page.tsx)
- **Line 112**: Changed funded count query from `['vmrc', 'scholarship', 'other']` to `['funding_source', 'scholarship', 'other']`
- **Line 240**: Changed revenue routing from `['vmrc', 'scholarship', 'other']` to `['funding_source', 'scholarship', 'other']`

### 2. [src/app/api/reports/billing/route.ts](src/app/api/reports/billing/route.ts)
- **Line 230**: Changed revenue routing from `['vmrc', 'scholarship', 'other']` to `['funding_source', 'scholarship', 'other']`

### 3. [src/hooks/useAdminRevenue.ts](src/hooks/useAdminRevenue.ts)
- **Line 104**: Changed revenue routing from `['vmrc', 'scholarship', 'other']` to `['funding_source', 'scholarship', 'other']`
- **Fixed floating point issues**: Now calculates in cents, converts to dollars at the end

## ✅ **Correct Business Logic**

### Revenue Counting Rules:
- ✅ `completed` bookings → Always count as revenue
- ✅ `confirmed` bookings with past session dates → Count as revenue
- ✅ `confirmed` bookings with future dates → Do NOT count as revenue
- ✅ `cancelled`/`no_show` bookings → Do NOT count as revenue

### Revenue Type Determination:
- ✅ `payment_type = 'private_pay'` → **Private Pay Revenue**
- ✅ `payment_type = 'funding_source'` → **Funded Revenue** (connected to specific funding source via `funding_source_id`)
- ✅ `payment_type = 'scholarship'` → **Funded Revenue** (special case)
- ✅ `payment_type = 'other'` → **Funded Revenue** (other funding types)
- ✅ NULL/empty/unknown payment types → **Excluded** (logged as warnings)

## 🧪 **Updated Diagnostic Queries**

### 1. Check Current Payment Types Distribution:
```sql
SELECT
  payment_type,
  COUNT(*) as swimmer_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM swimmers
GROUP BY payment_type
ORDER BY swimmer_count DESC;
```

### 2. Verify Funding Source Connections:
```sql
SELECT
  s.payment_type,
  fs.name as funding_source_name,
  COUNT(*) as swimmer_count
FROM swimmers s
LEFT JOIN funding_sources fs ON s.funding_source_id = fs.id
WHERE s.payment_type = 'funding_source'
GROUP BY s.payment_type, fs.name
ORDER BY swimmer_count DESC;
```

### 3. Revenue Calculation Verification:
```sql
WITH revenue_data AS (
  SELECT
    b.id as booking_id,
    b.status as booking_status,
    s.payment_type as swimmer_payment_type,
    fs.name as funding_source_name,
    ses.price_cents,
    ses.start_time,
    CASE
      WHEN b.status = 'completed' THEN TRUE
      WHEN b.status = 'confirmed' AND ses.start_time < NOW() THEN TRUE
      ELSE FALSE
    END as should_count
  FROM bookings b
  JOIN swimmers s ON b.swimmer_id = s.id
  LEFT JOIN funding_sources fs ON s.funding_source_id = fs.id
  JOIN sessions ses ON b.session_id = ses.id
  WHERE (b.status = 'confirmed' OR b.status = 'completed')
    AND ses.start_time >= DATE_TRUNC('month', NOW())
    AND ses.start_time < NOW()
)
SELECT
  swimmer_payment_type,
  funding_source_name,
  COUNT(*) as total_bookings,
  SUM(CASE WHEN should_count THEN 1 ELSE 0 END) as counted_bookings,
  SUM(CASE WHEN should_count THEN price_cents ELSE 0 END) as total_cents,
  ROUND(SUM(CASE WHEN should_count THEN price_cents ELSE 0 END) / 100.0, 2) as total_dollars
FROM revenue_data
GROUP BY swimmer_payment_type, funding_source_name
ORDER BY swimmer_payment_type, total_dollars DESC;
```

## 🚨 **Common Mistakes to Avoid**

1. **Never use `'vmrc'` as payment type** - It's now `'funding_source'`
2. **Always check `funding_source_id`** for funded swimmers to identify specific funding sources
3. **Use LEFT JOIN for funding_sources** - Not all funded swimmers may have a funding source assigned
4. **Calculate in cents** to avoid floating point precision issues
5. **Include all funded payment types**: `['funding_source', 'scholarship', 'other']`

## 🔍 **How to Test**

1. **Check browser console** for detailed revenue calculation logs
2. **Run SQL verification queries** above
3. **Verify funding source connections** in the admin interface
4. **Monitor `skippedCount`** to identify data quality issues
5. **Compare dashboard totals** with SQL query results

## 📈 **Expected Results**

- **Private Pay Revenue**: Only from `payment_type = 'private_pay'`
- **Funded Revenue**: From `payment_type IN ('funding_source', 'scholarship', 'other')`
- **Funding Source Details**: Available via `funding_source_id` → `funding_sources` table
- **Accurate totals**: No floating point rounding errors
- **Proper logging**: Detailed debug output for troubleshooting

## 🚀 **Next Steps**

1. **Deploy changes** and monitor console logs
2. **Run verification queries** to confirm calculations
3. **Update any other code** that might still reference `'vmrc'` payment type
4. **Consider enhancing reports** to show breakdown by specific funding source
5. **Add data validation** to ensure all `funding_source` swimmers have a `funding_source_id`