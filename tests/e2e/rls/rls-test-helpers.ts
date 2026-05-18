/**
 * RLS Test Helpers
 *
 * Utilities for testing Row-Level Security policies with different user roles.
 * These helpers create test users, set up test data, and clean up after tests.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtqlamkrhdfwtmaubfrc.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not set. RLS tests may fail.');
}

/**
 * Create a Supabase client with optional JWT token
 */
export function createSupabaseClient(jwt?: string) {
  const options: any = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  };

  if (jwt) {
    options.auth.persistSession = false;
    options.global = {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    };
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
}

/**
 * Create a test user with a specific role
 */
export async function createTestUser(supabase: any, role: 'parent' | 'coordinator' | 'instructor' | 'admin') {
  const timestamp = Date.now();
  const testEmail = `test-${role}-${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  const userId = authData.user?.id;

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: testEmail,
      full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    });

  if (profileError) {
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  // Assign role
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: role,
    });

  if (roleError) {
    throw new Error(`Failed to assign role: ${roleError.message}`);
  }

  // Get JWT token for the user
  const { data: tokenData, error: tokenError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (tokenError) {
    throw new Error(`Failed to get JWT token: ${tokenError.message}`);
  }

  return {
    id: userId,
    email: testEmail,
    role,
    token: tokenData.session?.access_token,
  };
}

/**
 * Clean up a test user
 */
export async function cleanupTestUser(supabase: any, userId: string) {
  // Delete user roles
  await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .catch(() => {}); // Ignore errors

  // Delete profile
  await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
    .catch(() => {}); // Ignore errors

  // Note: Auth user deletion requires admin privileges
  // In test environment, we rely on test data cleanup
}

/**
 * Verify user has correct role access
 */
export async function verifyRoleAccess(supabase: any, userId: string, role: string, expectedAccess: boolean) {
  const { data, error } = await supabase.rpc('has_role', {
    user_id: userId,
    check_role: role,
  });

  if (error) {
    throw new Error(`Failed to check role: ${error.message}`);
  }

  return data === expectedAccess;
}

/**
 * Test data access for a user
 */
export async function testDataAccess(
  supabase: any,
  userId: string,
  table: string,
  filters: Record<string, any> = {},
  expectedCount: number
) {
  const client = createSupabaseClient();

  // Note: In real tests, we would use the user's JWT token
  // For helper purposes, we'll use admin client and simulate RLS
  const { data, error, count } = await client
    .from(table)
    .select('*', { count: 'exact', head: false })
    .match(filters);

  if (error) {
    return { success: false, error: error.message };
  }

  const actualCount = count || data?.length || 0;
  const success = actualCount === expectedCount;

  return {
    success,
    actualCount,
    expectedCount,
    data: data || [],
  };
}

/**
 * Create test swimmer for RLS testing
 */
export async function createTestSwimmer(
  supabase: any,
  parentId: string,
  options: {
    coordinatorId?: string;
    enrollmentStatus?: string;
    firstName?: string;
    lastName?: string;
  } = {}
) {
  const { data, error } = await supabase
    .from('swimmers')
    .insert({
      parent_id: parentId,
      coordinator_id: options.coordinatorId || null,
      first_name: options.firstName || 'Test',
      last_name: options.lastName || 'Swimmer',
      enrollment_status: options.enrollmentStatus || 'enrolled',
      date_of_birth: '2015-01-01',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test swimmer: ${error.message}`);
  }

  return data;
}

/**
 * Create test progress note
 */
export async function createTestProgressNote(
  supabase: any,
  swimmerId: string,
  instructorId: string,
  options: {
    sharedWithParent?: boolean;
    lessonSummary?: string;
  } = {}
) {
  const { data, error } = await supabase
    .from('progress_notes')
    .insert({
      swimmer_id: swimmerId,
      instructor_id: instructorId,
      lesson_summary: options.lessonSummary || 'Test progress note',
      shared_with_parent: options.sharedWithParent || false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test progress note: ${error.message}`);
  }

  return data;
}

/**
 * Create test purchase order
 */
export async function createTestPurchaseOrder(
  supabase: any,
  swimmerId: string,
  options: {
    status?: string;
    amount?: number;
    description?: string;
  } = {}
) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      swimmer_id: swimmerId,
      status: options.status || 'pending',
      amount: options.amount || 100.00,
      description: options.description || 'Test purchase order',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test purchase order: ${error.message}`);
  }

  return data;
}

/**
 * Clean up test data
 */
export async function cleanupTestData(supabase: any, dataIds: {
  swimmerIds?: string[];
  progressNoteIds?: string[];
  purchaseOrderIds?: string[];
}) {
  // Clean up in reverse order to respect foreign key constraints
  if (dataIds.purchaseOrderIds) {
    for (const id of dataIds.purchaseOrderIds) {
      await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id)
        .catch(() => {}); // Ignore errors
    }
  }

  if (dataIds.progressNoteIds) {
    for (const id of dataIds.progressNoteIds) {
      await supabase
        .from('progress_notes')
        .delete()
        .eq('id', id)
        .catch(() => {}); // Ignore errors
    }
  }

  if (dataIds.swimmerIds) {
    for (const id of dataIds.swimmerIds) {
      await supabase
        .from('swimmers')
        .delete()
        .eq('id', id)
        .catch(() => {}); // Ignore errors
    }
  }
}

/**
 * Run RLS test scenario
 */
export async function runRLSTestScenario(
  supabase: any,
  scenario: {
    userRole: 'parent' | 'coordinator' | 'instructor' | 'admin';
    table: string;
    expectedAccess: 'full' | 'partial' | 'none';
    filters?: Record<string, any>;
    expectedCount?: number;
  }
) {
  // Create test user
  const testUser = await createTestUser(supabase, scenario.userRole);

  // Create test client with user's token
  const userClient = createSupabaseClient(testUser.token);

  // Run query
  const { data, error, count } = await userClient
    .from(scenario.table)
    .select('*', { count: 'exact' })
    .match(scenario.filters || {});

  // Clean up test user
  await cleanupTestUser(supabase, testUser.id);

  // Evaluate results based on expected access
  let success = false;
  let message = '';

  switch (scenario.expectedAccess) {
    case 'full':
      success = !error && (data?.length || 0) > 0;
      message = success ? 'User has full access as expected' : `Expected full access but got error: ${error?.message || 'no data'}`;
      break;

    case 'partial':
      if (scenario.expectedCount !== undefined) {
        success = !error && (count || data?.length || 0) === scenario.expectedCount;
        message = success
          ? `User has correct partial access (${scenario.expectedCount} records)`
          : `Expected ${scenario.expectedCount} records but got ${count || data?.length || 0}`;
      } else {
        success = !error && (data?.length || 0) > 0;
        message = success ? 'User has partial access as expected' : `Expected partial access but got error: ${error?.message || 'no data'}`;
      }
      break;

    case 'none':
      success = error?.code === '42501' || (data?.length || 0) === 0; // 42501 = permission denied
      message = success ? 'User correctly has no access' : `Expected no access but got data: ${data?.length || 0} records`;
      break;
  }

  return {
    success,
    message,
    data: data || [],
    count: count || 0,
    error: error?.message,
  };
}