import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Old (wrong) swimmer_id → actual swimmer_id from DB query
const ID_MAP = {
  '9bcf3d02-98ce-4d04-bbb4-3b36dfde8378': '37d1d40c-6321-41fe-a6e0-f44cc8f88395',
  'bc5ef04a-d575-4f4f-8894-430525c59913': '63860d10-6e0a-4803-bfde-b0c1e8374517',
  '6c349b57-dbee-43d9-a7cc-1b72fabc7a6a': 'f80d89fc-c866-4984-aa03-95acf8455ff8',
  '47df4cfd-1ea3-4002-ab77-4de33c123be9': '4b7e9fbc-8563-44fa-b2ad-95278a0516de',
  '37fbdf3d-b565-4277-98bd-c21e7b3f39af': '3a012939-070f-421d-8347-f46a50ecebc1',
  '61929595-f13d-4823-b4a0-887fd4dbea74': '12084b76-cb11-4801-bdab-a4edf49fff4f',
  '74802621-2e43-4666-9ed2-6488f3737a01': 'fd219275-b793-4994-92be-c402fb3d8f5a',
  'eab2b119-596e-428b-bfc9-04473de577c5': '1a7b06fc-a75a-45c0-9743-dfa2ad07045a',
  '8630743d-e9b5-4380-992b-0fc39a7f0e60': 'e1a98e20-8e18-4449-8cc1-c82cb9065d4c',
  '24c322bf-3142-4fc1-b12c-e72410985de7': '4efe006c-718d-47ce-b658-140f503740a8',
  'e070f692-8ffe-4828-8bb2-0d2ec916e9bc': '8491906a-df58-4896-8fec-b1037a18a353',
  '8a44d30b-76c2-4682-96f6-5a6ec2827d13': '6edd8108-1378-40b7-a514-b5bf72b16219',
  '97321c34-b45c-495c-813c-590a16cc93b0': '2dfdc4b5-9034-423f-b675-9b0dc34aa121',
  '6dc39549-adaf-49a1-aa1a-8ea181a4852b': '063f6b62-4015-43f7-953c-142efdd3387c',
  'f7b13711-dd4e-4a83-ba0a-374f50fd1911': '2d640bec-b151-46f9-b3b1-d828a888f170',
  '099ffbb8-0c9a-41d0-8e34-0ca012e0c668': 'ea8ab60d-50e2-4b8e-b021-5eff243078b0',
  '90288a54-6cd5-4ed8-bb7d-e353248106c5': '051539a5-92a7-46ec-8a72-3e204b097892',
  'f154dfc5-ffd6-4238-afcb-aee0e78d3f58': 'd946864d-b06c-4448-b156-6175214019cc',
  '6049e1cf-005d-40bd-b3ef-fd445a52e005': '72d4cdf7-5f43-445e-a458-8451b2aa1921',
  'ad4a04d0-437c-4024-a9c1-c4be26bca613': '8a112468-c701-4b0a-b44d-2503e832e876',
};

const OLD_IDS = new Set(Object.keys(ID_MAP));

// Load all 450 records
const records = JSON.parse(readFileSync('/tmp/assessment_records.json', 'utf-8'));
console.log(`Loaded ${records.length} records`);

// Filter to only the 20 records with old swimmer_ids, and remap their swimmer_id
const toInsert = records
  .filter(r => OLD_IDS.has(r.swimmer_id))
  .map(r => ({
    ...r,
    swimmer_id: ID_MAP[r.swimmer_id],
  }));

console.log(`Filtered to ${toInsert.length} records with old swimmer_ids`);

if (toInsert.length === 0) {
  console.log('No records to insert — all 20 may already be in the table.');
  process.exit(0);
}

// Verify all new swimmer_ids exist in the swimmers table
const { data: existingSwimmers, error: swimmerCheckError } = await supabase
  .from('swimmers')
  .select('id')
  .in('id', toInsert.map(r => r.swimmer_id));

if (swimmerCheckError) {
  console.error('Error checking swimmers:', swimmerCheckError.message);
  process.exit(1);
}

const existingIds = new Set((existingSwimmers || []).map(s => s.id));
const stillMissing = toInsert.filter(r => !existingIds.has(r.swimmer_id));
if (stillMissing.length > 0) {
  console.error(`ERROR: ${stillMissing.length} new swimmer_ids still don't exist in swimmers table:`);
  stillMissing.forEach(r => console.error(`  ${r.swimmer_id} (was: ${r.swimmer_id === ID_MAP[r.swimmer_id] ? 'same' : 'mapped'})`));
  process.exit(1);
}

console.log(`All ${toInsert.length} records have valid swimmer_ids. Proceeding with upsert...`);

// Insert in batches of 10
const BATCH_SIZE = 10;
let inserted = 0;
let errors = 0;

for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
  const batch = toInsert.slice(i, i + BATCH_SIZE);

  const { error } = await supabase
    .from('assessment_reports')
    .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });

  if (error) {
    console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
    errors++;
    if (error.message.includes('column')) {
      console.error('Sample record:', JSON.stringify(batch[0], null, 2));
    }
  } else {
    inserted += batch.length;
  }

  if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= toInsert.length) {
    console.log(`Progress: ${inserted}/${toInsert.length} (${errors} errors)`);
  }
}

console.log(`\nResults: ${inserted} upserted, ${errors} batch errors`);

// Final verification
const { count: finalCount, error: countError } = await supabase
  .from('assessment_reports')
  .select('*', { count: 'exact', head: true });

if (countError) {
  console.error('Count error:', countError.message);
} else {
  console.log(`Total in table: ${finalCount}`);
}
