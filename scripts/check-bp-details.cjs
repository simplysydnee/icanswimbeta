const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const threeMonthsAgo = '2026-02-19';

async function run() {
  const { data: all, error } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name, approval_status, enrollment_status, aggressive_behavior, aggressive_behavior_description, has_behavior_plan, self_injurious_behavior, self_injurious_behavior_description, medical_conditions_description, important_notes, admin_notes, diagnosis')
    .gte('created_at', threeMonthsAgo)
    .eq('enrollment_status', 'waitlist')
    .eq('has_behavior_plan', true)
    .neq('aggressive_behavior', true);

  if (error) { console.error(error); return; }

  console.log(`Found ${all.length} behavior plan (no aggressive flag) on waitlist:\n`);

  for (const s of all) {
    const isLakyn = s.first_name.toLowerCase().includes('lakyn');
    console.log(`--- ${s.first_name} ${s.last_name} (${isLakyn ? '★ WILL PEND ★' : s.approval_status}) ---`);
    if (s.self_injurious_behavior) console.log(`  Self-injury: ${s.self_injurious_behavior_description || 'Yes'}`);
    if (s.aggressive_behavior_description && s.aggressive_behavior_description.toLowerCase() !== 'n/a') console.log(`  Aggressive desc: ${s.aggressive_behavior_description}`);
    if (s.medical_conditions_description && s.medical_conditions_description.toLowerCase() !== 'n/a' && s.medical_conditions_description.toLowerCase() !== 'none') console.log(`  Medical: ${s.medical_conditions_description}`);
    if (s.important_notes && s.important_notes.length) console.log(`  Important notes: ${s.important_notes.join(' | ')}`);
    if (s.admin_notes) console.log(`  Admin notes: ${s.admin_notes}`);
    if (s.diagnosis && s.diagnosis.length) console.log(`  Diagnosis: ${s.diagnosis.join(', ')}`);
    console.log();
  }

  // Also update Lakyn
  const lakyn = all.find(s => s.first_name.toLowerCase().includes('lakyn'));
  if (lakyn) {
    const { data: updated, error: err } = await supabase
      .from('swimmers')
      .update({ approval_status: 'pending' })
      .eq('id', lakyn.id)
      .select('first_name, last_name, approval_status');

    if (err) console.error('Update error:', err);
    else console.log(`✓ ${updated[0].first_name} ${updated[0].last_name} → ${updated[0].approval_status}`);
  }
}

run();
