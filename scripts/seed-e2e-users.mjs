#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY required.');
  process.exit(1);
}

if (/icanswim\.com\b/.test(SUPABASE_URL) && !process.env.ALLOW_PROD_SEED) {
  console.error('Refusing to seed against production. Set ALLOW_PROD_SEED=1 to override (NOT RECOMMENDED).');
  process.exit(1);
}

const supa = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Deterministic UUIDs ───────────────────────────────────────────────
const ID = {
  PARENT_PRIVATE: '11111111-1111-1111-1111-111111111101',
  PARENT_VMRC: '11111111-1111-1111-1111-111111111102',
  INSTRUCTOR: '11111111-1111-1111-1111-111111111103',
  INSTRUCTOR_OTHER: '11111111-1111-1111-1111-111111111106',
  COORDINATOR: '11111111-1111-1111-1111-111111111104',
  ADMIN: '11111111-1111-1111-1111-111111111105',

  SWIMMER_ALEX: '22222222-2222-2222-2222-222222222201',
  SWIMMER_LIAM: '22222222-2222-2222-2222-222222222202',
  SWIMMER_MIA: '22222222-2222-2222-2222-222222222203',
  SWIMMER_PENDING: '22222222-2222-2222-2222-222222222204',
  SWIMMER_NOAH: '22222222-2222-2222-2222-222222222205',
  SWIMMER_AVA: '22222222-2222-2222-2222-222222222206',
  SWIMMER_BEN: '22222222-2222-2222-2222-222222222207',
  SWIMMER_SARA: '22222222-2222-2222-2222-222222222208',

  FUNDING_VMRC: '33333333-3333-3333-3333-333333333301',

  PO_AVA: '44444444-4444-4444-4444-444444444401',
  PO_BEN: '44444444-4444-4444-4444-444444444402',
  PO_SARA: '44444444-4444-4444-4444-444444444403',

  SESS_LIAM_LESSON: '55555555-5555-5555-5555-555555555501',
  SESS_AVA_LESSON_1: '55555555-5555-5555-5555-555555555502',
  SESS_AVA_LESSON_2: '55555555-5555-5555-5555-555555555503',
  SESS_AVA_LESSON_3: '55555555-5555-5555-5555-555555555504',
  SESS_AVA_LESSON_4: '55555555-5555-5555-5555-555555555505',
  SESS_ASSESSMENT: '55555555-5555-5555-5555-555555555506',
  SESS_FLOATING_SRC: '55555555-5555-5555-5555-555555555508',
  SESS_OTHER_INSTR: '55555555-5555-5555-5555-55555555550a',
  SESS_CANCEL_25H: '55555555-5555-5555-5555-55555555550b',
  SESS_CANCEL_12H: '55555555-5555-5555-5555-55555555550c',
  SESS_NOAH_NO_PO: '55555555-5555-5555-5555-55555555550d',
  SESS_SARA_MAXED: '55555555-5555-5555-5555-55555555550e',
  SESS_BEN_EXPIRED: '55555555-5555-5555-5555-55555555550f',

  FLOATING_SESSION: '66666666-6666-6666-6666-666666666601',
};

const PASSWORD = 'TestICS2025!';

const USERS = [
  { id: ID.PARENT_PRIVATE, email: 'anas.parent@icanswim209.com', name: 'Anas Parent (Private)', role: 'parent' },
  { id: ID.PARENT_VMRC, email: 'anas.parent-vmrc@icanswim.com', name: 'Anas Parent (VMRC)', role: 'parent' },
  { id: ID.INSTRUCTOR, email: 'anas.instructor@icanswim.com', name: 'Anas Instructor', role: 'instructor' },
  { id: ID.INSTRUCTOR_OTHER, email: 'anas.instructor-other@icanswim.com', name: 'Anas Instructor Other', role: 'instructor' },
  { id: ID.COORDINATOR, email: 'anas.coordinator@icanswim.com', name: 'Anas Coordinator', role: 'vmrc_coordinator' },
  { id: ID.ADMIN, email: 'anas.admin@icanswim.com', name: 'Anas Admin', role: 'admin' },
];

async function findAuthUserByEmail(email) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supa.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const found = data?.users?.find((u) => u.email === email);
    if (found) return found;
    if (!data?.users || data.users.length < 100) return null;
    page++;
  }
  return null;
}

async function upsertAuthUser(user) {
  const found = await findAuthUserByEmail(user.email);
  if (found) {
    await supa.auth.admin.updateUserById(found.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: user.name, seed_id: user.id },
    });
    return found.id;
  }
  const { data, error } = await supa.auth.admin.createUser({
    email: user.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: user.name, seed_id: user.id },
  });
  if (error) throw new Error(`createUser(${user.email}): ${error.message}`);
  return data.user.id;
}

async function upsertProfile(authId, user) {
  const { error } = await supa.from('profiles').upsert(
    { id: authId, email: user.email, full_name: user.name },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`upsertProfile(${user.email}): ${error.message}`);
}

async function upsertUserRole(authId, role) {
  const { error } = await supa.from('user_roles').upsert(
    { user_id: authId, role },
    { onConflict: 'user_id,role' }
  );
  if (error) throw new Error(`upsertUserRole(${authId},${role}): ${error.message}`);
}

async function upsertFundingSource() {
  const { error } = await supa.from('funding_sources').upsert(
    {
      id: ID.FUNDING_VMRC,
      name: 'Valley Mountain Regional Center (E2E)',
      short_name: 'VMRC-E2E',
      requires_authorization: true,
      is_active: true,
      assessment_sessions: 1,
      lessons_per_po: 12,
      po_duration_months: 3,
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`upsertFundingSource: ${error.message}`);
}

async function upsertSwimmer(spec, parentAuthId) {
  const row = {
    id: spec.id,
    parent_id: parentAuthId,
    first_name: spec.firstName,
    last_name: spec.lastName,
    date_of_birth: '2018-01-01',
    enrollment_status: spec.enrollmentStatus,
    approval_status: spec.approvalStatus ?? 'approved',
    assessment_status: spec.assessmentStatus ?? 'not_scheduled',
    flexible_swimmer: spec.flexible ?? false,
    payment_type: spec.paymentType ?? 'private_pay',
    funding_source_id: spec.fundingSourceId ?? null,
    coordinator_id: spec.coordinatorId ?? null,
    client_booking_limit: 4,
  };
  const { error } = await supa.from('swimmers').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`upsertSwimmer(${spec.firstName}): ${error.message}`);
}

async function upsertPurchaseOrder(spec) {
  const row = {
    id: spec.id,
    swimmer_id: spec.swimmerId,
    coordinator_id: ID.COORDINATOR,
    funding_source_id: ID.FUNDING_VMRC,
    po_type: 'lessons',
    status: spec.status,
    sessions_authorized: spec.sessionsAuthorized,
    sessions_booked: spec.sessionsBooked,
    sessions_used: spec.sessionsUsed ?? 0,
    allowed_lessons: spec.sessionsAuthorized,
    lessons_booked: spec.sessionsBooked,
    lessons_used: spec.sessionsUsed ?? 0,
    start_date: spec.startDate,
    end_date: spec.endDate,
    authorization_number: `AUTH-E2E-${spec.id.slice(-4)}`,
  };
  const { error } = await supa.from('purchase_orders').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`upsertPurchaseOrder(${spec.id}): ${error.message}`);
}

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
}

async function upsertSession(spec) {
  const row = {
    id: spec.id,
    start_time: spec.startTime,
    end_time: spec.endTime,
    instructor_id: spec.instructorId,
    location: spec.location ?? 'Modesto',
    max_capacity: spec.maxCapacity ?? 1,
    booking_count: spec.bookingCount ?? 0,
    is_full: spec.isFull ?? false,
    session_type: spec.sessionType ?? 'lesson',
    status: spec.status ?? 'open',
    price_cents: 9000,
    is_recurring: false,
  };
  const { error } = await supa.from('sessions').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`upsertSession(${spec.id}): ${error.message}`);
}

async function upsertSwimmerInstructorAssignment(swimmerId, instructorId, isPrimary) {
  const { error } = await supa.from('swimmer_instructor_assignments').upsert(
    { swimmer_id: swimmerId, instructor_id: instructorId, is_primary: isPrimary },
    { onConflict: 'swimmer_id,instructor_id' }
  );
  if (error) throw new Error(`upsertAssignment: ${error.message}`);
}

async function upsertFloatingSession(spec) {
  const monthYear = new Date(spec.availableUntil).toISOString().slice(0, 7);
  const { error } = await supa.from('floating_sessions').upsert(
    {
      id: spec.id,
      original_session_id: spec.originalSessionId,
      available_until: spec.availableUntil,
      month_year: monthYear,
      status: 'available',
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`upsertFloatingSession: ${error.message}`);
}

async function clearTestBookings() {
  const swimmerIds = [
    ID.SWIMMER_ALEX, ID.SWIMMER_LIAM, ID.SWIMMER_MIA, ID.SWIMMER_PENDING,
    ID.SWIMMER_NOAH, ID.SWIMMER_AVA, ID.SWIMMER_BEN, ID.SWIMMER_SARA,
  ];
  await supa.from('cancellations').delete().in('swimmer_id', swimmerIds);
  await supa.from('bookings').delete().in('swimmer_id', swimmerIds);
}

async function main() {
  console.log('▶ Seeding E2E test data against', SUPABASE_URL);

  const authIds = {};
  for (const u of USERS) {
    const id = await upsertAuthUser(u);
    authIds[u.email] = id;
    if (id !== u.id) {
      console.warn(`  ⚠ auth user ${u.email} has id ${id}, expected ${u.id}. Subsequent FKs will use the real id.`);
    }
    await upsertProfile(id, u);
    await upsertUserRole(id, u.role);
    console.log(`  ✓ user ${u.email} (${u.role})`);
  }

  const parentPrivateId = authIds['anas.parent@icanswim209.com'];
  const parentVmrcId = authIds['anas.parent-vmrc@icanswim.com'];
  const instructorId = authIds['anas.instructor@icanswim.com'];
  const instructorOtherId = authIds['anas.instructor-other@icanswim.com'];
  const coordinatorId = authIds['anas.coordinator@icanswim.com'];

  await upsertFundingSource();
  console.log('  ✓ funding_source VMRC');

  await upsertSwimmer(
    { id: ID.SWIMMER_ALEX, firstName: 'Alex', lastName: 'TestSwimmer', enrollmentStatus: 'waitlist', assessmentStatus: 'not_scheduled' },
    parentPrivateId
  );
  await upsertSwimmer(
    { id: ID.SWIMMER_LIAM, firstName: 'Liam', lastName: 'TestSwimmer', enrollmentStatus: 'enrolled' },
    parentPrivateId
  );
  await upsertSwimmer(
    { id: ID.SWIMMER_MIA, firstName: 'Mia', lastName: 'TestSwimmer', enrollmentStatus: 'enrolled', flexible: true },
    parentPrivateId
  );
  await upsertSwimmer(
    { id: ID.SWIMMER_PENDING, firstName: 'Penny', lastName: 'PendingSwimmer', enrollmentStatus: 'pending_enrollment', approvalStatus: 'pending' },
    parentPrivateId
  );
  await upsertSwimmer(
    { id: ID.SWIMMER_NOAH, firstName: 'Noah', lastName: 'TestSwimmer', enrollmentStatus: 'enrolled', paymentType: 'vmrc', fundingSourceId: ID.FUNDING_VMRC, coordinatorId },
    parentVmrcId
  );
  await upsertSwimmer(
    { id: ID.SWIMMER_AVA, firstName: 'Ava', lastName: 'TestSwimmer', enrollmentStatus: 'enrolled', paymentType: 'vmrc', fundingSourceId: ID.FUNDING_VMRC, coordinatorId },
    parentVmrcId
  );
  await upsertSwimmer(
    { id: ID.SWIMMER_BEN, firstName: 'Ben', lastName: 'TestSwimmer', enrollmentStatus: 'enrolled', paymentType: 'vmrc', fundingSourceId: ID.FUNDING_VMRC, coordinatorId },
    parentVmrcId
  );
  await upsertSwimmer(
    { id: ID.SWIMMER_SARA, firstName: 'Sara', lastName: 'TestSwimmer', enrollmentStatus: 'enrolled', paymentType: 'vmrc', fundingSourceId: ID.FUNDING_VMRC, coordinatorId },
    parentVmrcId
  );
  console.log('  ✓ swimmers (8)');

  // Liam locked to anas.instructor
  await upsertSwimmerInstructorAssignment(ID.SWIMMER_LIAM, instructorId, true);
  console.log('  ✓ Liam locked to anas.instructor');

  // Purchase orders
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const yearEnd = `${new Date().getFullYear()}-12-31`;
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await upsertPurchaseOrder({
    id: ID.PO_AVA, swimmerId: ID.SWIMMER_AVA, status: 'active',
    sessionsAuthorized: 12, sessionsBooked: 0, sessionsUsed: 0,
    startDate: yearStart, endDate: yearEnd,
  });
  await upsertPurchaseOrder({
    id: ID.PO_BEN, swimmerId: ID.SWIMMER_BEN, status: 'active',
    sessionsAuthorized: 12, sessionsBooked: 0, sessionsUsed: 0,
    startDate: twoMonthsAgo, endDate: oneMonthAgo,
  });
  await upsertPurchaseOrder({
    id: ID.PO_SARA, swimmerId: ID.SWIMMER_SARA, status: 'active',
    sessionsAuthorized: 12, sessionsBooked: 12, sessionsUsed: 12,
    startDate: yearStart, endDate: yearEnd,
  });
  console.log('  ✓ purchase_orders (Ava active, Ben expired, Sara maxed)');

  // Sessions
  const lessonsPerDay = (offsetHours) => ({
    startTime: hoursFromNow(offsetHours),
    endTime: hoursFromNow(offsetHours + 0.5),
  });

  await upsertSession({ id: ID.SESS_LIAM_LESSON, ...lessonsPerDay(48), instructorId, status: 'open' });
  await upsertSession({ id: ID.SESS_AVA_LESSON_1, ...lessonsPerDay(48 + 1), instructorId, status: 'open' });
  await upsertSession({ id: ID.SESS_AVA_LESSON_2, ...lessonsPerDay(168 + 1), instructorId, status: 'open' });
  await upsertSession({ id: ID.SESS_AVA_LESSON_3, ...lessonsPerDay(336 + 1), instructorId, status: 'open' });
  await upsertSession({ id: ID.SESS_AVA_LESSON_4, ...lessonsPerDay(504 + 1), instructorId, status: 'open' });
  await upsertSession({ id: ID.SESS_ASSESSMENT, ...lessonsPerDay(48 + 2), instructorId, sessionType: 'assessment', status: 'available' });
  await upsertSession({ id: ID.SESS_FLOATING_SRC, ...lessonsPerDay(72), instructorId, status: 'open' });
  await upsertSession({ id: ID.SESS_OTHER_INSTR, ...lessonsPerDay(96), instructorId: instructorOtherId, status: 'open' });
  await upsertSession({ id: ID.SESS_CANCEL_25H, ...lessonsPerDay(25), instructorId, status: 'open' });
  await upsertSession({ id: ID.SESS_CANCEL_12H, ...lessonsPerDay(12), instructorId, status: 'open' });
  await upsertSession({ id: ID.SESS_NOAH_NO_PO, ...lessonsPerDay(48 + 3), instructorId, status: 'open' });
  await upsertSession({ id: ID.SESS_SARA_MAXED, ...lessonsPerDay(48 + 4), instructorId, status: 'open' });
  await upsertSession({ id: ID.SESS_BEN_EXPIRED, ...lessonsPerDay(48 + 5), instructorId, status: 'open' });
  console.log('  ✓ sessions (13)');

  // Floating session pointing to SESS_FLOATING_SRC (for K1-K3)
  // available_until in the future so K1 succeeds
  await upsertFloatingSession({
    id: ID.FLOATING_SESSION,
    originalSessionId: ID.SESS_FLOATING_SRC,
    availableUntil: hoursFromNow(48),
  });
  console.log('  ✓ floating_session');

  // Reset state — drop any bookings/cancellations from prior runs
  await clearTestBookings();
  console.log('  ✓ cleared prior test bookings');

  console.log('\n✓ Seed complete.');
  console.log('  Real auth user IDs (use in tests if different from expected):');
  for (const [email, id] of Object.entries(authIds)) {
    console.log(`    ${email} = ${id}`);
  }
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message);
  process.exit(1);
});
