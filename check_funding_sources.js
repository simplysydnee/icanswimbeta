const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFundingSources() {
  console.log('Checking funding sources...');

  // Check funding_sources table
  const { data: fundingSources, error: fundingError } = await supabase
    .from('funding_sources')
    .select('*');

  if (fundingError) {
    console.error('Error checking funding sources:', fundingError);
  } else {
    console.log(`\nFunding Sources (${fundingSources?.length || 0}):`);
    fundingSources?.forEach(source => {
      console.log(`  ${source.name} (${source.id}): ${source.description || 'No description'}`);
    });
  }

  // Check swimmers with funding_source_id
  const { data: swimmersWithFunding, error: swimmersError } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name, payment_type, funding_source_id')
    .not('funding_source_id', 'is', null)
    .limit(10);

  if (swimmersError) {
    console.error('Error checking swimmers with funding:', swimmersError);
  } else {
    console.log(`\nSwimmers with funding_source_id (first 10):`);
    swimmersWithFunding?.forEach(swimmer => {
      console.log(`  ${swimmer.first_name} ${swimmer.last_name}: payment_type=${swimmer.payment_type}, funding_source_id=${swimmer.funding_source_id}`);
    });
  }

  // Check if payment_type and funding_source_id are consistent
  const { data: allSwimmers, error: allError } = await supabase
    .from('swimmers')
    .select('payment_type, funding_source_id')
    .limit(100);

  if (allError) {
    console.error('Error checking all swimmers:', allError);
  } else {
    const counts = {
      private_pay_with_funding: 0,
      private_pay_no_funding: 0,
      vmrc_with_funding: 0,
      vmrc_no_funding: 0,
      other_with_funding: 0,
      other_no_funding: 0
    };

    allSwimmers?.forEach(swimmer => {
      const hasFunding = !!swimmer.funding_source_id;
      if (swimmer.payment_type === 'private_pay') {
        if (hasFunding) counts.private_pay_with_funding++;
        else counts.private_pay_no_funding++;
      } else if (swimmer.payment_type === 'vmrc') {
        if (hasFunding) counts.vmrc_with_funding++;
        else counts.vmrc_no_funding++;
      } else {
        if (hasFunding) counts.other_with_funding++;
        else counts.other_no_funding++;
      }
    });

    console.log('\nPayment Type vs Funding Source Consistency:');
    console.log(`  Private Pay with funding source: ${counts.private_pay_with_funding}`);
    console.log(`  Private Pay without funding source: ${counts.private_pay_no_funding}`);
    console.log(`  VMRC with funding source: ${counts.vmrc_with_funding}`);
    console.log(`  VMRC without funding source: ${counts.vmrc_no_funding}`);
    console.log(`  Other with funding source: ${counts.other_with_funding}`);
    console.log(`  Other without funding source: ${counts.other_no_funding}`);
  }
}

checkFundingSources();