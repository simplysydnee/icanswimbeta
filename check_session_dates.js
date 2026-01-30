const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSessionDates() {
  console.log('Checking session dates...');

  // Get min and max session dates
  const { data: dateRange, error: rangeError } = await supabase
    .from('sessions')
    .select('start_time')
    .order('start_time', { ascending: true })
    .limit(1);

  if (rangeError) {
    console.error('Error getting min date:', rangeError);
    return;
  }

  const { data: maxDateData, error: maxError } = await supabase
    .from('sessions')
    .select('start_time')
    .order('start_time', { ascending: false })
    .limit(1);

  if (maxError) {
    console.error('Error getting max date:', maxError);
    return;
  }

  const minDate = dateRange?.[0]?.start_time;
  const maxDate = maxDateData?.[0]?.start_time;

  console.log(`Session date range: ${minDate} to ${maxDate}`);

  // Check sessions by month
  const { data: monthlyCounts, error: monthlyError } = await supabase
    .from('sessions')
    .select('start_time');

  if (monthlyError) {
    console.error('Error getting monthly counts:', monthlyError);
    return;
  }

  const monthCounts = {};
  monthlyCounts?.forEach(session => {
    const date = new Date(session.start_time);
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
  });

  console.log('\nSessions by month:');
  Object.entries(monthCounts).sort().forEach(([month, count]) => {
    console.log(`  ${month}: ${count} sessions`);
  });

  // Check bookings by month
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      session:sessions(
        start_time
      )
    `)
    .not('session.start_time', 'is', null);

  if (bookingsError) {
    console.error('Error getting bookings:', bookingsError);
    return;
  }

  const bookingMonthCounts = {};
  bookings?.forEach(booking => {
    if (booking.session?.start_time) {
      const date = new Date(booking.session.start_time);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      bookingMonthCounts[monthYear] = (bookingMonthCounts[monthYear] || 0) + 1;
    }
  });

  console.log('\nBookings by month:');
  Object.entries(bookingMonthCounts).sort().forEach(([month, count]) => {
    console.log(`  ${month}: ${count} bookings`);
  });

  // Check January 2026 specifically
  const jan2026Start = '2026-01-01T00:00:00.000Z';
  const feb2026Start = '2026-02-01T00:00:00.000Z';

  const { data: jan2026Bookings, error: janError } = await supabase
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
    .gte('session.start_time', jan2026Start)
    .lt('session.start_time', feb2026Start);

  if (janError) {
    console.error('Error getting Jan 2026 bookings:', janError);
    return;
  }

  console.log(`\nJanuary 2026 bookings: ${jan2026Bookings?.length || 0}`);

  let privatePayRevenue = 0;
  let fundedRevenue = 0;
  let privatePayCount = 0;
  let fundedCount = 0;

  jan2026Bookings?.forEach(booking => {
    if (!booking.session || !booking.swimmer) return;

    const sessionStartTime = new Date(booking.session.start_time);
    const now = new Date();

    const isAttended =
      booking.status === 'completed' ||
      (booking.status === 'confirmed' && sessionStartTime < now);

    if (!isAttended) return;

    const priceCents = booking.session.price_cents || 0;
    const priceDollars = priceCents / 100;

    if (booking.swimmer.payment_type === 'private_pay') {
      privatePayRevenue += priceDollars;
      privatePayCount++;
    } else {
      fundedRevenue += priceDollars;
      fundedCount++;
    }
  });

  console.log(`January 2026 Revenue:`);
  console.log(`  Private Pay: ${privatePayCount} bookings, $${privatePayRevenue.toFixed(2)}`);
  console.log(`  Funded: ${fundedCount} bookings, $${fundedRevenue.toFixed(2)}`);
  console.log(`  Total: $${(privatePayRevenue + fundedRevenue).toFixed(2)}`);
}

checkSessionDates();