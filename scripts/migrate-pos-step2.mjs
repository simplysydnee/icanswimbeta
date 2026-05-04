// STEP 2 — Insert purchase_orders from CSV
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const FUNDING_SOURCE_ID = 'de392da6-2f26-46a8-9fc1-075e8e973d61';

// Parse CSV
const csv = readFileSync("/Users/sydnee/Documents/PV5780-AUTHORIZATIONS(Authorizations).csv", 'utf-8');
const lines = csv.split('\n');
const rows = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const vals = [];
  let cur = '';
  let inQ = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
    else { cur += c; }
  }
  vals.push(cur.trim());
  rows.push(vals);
}

// Parse date: supports "M/D/YY", "MM/DD/YYYY", "M/D/YYYY"
function parseDate(raw) {
  const s = (raw || '').trim();
  if (!s) return null;
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;
  const month = String(parseInt(parts[0], 10)).padStart(2, '0');
  const day = String(parseInt(parts[1], 10)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse rate: "$175.00", "96.440", "1,157.28" → cents int
function parseRateCents(raw) {
  const s = (raw || '').trim().replace(/,/g, '').replace('$', '');
  if (!s) return null;
  const val = parseFloat(s);
  if (isNaN(val)) return null;
  return Math.round(val * 100);
}

// Extract sessions_authorized from Comments
function parseSessions(raw) {
  const s = (raw || '').trim().toUpperCase();
  const m1 = s.match(/AUTH\s+(\d+)\s+LESSONS?/);
  if (m1) return parseInt(m1[1], 10);
  const m2 = s.match(/AUTH\s+(\d+)\s+SESSION/);
  if (m2) return parseInt(m2[1], 10);
  return 0;
}

// Build set of all UCIs from CSV to do a single swimmer lookup
const uciSet = new Set();
for (const row of rows) {
  const auth = (row[2] || '').trim();
  if (!auth) continue;
  const uci = (row[3] || '').trim();
  if (uci) uciSet.add(uci);
}

console.log(`CSV rows: ${rows.length}`);
console.log(`Non-blank auth numbers to insert: ${rows.filter(r => (r[2]||'').trim()).length}`);
console.log(`Unique UCIs: ${uciSet.size}`);

// Bulk lookup all swimmers by UCI
const { data: allSwimmers, error: swimmerError } = await supabase
  .from('swimmers')
  .select('id, uci_number')
  .in('uci_number', [...uciSet]);

if (swimmerError) {
  console.error('Error looking up swimmers:', swimmerError.message);
  process.exit(1);
}

const uciToSwimmerId = new Map();
for (const s of allSwimmers || []) {
  if (s.uci_number) uciToSwimmerId.set(s.uci_number, s.id);
}

console.log(`Swimmers matched by UCI: ${uciToSwimmerId.size}`);
console.log(`Swimmers NOT found by UCI: ${uciSet.size - uciToSwimmerId.size}`);

// Build purchase_orders records
const records = [];
let skipped = 0;
let nullSwimmer = 0;

for (const row of rows) {
  const auth = (row[2] || '').trim();
  if (!auth) { skipped++; continue; }

  const uci = (row[3] || '').trim();
  let startDate = parseDate(row[9]);
  const endDate = parseDate(row[10]);
  if (!startDate) startDate = endDate; // fallback: start = end
  const rateCents = parseRateCents(row[12]);
  const sessionsAuth = parseSessions(row[15]);
  const approvedAt = parseDate(row[1]);

  const subCode = row[8] || '';
  const poType = subCode.trim().toUpperCase() === 'ASMT' ? 'assessment' : 'lessons';

  const swimmerId = uciToSwimmerId.get(uci) || null;
  if (!swimmerId) nullSwimmer++;

  records.push({
    authorization_number: auth,
    uci_number: uci,
    swimmer_id: swimmerId,
    funding_source_id: FUNDING_SOURCE_ID,
    po_type: poType,
    sub_code: subCode,
    service_code: '102',
    start_date: startDate,
    end_date: endDate,
    rate_cents: rateCents,
    sessions_authorized: sessionsAuth,
    status: 'active',
    billing_status: 'unbilled',
    sessions_booked: 0,
    sessions_used: 0,
    comments: (row[15] || '').trim() || null,
    approved_at: approvedAt,
  });
}

console.log(`\nRecords to insert: ${records.length}`);
console.log(`Skipped (blank auth): ${skipped}`);
console.log(`Null swimmer_id: ${nullSwimmer}`);

// Insert in batches
const BATCH_SIZE = 50;
let inserted = 0;
let errors = 0;

for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);

  const { error } = await supabase
    .from('purchase_orders')
    .upsert(batch, { onConflict: 'authorization_number', ignoreDuplicates: false });

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

console.log(`\n=== STEP 2 INSERT RESULTS ===`);
console.log(`Inserted/upserted: ${inserted}`);
console.log(`Batch errors:      ${errors}`);

// Final verification
const { count: totalCount, error: countError } = await supabase
  .from('purchase_orders')
  .select('*', { count: 'exact', head: true });

const { count: nullCount, error: nullError } = await supabase
  .from('purchase_orders')
  .select('*', { count: 'exact', head: true })
  .is('swimmer_id', null);

if (countError) console.error('Count error:', countError.message);
else console.log(`\nTotal in purchase_orders:    ${totalCount}`);

if (nullError) console.error('Null count error:', nullError.message);
else console.log(`Null swimmer_id:             ${nullCount}`);
