const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '/Users/sydnee/icanswimbeta/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function main() {
  const now = new Date();

  // Base: all waitlisted + approved in last 3 months
  const { data: base, error: e1 } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name, date_of_birth, approved_at, aggressive_behavior, aggressive_behavior_description, has_behavior_plan, history_of_seizures, seizures_description')
    .eq('enrollment_status', 'waitlist')
    .eq('approval_status', 'approved')
    .gte('approved_at', '2026-02-14');

  if (e1) { console.error('Error:', e1); return; }

  // Enrich with age
  const swimmers = base.map(s => {
    const dob = s.date_of_birth ? new Date(s.date_of_birth) : null;
    const age = dob ? Math.floor((now - dob) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    return { ...s, age };
  });

  // Criteria
  // 1. Over 13 AND (aggressive OR behavior plan OR seizures)
  const over13Flagged = swimmers.filter(s =>
    s.age !== null && s.age >= 13 &&
    (s.aggressive_behavior || s.has_behavior_plan || s.history_of_seizures)
  );

  // 2. Any age with seizures
  const seizuresAnyAge = swimmers.filter(s => s.history_of_seizures);

  // 3. Any age with biting (in aggressive_behavior_description)
  const bitingAnyAge = swimmers.filter(s =>
    s.aggressive_behavior_description &&
    s.aggressive_behavior_description.toLowerCase().includes('bite')
  );

  // Combined unique set
  const declineIds = new Set();
  const declineSwimmers = [];

  for (const s of [...over13Flagged, ...seizuresAnyAge, ...bitingAnyAge]) {
    if (!declineIds.has(s.id)) {
      declineIds.add(s.id);
      declineSwimmers.push(s);
    }
  }

  // Sort by age descending
  declineSwimmers.sort((a, b) => (b.age || 0) - (a.age || 0));

  console.log('=== DECLINE CANDIDATES (over-13-flagged ∪ seizures ∪ biting) ===\n');
  console.log('Total to decline: ' + declineSwimmers.length + '\n');

  // Breakdown by category
  const hasSeizures = declineSwimmers.filter(s => s.history_of_seizures);
  const hasBiting = declineSwimmers.filter(s =>
    s.aggressive_behavior_description &&
    s.aggressive_behavior_description.toLowerCase().includes('bite')
  );
  const over13Only = declineSwimmers.filter(s =>
    s.age !== null && s.age >= 13 &&
    !s.history_of_seizures &&
    !(s.aggressive_behavior_description && s.aggressive_behavior_description.toLowerCase().includes('bite'))
  );

  console.log('Category breakdown:');
  console.log('  Over 13 + flagged (no seizures/biting overlap): ' + over13Only.length);
  console.log('  Seizures (any age): ' + hasSeizures.length);
  console.log('  Biting (any age): ' + hasBiting.length);
  console.log('');

  // Check for overlap
  const seizureAndBiting = hasSeizures.filter(s =>
    s.aggressive_behavior_description && s.aggressive_behavior_description.toLowerCase().includes('bite')
  );
  console.log('  Overlap (seizures + biting): ' + seizureAndBiting.length);
  console.log('  Overlap (seizures + over-13): ' + hasSeizures.filter(s => s.age >= 13).length);
  console.log('');

  // List all
  declineSwimmers.forEach((s, i) => {
    const reasons = [];
    if (s.age !== null && s.age >= 13) reasons.push('OVER13');
    if (s.history_of_seizures) reasons.push('SEIZURES');
    if (s.aggressive_behavior) reasons.push('AGGRESSIVE');
    if (s.has_behavior_plan) reasons.push('BP');
    const biteNote = s.aggressive_behavior_description && s.aggressive_behavior_description.toLowerCase().includes('bite') ? ' [BITES]' : '';
    const ageStr = s.age !== null ? s.age : '?';
    console.log((i+1) + '. ' + s.first_name + ' ' + s.last_name + ' (age ' + ageStr + ') [' + reasons.join(',') + ']' + biteNote);
    if (s.aggressive_behavior_description) {
      console.log('   Agg desc: ' + s.aggressive_behavior_description);
    }
    if (s.seizures_description) {
      console.log('   Seizures: ' + s.seizures_description);
    }
  });

  console.log('\n=== FINAL ===');
  console.log('Total to decline: ' + declineSwimmers.length);
}

main().catch(console.error);
