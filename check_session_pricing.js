const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSessionPricing() {
  console.log('Checking session pricing...');

  // Check distinct price_cents values
  const { data: priceData, error: priceError } = await supabase
    .from('sessions')
    .select('price_cents')
    .not('price_cents', 'is', null);

  if (priceError) {
    console.error('Error checking prices:', priceError);
    return;
  }

  const priceCounts = {};
  priceData.forEach(row => {
    priceCounts[row.price_cents] = (priceCounts[row.price_cents] || 0) + 1;
  });

  console.log('Session Price Distribution (in cents):');
  Object.entries(priceCounts).forEach(([price, count]) => {
    console.log(`  $${(price / 100).toFixed(2)} (${price} cents): ${count} sessions`);
  });

  // Check bookings with session and swimmer data for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthUTC = startOfMonth.toISOString();
  const nowUTC = now.toISOString();

  console.log(`\nChecking bookings for current month (${startOfMonthUTC} to ${nowUTC})...`);

  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      session:sessions(
        price_cents,
        start_time
      ),
      swimmer:swimmers(
        payment_type
      )
    `)
    .or('status.eq.confirmed,status.eq.completed')
    .gte('session.start_time', startOfMonthUTC)
    .lt('session.start_time', nowUTC);

  if (bookingError) {
    console.error('Error checking bookings:', bookingError);
    return;
  }

  console.log(`\nFound ${bookingData?.length || 0} bookings for current month`);

  let privatePayRevenue = 0;
  let fundedRevenue = 0;
  let privatePayCount = 0;
  let fundedCount = 0;
  let skippedCount = 0;

  bookingData?.forEach(booking => {
    if (!booking.session || !booking.swimmer) {
      skippedCount++;
      return;
    }

    const sessionStartTime = new Date(booking.session.start_time);
    const now = new Date();

    const isAttended =
      booking.status === 'completed' ||
      (booking.status === 'confirmed' && sessionStartTime < now);

    if (!isAttended) {
      skippedCount++;
      return;
    }

    const priceCents = booking.session.price_cents || 0;
    const priceDollars = priceCents / 100;

    if (booking.swimmer.payment_type === 'private_pay') {
      privatePayRevenue += priceDollars;
      privatePayCount++;
    } else if (['vmrc', 'scholarship', 'other'].includes(booking.swimmer.payment_type)) {
      fundedRevenue += priceDollars;
      fundedCount++;
    } else {
      skippedCount++;
    }
  });

  console.log(`\nRevenue Calculation Results:`);
  console.log(`  Private Pay: ${privatePayCount} bookings, $${privatePayRevenue.toFixed(2)}`);
  console.log(`  Funded: ${fundedCount} bookings, $${fundedRevenue.toFixed(2)}`);
  console.log(`  Skipped: ${skippedCount} bookings`);
  console.log(`  Total: $${(privatePayRevenue + fundedRevenue).toFixed(2)}`);

  // Check if amounts are identical
  if (privatePayRevenue.toFixed(2) === fundedRevenue.toFixed(2)) {
    console.log(`\n⚠️ WARNING: Private Pay and Funded revenue are IDENTICAL: $${privatePayRevenue.toFixed(2)}`);
    console.log(`  This suggests a bug in the revenue calculation logic.`);
  }
}

checkSessionPricing();