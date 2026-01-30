const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPaymentTypes() {
  console.log('Checking payment type distribution...');

  const { data, error } = await supabase
    .from('swimmers')
    .select('payment_type')
    .not('payment_type', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const counts = {};
  data.forEach(row => {
    counts[row.payment_type] = (counts[row.payment_type] || 0) + 1;
  });

  console.log('Payment Type Distribution:');
  Object.entries(counts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log(`\nTotal swimmers with payment_type: ${data.length}`);
}

checkPaymentTypes();