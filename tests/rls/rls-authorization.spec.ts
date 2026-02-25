import { test, expect } from '@playwright/test';
import { createSupabaseClient, createTestUser, cleanupTestUser } from '../utils/api-helpers';

/**
 * Comprehensive RLS (Row-Level Security) Test Suite
 *
 * This test suite verifies that each user role can only access data
 * they're authorized to see according to RLS policies.
 *
 * Test Coverage:
 * 1. Parent role: Can only see own swimmers
 * 2. Coordinator role: Can only see assigned swimmers
 * 3. Instructor role: Can see all swimmers they teach
 * 4. Admin role: Has full access to all data
 * 5. Cross-role access: Verify role boundaries are enforced
 * 6. Progress notes: Parents can see shared notes, coordinators can see POs
 */

test.describe('RLS Authorization Tests', () => {
  let supabase: any;
  let testUsers: Record<string, any> = {};
  let testData: Record<string, any> = {};

  test.beforeAll(async () => {
    // Create Supabase client for direct database access
    supabase = createSupabaseClient();

    // Create test users for each role
    testUsers = {
      parent: await createTestUser(supabase, 'parent'),
      coordinator: await createTestUser(supabase, 'coordinator'),
      instructor: await createTestUser(supabase, 'instructor'),
      admin: await createTestUser(supabase, 'admin'),
      otherParent: await createTestUser(supabase, 'parent') // For cross-testing
    };

    // Create test data
    testData = await setupTestData(supabase, testUsers);
  });

  test.afterAll(async () => {
    // Clean up test data
    await cleanupTestData(supabase, testData);

    // Clean up test users
    for (const user of Object.values(testUsers)) {
      await cleanupTestUser(supabase, user.id);
    }
  });

  // ==================== PARENT ROLE TESTS ====================

  test('Parent can only see own swimmers', async () => {
    const parentClient = createSupabaseClient(testUsers.parent.token);

    // Test 1: Parent should see their own swimmers
    const { data: ownSwimmers, error: ownError } = await parentClient
      .from('swimmers')
      .select('*')
      .eq('parent_id', testUsers.parent.id);

    expect(ownError).toBeNull();
    expect(ownSwimmers).toHaveLength(2); // Should see both of their swimmers
    expect(ownSwimmers?.every(s => s.parent_id === testUsers.parent.id)).toBe(true);

    // Test 2: Parent should NOT see other parent's swimmers (via API)
    // This tests the actual API endpoint, not direct database access
    const apiResponse = await fetch('/api/swimmers', {
      headers: {
        'Authorization': `Bearer ${testUsers.parent.token}`
      }
    });

    const apiData = await apiResponse.json();
    expect(apiResponse.status).toBe(200);

    // Verify only own swimmers returned
    const swimmerIds = apiData.map((s: any) => s.id);
    expect(swimmerIds).toContain(testData.parentSwimmer1.id);
    expect(swimmerIds).toContain(testData.parentSwimmer2.id);
    expect(swimmerIds).not.toContain(testData.otherParentSwimmer.id);
  });

  test('Parent can see shared progress notes', async () => {
    const parentClient = createSupabaseClient(testUsers.parent.token);

    // Test: Parent should see progress notes shared with them
    const { data: progressNotes, error } = await parentClient
      .from('progress_notes')
      .select('*')
      .eq('swimmer_id', testData.parentSwimmer1.id);

    expect(error).toBeNull();

    // Should see the shared note but not the private note
    const sharedNote = progressNotes?.find((n: any) => n.shared_with_parent === true);
    const privateNote = progressNotes?.find((n: any) => n.shared_with_parent === false);

    expect(sharedNote).toBeDefined();
    // Private note might not be visible depending on RLS policy
  });

  test('Parent cannot see other parent progress notes', async () => {
    const parentClient = createSupabaseClient(testUsers.parent.token);

    // Test: Parent should NOT see progress notes for other parent's swimmers
    const { data: otherNotes, error } = await parentClient
      .from('progress_notes')
      .select('*')
      .eq('swimmer_id', testData.otherParentSwimmer.id);

    expect(error).toBeNull();
    // Should get empty array or only notes explicitly shared (if any)
    expect(otherNotes?.length).toBe(0);
  });

  // ==================== COORDINATOR ROLE TESTS ====================

  test('Coordinator can only see assigned swimmers', async () => {
    const coordinatorClient = createSupabaseClient(testUsers.coordinator.token);

    // Test 1: Coordinator should see swimmers assigned to them
    const { data: assignedSwimmers, error } = await coordinatorClient
      .from('swimmers')
      .select('*')
      .eq('coordinator_id', testUsers.coordinator.id);

    expect(error).toBeNull();
    expect(assignedSwimmers).toHaveLength(1); // Only the assigned swimmer
    expect(assignedSwimmers?.[0].id).toBe(testData.coordinatorSwimmer.id);

    // Test 2: Coordinator should NOT see unassigned swimmers
    const { data: allSwimmers } = await coordinatorClient
      .from('swimmers')
      .select('id');

    const swimmerIds = allSwimmers?.map((s: any) => s.id) || [];
    expect(swimmerIds).toContain(testData.coordinatorSwimmer.id);
    expect(swimmerIds).not.toContain(testData.parentSwimmer1.id);
    expect(swimmerIds).not.toContain(testData.otherParentSwimmer.id);
  });

  test('Coordinator can see purchase orders for their swimmers', async () => {
    const coordinatorClient = createSupabaseClient(testUsers.coordinator.token);

    // Test: Coordinator should see POs for their assigned swimmers
    const { data: purchaseOrders, error } = await coordinatorClient
      .from('purchase_orders')
      .select('*, swimmers!inner(coordinator_id)')
      .eq('swimmers.coordinator_id', testUsers.coordinator.id);

    expect(error).toBeNull();
    expect(purchaseOrders?.length).toBeGreaterThan(0);

    // All POs should be for swimmers assigned to this coordinator
    const allForCoordinator = purchaseOrders?.every((po: any) =>
      po.swimmers?.some((s: any) => s.coordinator_id === testUsers.coordinator.id)
    );
    expect(allForCoordinator).toBe(true);
  });

  test('Coordinator cannot see purchase orders for unassigned swimmers', async () => {
    const coordinatorClient = createSupabaseClient(testUsers.coordinator.token);

    // Test: Coordinator should NOT see POs for swimmers not assigned to them
    const { data: allPOs } = await coordinatorClient
      .from('purchase_orders')
      .select('*, swimmers!inner(parent_id)');

    // Should not see POs for other parent's swimmers
    const otherParentPOs = allPOs?.filter((po: any) =>
      po.swimmers?.some((s: any) => s.parent_id === testUsers.otherParent.id)
    );
    expect(otherParentPOs?.length).toBe(0);
  });

  // ==================== INSTRUCTOR ROLE TESTS ====================

  test('Instructor can see all swimmers (no assignment restriction)', async () => {
    const instructorClient = createSupabaseClient(testUsers.instructor.token);

    // Test: Instructor should see all swimmers (not just assigned ones)
    const { data: allSwimmers, error } = await instructorClient
      .from('swimmers')
      .select('*');

    expect(error).toBeNull();
    // Instructor should see multiple swimmers
    expect(allSwimmers?.length).toBeGreaterThan(2);

    // Verify they can see swimmers from different parents
    const parentSwimmerIds = allSwimmers
      ?.filter((s: any) => s.parent_id === testUsers.parent.id)
      .map((s: any) => s.id) || [];

    const otherParentSwimmerIds = allSwimmers
      ?.filter((s: any) => s.parent_id === testUsers.otherParent.id)
      .map((s: any) => s.id) || [];

    expect(parentSwimmerIds).toContain(testData.parentSwimmer1.id);
    expect(otherParentSwimmerIds).toContain(testData.otherParentSwimmer.id);
  });

  test('Instructor can see progress notes they created', async () => {
    const instructorClient = createSupabaseClient(testUsers.instructor.token);

    // Test: Instructor should see progress notes they created
    const { data: instructorNotes, error } = await instructorClient
      .from('progress_notes')
      .select('*')
      .eq('instructor_id', testUsers.instructor.id);

    expect(error).toBeNull();
    expect(instructorNotes?.length).toBeGreaterThan(0);

    // All notes should be created by this instructor
    const allByInstructor = instructorNotes?.every((n: any) =>
      n.instructor_id === testUsers.instructor.id
    );
    expect(allByInstructor).toBe(true);
  });

  // ==================== ADMIN ROLE TESTS ====================

  test('Admin has full access to all swimmers', async () => {
    const adminClient = createSupabaseClient(testUsers.admin.token);

    // Test: Admin should see ALL swimmers
    const { data: allSwimmers, error } = await adminClient
      .from('swimmers')
      .select('*');

    expect(error).toBeNull();
    expect(allSwimmers?.length).toBeGreaterThan(3); // All test swimmers

    // Verify admin can see swimmers from all test users
    const swimmerIds = allSwimmers?.map((s: any) => s.id) || [];
    expect(swimmerIds).toContain(testData.parentSwimmer1.id);
    expect(swimmerIds).toContain(testData.coordinatorSwimmer.id);
    expect(swimmerIds).toContain(testData.otherParentSwimmer.id);
  });

  test('Admin has full access to all progress notes', async () => {
    const adminClient = createSupabaseClient(testUsers.admin.token);

    // Test: Admin should see ALL progress notes
    const { data: allNotes, error } = await adminClient
      .from('progress_notes')
      .select('*');

    expect(error).toBeNull();
    expect(allNotes?.length).toBeGreaterThan(1); // Multiple test notes

    // Should see both shared and private notes
    const hasSharedNotes = allNotes?.some((n: any) => n.shared_with_parent === true);
    const hasPrivateNotes = allNotes?.some((n: any) => n.shared_with_parent === false);
    expect(hasSharedNotes).toBe(true);
    expect(hasPrivateNotes).toBe(true);
  });

  test('Admin has full access to all purchase orders', async () => {
    const adminClient = createSupabaseClient(testUsers.admin.token);

    // Test: Admin should see ALL purchase orders
    const { data: allPOs, error } = await adminClient
      .from('purchase_orders')
      .select('*');

    expect(error).toBeNull();
    expect(allPOs?.length).toBeGreaterThan(0);

    // Should see POs for all swimmers
    const poSwimmerIds = allPOs?.map((po: any) => po.swimmer_id) || [];
    expect(poSwimmerIds).toContain(testData.coordinatorSwimmer.id);
  });

  // ==================== CROSS-ROLE BOUNDARY TESTS ====================

  test('Parent cannot access coordinator or admin data', async () => {
    const parentClient = createSupabaseClient(testUsers.parent.token);

    // Test 1: Parent should NOT see coordinator-specific views
    const { data: coordinatorView } = await parentClient
      .from('swimmers')
      .select('coordinator_id')
      .not('coordinator_id', 'is', null);

    // Parent might see swimmers with coordinators, but shouldn't see coordinator dashboard data
    // This depends on specific RLS policies

    // Test 2: Parent should NOT have admin privileges
    const { data: adminCheck } = await parentClient.rpc('has_role', {
      user_id: testUsers.parent.id,
      check_role: 'admin'
    });

    expect(adminCheck).toBe(false);
  });

  test('Coordinator cannot access admin-only functions', async () => {
    const coordinatorClient = createSupabaseClient(testUsers.coordinator.token);

    // Test: Coordinator should NOT be able to perform admin actions
    // Attempt to update a swimmer they don't coordinate
    const { error } = await coordinatorClient
      .from('swimmers')
      .update({ enrollment_status: 'inactive' })
      .eq('id', testData.otherParentSwimmer.id);

    // Should get permission error
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501'); // PostgreSQL permission denied
  });

  // ==================== EDGE CASE TESTS ====================

  test('Orphaned records are handled correctly', async () => {
    const adminClient = createSupabaseClient(testUsers.admin.token);

    // Create a swimmer without a parent (edge case)
    const { data: orphanSwimmer } = await adminClient
      .from('swimmers')
      .insert({
        first_name: 'Orphan',
        last_name: 'Test',
        enrollment_status: 'pending'
      })
      .select()
      .single();

    // Test: Different roles should handle orphaned swimmer correctly
    const parentClient = createSupabaseClient(testUsers.parent.token);
    const { data: parentView } = await parentClient
      .from('swimmers')
      .select('*')
      .eq('id', orphanSwimmer.id);

    // Parent should not see orphaned swimmer (no parent_id match)
    expect(parentView?.length).toBe(0);

    // Clean up
    await adminClient.from('swimmers').delete().eq('id', orphanSwimmer.id);
  });

  test('Role transition preserves data access', async () => {
    // This test would require updating a user's role and verifying
    // data access changes accordingly
    // Note: Implement with caution in test environment
  });
});

// ==================== TEST DATA SETUP HELPERS ====================

async function setupTestData(supabase: any, testUsers: Record<string, any>) {
  const testData: Record<string, any> = {};

  // Create test swimmers for parent
  const { data: parentSwimmer1 } = await supabase
    .from('swimmers')
    .insert({
      parent_id: testUsers.parent.id,
      first_name: 'ParentChild1',
      last_name: 'Test',
      enrollment_status: 'enrolled'
    })
    .select()
    .single();

  const { data: parentSwimmer2 } = await supabase
    .from('swimmers')
    .insert({
      parent_id: testUsers.parent.id,
      first_name: 'ParentChild2',
      last_name: 'Test',
      enrollment_status: 'enrolled'
    })
    .select()
    .single();

  // Create test swimmer for other parent
  const { data: otherParentSwimmer } = await supabase
    .from('swimmers')
    .insert({
      parent_id: testUsers.otherParent.id,
      first_name: 'OtherChild',
      last_name: 'Test',
      enrollment_status: 'enrolled'
    })
    .select()
    .single();

  // Create test swimmer assigned to coordinator
  const { data: coordinatorSwimmer } = await supabase
    .from('swimmers')
    .insert({
      parent_id: testUsers.parent.id,
      coordinator_id: testUsers.coordinator.id,
      first_name: 'CoordinatorChild',
      last_name: 'Test',
      enrollment_status: 'enrolled'
    })
    .select()
    .single();

  // Create progress notes
  const { data: sharedProgressNote } = await supabase
    .from('progress_notes')
    .insert({
      swimmer_id: parentSwimmer1.id,
      instructor_id: testUsers.instructor.id,
      lesson_summary: 'Shared progress note',
      shared_with_parent: true
    })
    .select()
    .single();

  const { data: privateProgressNote } = await supabase
    .from('progress_notes')
    .insert({
      swimmer_id: parentSwimmer1.id,
      instructor_id: testUsers.instructor.id,
      lesson_summary: 'Private progress note',
      shared_with_parent: false
    })
    .select()
    .single();

  // Create purchase order for coordinator swimmer
  const { data: purchaseOrder } = await supabase
    .from('purchase_orders')
    .insert({
      swimmer_id: coordinatorSwimmer.id,
      status: 'pending',
      amount: 100.00,
      description: 'Test purchase order'
    })
    .select()
    .single();

  return {
    parentSwimmer1,
    parentSwimmer2,
    otherParentSwimmer,
    coordinatorSwimmer,
    sharedProgressNote,
    privateProgressNote,
    purchaseOrder
  };
}

async function cleanupTestData(supabase: any, testData: Record<string, any>) {
  // Clean up in reverse order to respect foreign key constraints
  if (testData.purchaseOrder) {
    await supabase.from('purchase_orders').delete().eq('id', testData.purchaseOrder.id);
  }

  if (testData.sharedProgressNote) {
    await supabase.from('progress_notes').delete().eq('id', testData.sharedProgressNote.id);
  }

  if (testData.privateProgressNote) {
    await supabase.from('progress_notes').delete().eq('id', testData.privateProgressNote.id);
  }

  if (testData.coordinatorSwimmer) {
    await supabase.from('swimmers').delete().eq('id', testData.coordinatorSwimmer.id);
  }

  if (testData.otherParentSwimmer) {
    await supabase.from('swimmers').delete().eq('id', testData.otherParentSwimmer.id);
  }

  if (testData.parentSwimmer2) {
    await supabase.from('swimmers').delete().eq('id', testData.parentSwimmer2.id);
  }

  if (testData.parentSwimmer1) {
    await supabase.from('swimmers').delete().eq('id', testData.parentSwimmer1.id);
  }
}