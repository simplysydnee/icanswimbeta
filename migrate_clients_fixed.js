/**
 * I Can Swim — Airtable → Supabase Client Migration
 *
 * Run: node migrate_clients_fixed.js
 *
 * Order of operations:
 *   1. Load + parse CSV
 *   2. Filter out already migrated and pending VMRC referrals
 *   3. Create coordinator stub profiles (no auth)
 *   4. Create parent profiles (no auth) — deduped by email
 *   5. Create swimmer rows linked to parents
 *   6. Create instructor assignments for priority booking swimmers
 *   7. Write Supabase ID + Parent ID back to Airtable
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role key — bypasses RLS
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'appa5hlX697VP1FSo'; // active base
const CSV_PATH = '/Users/sydnee/Documents/Clients-Data Migration Supabase.csv';
const DRY_RUN = process.env.DRY_RUN === 'true'; // set DRY_RUN=true to preview without writing
const TEST_LIMIT = process.env.TEST_LIMIT ? parseInt(process.env.TEST_LIMIT) : null; // set TEST_LIMIT=5 to run only first N records

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY env var');
  console.error('Set it with: export SUPABASE_SERVICE_KEY=your_service_key_here');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ── Funding source IDs (from Supabase) ───────────────────────────────────────
const FUNDING_IDS = {
  VMRC: 'de392da6-2f26-46a8-9fc1-075e8e973d61',
  CVRC: '40a34677-67c9-47a4-a4ad-423642c0c581',
  SD:   'ff08a1ec-7513-46cb-b7e7-e8ddf6c3919a',
  SDM:  '6f290515-c9ff-4151-8ca4-f367e782fa0f',
  PRIVATE:    '5be04fb2-39e9-4764-8cd8-2ab03ad491b6',
  SCHOLARSHIP: 'bfad73b8-397a-40ae-9d1c-89215b9670cc',
};

// ── Instructor name → UUID map (from Supabase profiles) ──────────────────────
const INSTRUCTOR_IDS = {
  alexis:    'b8e1ac20-451d-4f54-a13c-64331e3738fe',
  alyah:     'bd9e85d8-8c37-45ee-9333-19ec30127118',
  brooke:    '8f0a0731-3ded-4540-a982-c284334dfec2',
  desiree:   'b54af6c0-aa0e-4602-bd35-7848babb1196',
  jada:      'f4c0461c-6e2c-4c46-b663-0005535fe67f',
  jennifer:  '5433b1ee-95cd-4887-bcac-c92ae26b26b4',
  lauren:    '1a79854a-1d69-4a47-affc-82de7956511a',
  lina:      '85db05a3-ef17-4bf3-ae31-1ca172cbc073',
  megan:     '6ecfee52-a52e-4274-bbd8-b7c8360cb4a7',
  stephanie: 'af2c2885-ff59-4ccb-890f-3b09150c7876',
  sutton:    '00fbcc63-4fe9-4069-b03c-4476e2b26aa8',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseBoolean(val) {
  if (!val) return false;
  const v = val.toString().trim().toLowerCase();
  return ['yes', 'true', 'checked', '1', 'y'].includes(v);
}

function parseDate(val) {
  if (!val || !val.trim()) return null;
  // Handle M/D/YYYY, M/D/YYYY H:MMam etc
  const clean = val.trim().split(' ')[0]; // drop time part
  const parts = clean.split('/');
  if (parts.length === 3) {
    const [m, d, y] = parts;
    const month = m.padStart(2, '0');
    const day = d.padStart(2, '0');
    return `${y}-${month}-${day}`;
  }
  return null;
}

function parseDateTime(val) {
  if (!val || !val.trim()) return null;
  try {
    // Try to parse the date string
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (e) {
    return null;
  }
}

function parseArray(val) {
  if (!val || !val.trim()) return [];
  // Handle CSV-quoted multi-values: "Autism,Speech Delay" or simple "Autism"
  return val.replace(/^"|"$/g, '').split(',').map(s => s.trim()).filter(Boolean);
}

function mapStatus(raw) {
  if (!raw || !raw.trim()) return 'pending_enrollment'; // blank = pending enrollment

  // Strip trailing/leading whitespace and take first segment if comma-separated
  // (handles "Confirm referral received email,Waitlist ⏳" → "Waitlist ⏳")
  // (handles "Actively Enrolled ✅,Priority Booking" → "Actively Enrolled ✅")
  const first = raw.trim().split(',')[0].trim();

  const map = {
    'Actively Enrolled ✅':        'enrolled',
    'Waitlist ⏳':                  'waitlist',
    'Pending Approval 🔔':          'pending_approval',
    'Pending Parent Enrollment 📝': 'pending_enrollment',
    'Enrollment Expired ⛔️':        'enrollment_expired',
    'Declined 🚫':                  'declined',
    'Dropped ⚠️':                   'dropped',
    'Pending VMRC Referral  📣':    'pending_referral',
    'Pending VMRC Referral 📣':     'pending_referral',
    'Floating':                     'enrolled',
    'Confirm referral received email': 'pending_enrollment', // trigger artifact
  };

  return map[first] || 'pending_enrollment';
}

function mapFundingSource(row) {
  const vmrcClient = row['VMRC Client']?.trim().toUpperCase();
  const vmrcReferral = row['VMRC Referral ']?.trim().toLowerCase();
  const isVmrc = vmrcClient === 'YES' || vmrcClient === 'Y' || vmrcReferral === 'checked';

  if (isVmrc) return FUNDING_IDS.VMRC;
  return FUNDING_IDS.PRIVATE;
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone.trim() || null; // return as-is if can't normalize
}

function splitName(fullName) {
  const trimmed = fullName?.trim() || '';
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx === -1) return { first: trimmed, last: '' };
  return {
    first: trimmed.substring(0, spaceIdx).trim(),
    last: trimmed.substring(spaceIdx + 1).trim(),
  };
}

function isPriorityBooking(raw) {
  if (!raw || !raw.trim()) return false;
  const status = raw.trim();
  return status.includes('Priority Booking');
}

// ── Stats tracking ────────────────────────────────────────────────────────────
const stats = {
  total: 0,
  filtered: 0,
  coordinatorsCreated: 0,
  coordinatorsSkipped: 0,
  parentsCreated: 0,
  parentsSkipped: 0,
  swimmersCreated: 0,
  swimmersSkipped: 0,
  assignmentsCreated: 0,
  errors: [],
  airtableUpdated: 0,
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏊 I Can Swim — Client Migration`);
  console.log(`   Mode: ${DRY_RUN ? '🔍 DRY RUN (no writes)' : '🚀 LIVE'}`);
  console.log(`   CSV: ${CSV_PATH}\n`);

  // 1. Load CSV
  const raw = fs.readFileSync(CSV_PATH, 'utf-8').replace(/^\uFEFF/, ''); // strip BOM
  const rows = parse(raw, { columns: true, skip_empty_lines: true });
  stats.total = rows.length;
  console.log(`📋 Loaded ${rows.length} records\n`);

  // 2. Filter rows
  console.log('── Filtering records ──────────────────────────────────');
  const activeRows = rows.filter(row => {
    // Skip already migrated records
    if (row['Supabase Migrated'] === 'true') {
      return false;
    }

    // Skip pending VMRC referrals
    const status = row['Status']?.trim();
    if (status && status.includes('Pending VMRC Referral')) {
      return false;
    }

    return true;
  });

  // Apply TEST_LIMIT if set
  const rowsToProcess = TEST_LIMIT ? activeRows.slice(0, TEST_LIMIT) : activeRows;
  stats.filtered = rowsToProcess.length;

  console.log(`   Total records: ${rows.length}`);
  console.log(`   Already migrated: ${rows.length - activeRows.length}`);
  console.log(`   Records to process: ${rowsToProcess.length}`);
  if (TEST_LIMIT) {
    console.log(`   (Limited to first ${TEST_LIMIT} records)`);
  }
  console.log('');

  // 3. Build coordinator map: email → { name, email }
  console.log('── Step 1: Coordinator Stubs ──────────────────────────');
  const coordMap = new Map(); // email → supabase profile id
  const uniqueCoords = new Map();
  for (const row of rowsToProcess) {
    const email = row['Email of VMRC Coordinator']?.trim().toLowerCase();
    const name  = row['VMRC Coordinator']?.trim();
    if (email && name && !uniqueCoords.has(email)) {
      uniqueCoords.set(email, name);
    }
  }
  console.log(`   Found ${uniqueCoords.size} unique coordinators`);

  for (const [email, name] of uniqueCoords) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      coordMap.set(email, existing.id);
      stats.coordinatorsSkipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`   [DRY] Would create coordinator: ${name} <${email}>`);
      stats.coordinatorsCreated++;
      continue;
    }

    // Create auth user first (email_confirm: true = no email sent)
    // Profile is auto-created by on_auth_user_created trigger
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // suppresses confirmation email — coordinator invited separately when ready
      user_metadata: { full_name: name },
    });

    if (authError) {
      console.error(`   ❌ Coordinator auth ${email}: ${authError.message}`);
      stats.errors.push({ type: 'coordinator', email, error: authError.message });
      continue;
    }

    // Profile auto-created by on_auth_user_created trigger — update extra fields
    await supabase.from('profiles')
      .update({ is_active: true, migrated_at: new Date().toISOString() })
      .eq('id', authData.user.id);

    // Trigger assigns 'parent' role by default — remove and set coordinator
    await supabase.from('user_roles').delete().eq('user_id', authData.user.id);
    await supabase.from('user_roles').insert({ user_id: authData.user.id, role: 'coordinator' });

    coordMap.set(email, authData.user.id);
    stats.coordinatorsCreated++;
    if (stats.coordinatorsCreated % 25 === 0) {
      console.log(`   ✅ ${stats.coordinatorsCreated} coordinators created...`);
    }
  }
  console.log(`   ✅ Coordinators: ${stats.coordinatorsCreated} created, ${stats.coordinatorsSkipped} already existed\n`);

  // 4. Build parent map: email → supabase profile id
  console.log('── Step 2: Parent Profiles ─────────────────────────────');
  const parentMap = new Map(); // email → supabase profile id
  const uniqueParents = new Map(); // email → { name, phone }

  for (const row of rowsToProcess) {
    const email = row['Email']?.trim().toLowerCase();
    if (!email) continue;
    if (!uniqueParents.has(email)) {
      uniqueParents.set(email, {
        full_name: row['Parent Name']?.trim() || '',
        phone: normalizePhone(row['Phone Number']),
      });
    }
  }
  console.log(`   Found ${uniqueParents.size} unique parent emails`);

  for (const [email, info] of uniqueParents) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      parentMap.set(email, existing.id);
      stats.parentsSkipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`   [DRY] Would create parent: ${info.full_name} <${email}>`);
      stats.parentsCreated++;
      continue;
    }

    // Create auth user (email_confirm: true = no email sent, parent can't log in until invited)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: info.full_name },
    });

    if (authError) {
      console.error(`   ❌ Parent auth ${email}: ${authError.message}`);
      stats.errors.push({ type: 'parent', email, error: authError.message });
      continue;
    }

    // Profile auto-created by trigger — update with phone and migration fields
    await supabase.from('profiles')
      .update({ phone: info.phone, is_active: true, migrated_at: new Date().toISOString() })
      .eq('id', authData.user.id);

    // trigger assigns 'parent' role automatically — no need to insert

    parentMap.set(email, authData.user.id);
    stats.parentsCreated++;
    if (stats.parentsCreated % 50 === 0) {
      console.log(`   ✅ ${stats.parentsCreated} parents created...`);
    }
  }
  console.log(`   ✅ Parents: ${stats.parentsCreated} created, ${stats.parentsSkipped} already existed\n`);

  // 5. Create swimmers
  console.log('── Step 3: Swimmers ────────────────────────────────────');
  const swimmerAirtableUpdates = []; // { airtable_record_id, swimmer_id, parent_id }

  for (const row of rowsToProcess) {
    // Skip pending VMRC referral rows — handled separately as referral_requests
    if (row['Status']?.trim().includes('Pending VMRC Referral')) continue;

    const airtableId = row['Record ID']?.trim() || row['NEW ID']?.trim();
    const clientName = row['Client Name']?.trim();
    const parentEmail = row['Email']?.trim().toLowerCase();

    if (!clientName) {
      stats.errors.push({ type: 'swimmer', name: '(blank)', error: 'No client name' });
      continue;
    }

    const { first: firstName, last: lastName } = splitName(clientName);
    const parentId = parentMap.get(parentEmail) || null;
    const coordEmail = row['Email of VMRC Coordinator']?.trim().toLowerCase();
    const coordId = coordEmail ? (coordMap.get(coordEmail) || null) : null;
    const fundingSourceId = mapFundingSource(row);
    const rawStatus = row['Status']?.trim();
    const enrollmentStatus = mapStatus(rawStatus);
    const priorityBooking = isPriorityBooking(rawStatus) || !!row['Priority Booking Instructor']?.trim();

    // Build swimmer record
    const swimmer = {
      first_name: firstName,
      last_name: lastName,
      parent_name: row['Parent Name']?.trim() || null,
      parent_email: parentEmail || null,
      parent_id: parentId,
      coordinator_id: coordId,
      funding_source_id: fundingSourceId,
      is_vmrc_client: fundingSourceId === FUNDING_IDS.VMRC,
      vmrc_coordinator_name: row['VMRC Coordinator']?.trim() || null,
      vmrc_coordinator_email: coordEmail || null,
      funding_coordinator_name: row['VMRC Coordinator']?.trim() || null,
      funding_coordinator_email: coordEmail || null,

      // Identity
      date_of_birth: parseDate(row['Birthday']),
      gender: row["Child's Gender"]?.trim() || null,
      height: row['Height']?.trim() || null,
      weight: row['Weight']?.trim() || null,

      // Status
      enrollment_status: enrollmentStatus,
      assessment_status: row['Initial assessment reports']?.trim() ? 'completed' : 'not_scheduled',
      approval_status: (() => {
        if (enrollmentStatus === 'declined') return 'declined';
        if (['enrolled','enrollment_expired','dropped','waitlist','pending_referral'].includes(enrollmentStatus)) return 'approved';
        return 'pending'; // pending_enrollment, pending_approval
      })(),

      // Medical
      has_allergies: parseBoolean(row['Allergies']),
      allergies_description: row['Allergies- Describe']?.trim() || null,
      has_medical_conditions: parseBoolean(row['Medical Conditions ']),
      medical_conditions_description: row['Medical-Describe']?.trim() || null,
      history_of_seizures: parseBoolean(row['History of Seizures']),
      toilet_trained: row['Toilet Trained?']?.trim() || null,
      non_ambulatory: parseBoolean(row['non-ambulatory']),
      diagnosis: parseArray(row['Diagnosis']),

      // Behavioral
      self_injurious_behavior: parseBoolean(row['Self Injurious Behavior\t']),
      self_injurious_behavior_description: row['Self Injurious Describe']?.trim() || null,
      aggressive_behavior: parseBoolean(row['Aggressive Behavior']),
      aggressive_behavior_description: row['Aggressive Behavior Describe']?.trim() || null,
      elopement_history: parseBoolean(row['Elopement History\t']),
      elopement_history_description: row['Elopement Description\t']?.trim() || null,
      has_behavior_plan: parseBoolean(row['Safety/Behavior plan']),
      restraint_history: false,

      // Swimming
      previous_swim_lessons: parseBoolean(row['Previous Swim Lessons']),
      comfortable_in_water: row['Comfortable in Water']?.trim() || null,
      swim_goals: parseArray(row['Swim goals']),
      strengths_interests: row['Strengths/Interest']?.trim() || null,
      motivators: row['What would be good motivators or reinforcement for positive behavior in the pool?']?.trim() || null,

      // Communication & therapies
      communication_type: row['Type of communication']?.trim()
        ? [row['Type of communication'].trim()] : [],
      other_therapies: parseBoolean(row['Other Therapies']),
      therapies_description: row['Therapies- Describe']?.trim() || null,

      // Availability
      availability: parseArray(row['What is your general availability for swim lessons?']),

      // Legal (booleans only — signatures re-collected on first login)
      signed_waiver: parseBoolean(row['Signed Waiver ']),
      photo_video_permission: parseBoolean(row['Photo Release']),
      privacy_policy_agreed: parseBoolean(row['Agreement to privacy policy']),
      terms_of_service_agreed: parseBoolean(row['Terms of Service']),
      signed_cancellation: !!row['Agreement to Cancelation policy']?.trim(),
      sms_consent_given: parseBoolean(row['SMS Policy']),
      guardian_relationship: row['Relationship for LLC Liability']?.trim() || null,

      // Priority booking
      is_priority_booking: priorityBooking,
      priority_booking_reason: priorityBooking ? 'manual' : null,

      // Admin notes — merge comment content + enrollment log
      // 'Comment  (from COMMENTS) 2' = actual staff comment text (date already embedded in text)
      // 'Notes' = auto-generated enrollment completion log (strip leading apostrophe artifact)
      admin_notes: (() => {
        const parts = [];
        const commentText = row['Comment  (from COMMENTS) 2']?.trim();
        const notesText = row['Notes']?.trim().replace(/^'+/, '').trim(); // strip leading apostrophe(s)
        if (commentText) parts.push(commentText);
        if (notesText) parts.push(notesText);
        return parts.length ? parts.join('\n\n---\n\n') : null;
      })(),

      // Migration tracking
      airtable_record_id: airtableId || null,
      migrated_at: new Date().toISOString(),
      migration_source: 'airtable',

      // Created at — preserve original Airtable date
      created_at: parseDateTime(row['Record Created']) || new Date().toISOString(),
    };

    if (DRY_RUN) {
      console.log(`   [DRY] Would create swimmer: ${firstName} ${lastName} (${enrollmentStatus})`);
      stats.swimmersCreated++;
      continue;
    }

    const { data, error } = await supabase
      .from('swimmers')
      .insert(swimmer)
      .select('id')
      .single();

    if (error) {
      console.error(`   ❌ Swimmer ${clientName}: ${error.message}`);
      stats.errors.push({ type: 'swimmer', name: clientName, airtableId, error: error.message });
      continue;
    }

    stats.swimmersCreated++;

    // Queue Airtable update
    if (airtableId && parentId) {
      swimmerAirtableUpdates.push({
        airtable_record_id: airtableId,
        swimmer_supabase_id: data.id,
        parent_supabase_id: parentId,
      });
    }

    // Create instructor assignments for priority booking
    const priorityInstructorField = row['Priority Booking Instructor']?.trim();
    if (priorityInstructorField && data.id) {
      const instructorNames = priorityInstructorField.split(',').map(n => n.trim().toLowerCase());
      for (const name of instructorNames) {
        const instructorId = INSTRUCTOR_IDS[name];
        if (!instructorId) {
          stats.errors.push({ type: 'assignment', swimmer: clientName, error: `Unknown instructor: ${name}` });
          continue;
        }
        const { error: assignError } = await supabase
          .from('swimmer_instructor_assignments')
          .insert({
            swimmer_id: data.id,
            instructor_id: instructorId,
            is_primary: instructorNames.length === 1, // primary only if single instructor
            notes: 'Migrated from Airtable priority booking field',
          });
        if (!assignError) stats.assignmentsCreated++;
      }
    }

    if (stats.swimmersCreated % 100 === 0) {
      console.log(`   ✅ ${stats.swimmersCreated} swimmers created...`);
    }
  }

  console.log(`   ✅ Swimmers: ${stats.swimmersCreated} created\n`);

  // 6. Write Supabase IDs back to Airtable
  if (!DRY_RUN && AIRTABLE_API_KEY && swimmerAirtableUpdates.length > 0) {
    console.log('── Step 4: Writing Supabase IDs back to Airtable ──────');
    console.log(`   ${swimmerAirtableUpdates.length} records to update...`);

    let updated = 0;
    for (const update of swimmerAirtableUpdates) {
      try {
        // Airtable batch update — 10 at a time
        const res = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Clients/${update.airtable_record_id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                'Supabase ID': update.swimmer_supabase_id,
                'Supabase Parent ID': update.parent_supabase_id,
                'Supabase Migrated': true,
                'Migration Date': new Date().toISOString().split('T')[0],
                'Migration Notes': 'Success',
              }
            })
          }
        );
        if (res.ok) {
          updated++;
          stats.airtableUpdated++;
        } else {
          const err = await res.text();
          stats.errors.push({ type: 'airtable_update', id: update.airtable_record_id, error: err });
        }
        // Airtable rate limit: 5 req/sec
        await new Promise(r => setTimeout(r, 210));
      } catch (e) {
        stats.errors.push({ type: 'airtable_update', id: update.airtable_record_id, error: e.message });
      }

      if (updated % 50 === 0 && updated > 0) {
        console.log(`   ✅ ${updated} Airtable records updated...`);
      }
    }
    console.log(`   ✅ Airtable updated: ${stats.airtableUpdated}\n`);
  }

  // 7. Summary
  console.log('══════════════════════════════════════════════════════');
  console.log('  MIGRATION COMPLETE');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  Total records in CSV : ${stats.total}`);
  console.log(`  Records to process   : ${stats.filtered}`);
  console.log(`  Coordinators created : ${stats.coordinatorsCreated}`);
  console.log(`  Coordinators existing: ${stats.coordinatorsSkipped}`);
  console.log(`  Parents created      : ${stats.parentsCreated}`);
  console.log(`  Parents existing     : ${stats.parentsSkipped}`);
  console.log(`  Swimmers created     : ${stats.swimmersCreated}`);
  console.log(`  Instructor assignments: ${stats.assignmentsCreated}`);
  console.log(`  Airtable records updated: ${stats.airtableUpdated}`);
  console.log(`  Errors               : ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    const errorLog = path.join(__dirname, 'migration_errors.json');
    fs.writeFileSync(errorLog, JSON.stringify(stats.errors, null, 2));
    console.log(`\n  ⚠️  Errors written to: ${errorLog}`);
    console.log('\n  First 5 errors:');
    stats.errors.slice(0, 5).forEach(e => console.log(`    - [${e.type}] ${e.name || e.email || e.id}: ${e.error}`));
  }

  console.log('\n  Done! ✅');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});