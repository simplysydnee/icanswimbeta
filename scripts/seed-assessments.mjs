import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const records = JSON.parse(readFileSync('/tmp/assessment_records_filtered.json', 'utf-8'));

console.log(`Loaded ${records.length} records`);

const BATCH_SIZE = 10;
let inserted = 0;
let errors = 0;

for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);

  const { error } = await supabase
    .from('assessment_reports')
    .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });

  if (error) {
    console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
    errors++;
  } else {
    inserted += batch.length;
  }

  if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= records.length) {
    console.log(`Progress: ${inserted}/${records.length} (${errors} errors)`);
  }
}

// Verify
const { data: { length: finalCount } = { length: 0 }, error: countError } = await supabase
  .from('assessment_reports')
  .select('*', { count: 'exact', head: true });

console.log(`\nResults: ${inserted} inserted, ${errors} batch errors`);
console.log(`Total in table: ${finalCount}`);
