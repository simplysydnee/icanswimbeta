// STEP 1 (improved) — Update swimmers.uci_number from CSV with prefix matching for truncated names
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

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

// Build unique name combos
const comboMap = new Map();
for (const row of rows) {
  const auth = (row[2] || '').trim();
  if (!auth) continue;
  const uci = (row[3] || '').trim();
  let first = (row[4] || '').trim().toUpperCase();
  let last = (row[5] || '').trim().toUpperCase();
  if (last.split(' ').length >= 3 && first.length <= 2) {
    const parts = last.split(' ');
    first = parts[parts.length - 1];
    last = parts.slice(0, -1).join(' ');
  }
  const key = `${uci}|${first}|${last}`;
  if (!comboMap.has(key)) {
    comboMap.set(key, { uci, first, last });
  }
}

const combos = [...comboMap.values()];
console.log(`Unique UCI+name combos: ${combos.length}`);

let updated = 0;
let noMatch = 0;
let alreadySet = 0;
let matchErrors = 0;
const noMatchDetails = [];
const ambiguousMatchDetails = [];

for (const combo of combos) {
  const { uci, first, last } = combo;

  // Try exact match first
  let { data: swimmers, error: findError } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name, uci_number')
    .ilike('first_name', first)
    .ilike('last_name', last);

  if (findError) {
    console.error(`  Error looking up ${first} ${last}: ${findError.message}`);
    matchErrors++;
    continue;
  }

  // If no exact match, try prefix matching (truncated names)
  if (!swimmers || swimmers.length === 0) {
    const { data: prefixSwimmers } = await supabase
      .from('swimmers')
      .select('id, first_name, last_name, uci_number')
      .ilike('first_name', first + '%')
      .ilike('last_name', last + '%');

    if (prefixSwimmers && prefixSwimmers.length > 0) {
      swimmers = prefixSwimmers;
    }
  }

  if (!swimmers || swimmers.length === 0) {
    noMatch++;
    if (noMatchDetails.length < 50) noMatchDetails.push(`${first} ${last} (UCI=${uci})`);
    continue;
  }

  if (swimmers.length > 1) {
    // Multiple matches — try exact UCI match
    const exactUci = swimmers.find(s => s.uci_number === uci);
    if (exactUci) {
      alreadySet++;
      continue;
    }
    const nullUci = swimmers.find(s => !s.uci_number || s.uci_number === '');
    if (nullUci) {
      const { error: updError } = await supabase
        .from('swimmers')
        .update({ uci_number: uci })
        .eq('id', nullUci.id);
      if (!updError) {
        updated++;
        continue;
      }
    }
    noMatch++;
    if (ambiguousMatchDetails.length < 20) {
      ambiguousMatchDetails.push(`${first} ${last} (UCI=${uci}) — ${swimmers.length} matches: ${swimmers.map(s => `${s.first_name} ${s.last_name}`).join(', ')}`);
    }
    continue;
  }

  const swimmer = swimmers[0];

  if (swimmer.uci_number && swimmer.uci_number !== '') {
    if (swimmer.uci_number === uci) {
      alreadySet++;
    } else {
      noMatch++;
      if (noMatchDetails.length < 50) {
        noMatchDetails.push(`${first} ${last} — UCI mismatch: has ${swimmer.uci_number}, csv ${uci}`);
      }
    }
    continue;
  }

  // Update UCI
  const { error: updError } = await supabase
    .from('swimmers')
    .update({ uci_number: uci })
    .eq('id', swimmer.id);

  if (updError) {
    console.error(`  Error updating ${first} ${last} (${swimmer.first_name} ${swimmer.last_name}): ${updError.message}`);
    matchErrors++;
  } else {
    updated++;
    if (first !== swimmer.first_name.toUpperCase() || last !== swimmer.last_name.toUpperCase()) {
      console.log(`  ✓ Prefix match: CSV="${first} ${last}" → DB="${swimmer.first_name} ${swimmer.last_name}" (uci=${uci})`);
    }
  }
}

console.log(`\n=== STEP 1 RESULTS ===`);
console.log(`Updated (UCI was null/empty): ${updated}`);
console.log(`Already had correct UCI:     ${alreadySet}`);
console.log(`No name match:               ${noMatch}`);
console.log(`Errors:                      ${matchErrors}`);

if (noMatchDetails.length > 0) {
  console.log(`\nNo match details (${noMatchDetails.length}):`);
  for (const d of noMatchDetails) {
    console.log(`  ${d}`);
  }
}
if (ambiguousMatchDetails.length > 0) {
  console.log(`\nAmbiguous (${ambiguousMatchDetails.length}):`);
  for (const d of ambiguousMatchDetails) {
    console.log(`  ${d}`);
  }
}
