/**
 * Supabase Test Client
 *
 * Specialized Supabase client for testing with service role access.
 * Bypasses RLS for test data manipulation.
 *
 * ⚠️ WARNING: This client has full database access. Use only in test environments!
 *
 * Usage:
 *   import { getTestClient, withServiceRole } from '@/test-utils/supabase-test-client';
 *
 *   const testClient = getTestClient();
 *   await withServiceRole(async (client) => {
 *     // Perform admin operations
 *   });
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase as regularClient } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

let testClient: SupabaseClient | null = null;

/**
 * Check if we're in test mode
 */
export function isTestMode(): boolean {
  return import.meta.env.VITE_TEST_MODE === 'true';
}

/**
 * Check if service role key is available
 */
export function hasServiceRoleKey(): boolean {
  return !!SUPABASE_SERVICE_ROLE_KEY && SUPABASE_SERVICE_ROLE_KEY.length > 0;
}

/**
 * Get or create test client with service role access
 *
 * ⚠️ This client bypasses all RLS policies!
 */
export function getTestClient(): SupabaseClient {
  if (!isTestMode()) {
    console.warn('[TEST CLIENT] ⚠️  Not in test mode, using regular client');
    return regularClient;
  }

  if (!hasServiceRoleKey()) {
    console.warn('[TEST CLIENT] ⚠️  No service role key found, using regular client');
    return regularClient;
  }

  if (!testClient) {
    console.log('[TEST CLIENT] Creating test client with service role access');
    testClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return testClient;
}

/**
 * Execute operation with service role access
 *
 * This is the preferred way to use service role access.
 *
 * @param operation - Async function that receives the service role client
 * @returns Result of the operation
 */
export async function withServiceRole<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  if (!isTestMode()) {
    throw new Error('Service role access only available in test mode');
  }

  if (!hasServiceRoleKey()) {
    throw new Error('Service role key not configured');
  }

  const client = getTestClient();
  return await operation(client);
}

/**
 * Directly insert test data (bypassing RLS)
 */
export async function insertTestData<T = any>(
  table: string,
  data: any | any[]
): Promise<{ data: T[] | null; error: any }> {
  return withServiceRole(async (client) => {
    return await client.from(table).insert(data).select();
  });
}

/**
 * Directly delete test data (bypassing RLS)
 */
export async function deleteTestData(
  table: string,
  filter: { column: string; value: any }
): Promise<{ error: any }> {
  return withServiceRole(async (client) => {
    return await client
      .from(table)
      .delete()
      .eq(filter.column, filter.value);
  });
}

/**
 * Directly update test data (bypassing RLS)
 */
export async function updateTestData<T = any>(
  table: string,
  filter: { column: string; value: any },
  updates: any
): Promise<{ data: T[] | null; error: any }> {
  return withServiceRole(async (client) => {
    return await client
      .from(table)
      .update(updates)
      .eq(filter.column, filter.value)
      .select();
  });
}

/**
 * Query test data (bypassing RLS)
 */
export async function queryTestData<T = any>(
  table: string,
  filter?: { column: string; value: any }
): Promise<{ data: T[] | null; error: any }> {
  return withServiceRole(async (client) => {
    let query = client.from(table).select('*');

    if (filter) {
      query = query.eq(filter.column, filter.value);
    }

    return await query;
  });
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await regularClient
      .from('titles')
      .select('title_id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.error('[TEST CLIENT] Connection test failed:', error);
      return false;
    }

    console.log('[TEST CLIENT] ✅ Connection test passed');
    return true;
  } catch (error) {
    console.error('[TEST CLIENT] Connection test error:', error);
    return false;
  }
}

/**
 * Test service role access
 */
export async function testServiceRoleAccess(): Promise<boolean> {
  if (!hasServiceRoleKey()) {
    console.log('[TEST CLIENT] ❌ No service role key configured');
    return false;
  }

  try {
    const { data, error } = await withServiceRole(async (client) => {
      return await client
        .from('user_buyers')
        .select('email', { count: 'exact', head: true })
        .limit(1);
    });

    if (error) {
      console.error('[TEST CLIENT] Service role test failed:', error);
      return false;
    }

    console.log('[TEST CLIENT] ✅ Service role access verified');
    return true;
  } catch (error) {
    console.error('[TEST CLIENT] Service role test error:', error);
    return false;
  }
}

/**
 * Get database statistics for testing
 */
export async function getDatabaseStats(): Promise<{
  totalBuyers: number;
  totalCreators: number;
  totalTitles: number;
  totalChatSessions: number;
  testBuyers: number;
  testCreators: number;
  testSessions: number;
}> {
  const stats = {
    totalBuyers: 0,
    totalCreators: 0,
    totalTitles: 0,
    totalChatSessions: 0,
    testBuyers: 0,
    testCreators: 0,
    testSessions: 0,
  };

  try {
    // Regular counts
    const { count: buyerCount } = await regularClient
      .from('user_buyers')
      .select('*', { count: 'exact', head: true });
    stats.totalBuyers = buyerCount || 0;

    const { count: creatorCount } = await regularClient
      .from('user_creators')
      .select('*', { count: 'exact', head: true });
    stats.totalCreators = creatorCount || 0;

    const { count: titleCount } = await regularClient
      .from('titles')
      .select('*', { count: 'exact', head: true });
    stats.totalTitles = titleCount || 0;

    const { count: sessionCount } = await regularClient
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true });
    stats.totalChatSessions = sessionCount || 0;

    // Test data counts
    const { count: testBuyerCount } = await regularClient
      .from('user_buyers')
      .select('*', { count: 'exact', head: true })
      .ilike('email', 'test-%');
    stats.testBuyers = testBuyerCount || 0;

    const { count: testCreatorCount } = await regularClient
      .from('user_creators')
      .select('*', { count: 'exact', head: true })
      .ilike('email', 'test-%');
    stats.testCreators = testCreatorCount || 0;

    const { count: testSessionCount } = await regularClient
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .ilike('user_email', 'test-%');
    stats.testSessions = testSessionCount || 0;

  } catch (error) {
    console.error('[TEST CLIENT] Failed to get database stats:', error);
  }

  return stats;
}

/**
 * Print database statistics
 */
export async function printDatabaseStats(): Promise<void> {
  console.log('[TEST CLIENT] Fetching database statistics...');
  const stats = await getDatabaseStats();

  console.log('\n📊 Database Statistics:');
  console.log('  Total Data:');
  console.log(`    - Buyers: ${stats.totalBuyers}`);
  console.log(`    - Creators: ${stats.totalCreators}`);
  console.log(`    - Titles: ${stats.totalTitles}`);
  console.log(`    - Chat Sessions: ${stats.totalChatSessions}`);
  console.log('  Test Data:');
  console.log(`    - Test Buyers: ${stats.testBuyers}`);
  console.log(`    - Test Creators: ${stats.testCreators}`);
  console.log(`    - Test Sessions: ${stats.testSessions}`);
  console.log('');
}

/**
 * Run all connection tests
 */
export async function runConnectionTests(): Promise<{
  regularConnection: boolean;
  serviceRoleAccess: boolean;
  allPassed: boolean;
}> {
  console.log('[TEST CLIENT] Running connection tests...\n');

  const regularConnection = await testConnection();
  const serviceRoleAccess = await testServiceRoleAccess();

  const allPassed = regularConnection && serviceRoleAccess;

  console.log('\n[TEST CLIENT] Connection test results:');
  console.log(`  - Regular connection: ${regularConnection ? '✅' : '❌'}`);
  console.log(`  - Service role access: ${serviceRoleAccess ? '✅' : '❌'}`);
  console.log(`  - Overall: ${allPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

  return {
    regularConnection,
    serviceRoleAccess,
    allPassed,
  };
}
