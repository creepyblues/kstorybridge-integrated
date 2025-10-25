/**
 * Test Data Cleanup Utilities
 *
 * Safely remove test data from database after testing.
 * Only operates on data with "test-" prefix for safety.
 *
 * Usage:
 *   import { cleanupTestUsers, cleanupAllTestData } from '@/test-utils/cleanup-test-data';
 *
 *   await cleanupTestUsers();
 *   await cleanupAllTestData();
 */

import { supabase } from '@/integrations/supabase/client';

export interface CleanupResult {
  success: boolean;
  itemsDeleted: number;
  errors: string[];
  details: string[];
}

/**
 * Safety check: Ensure we only delete test data
 */
function isTestEmail(email: string): boolean {
  return email.toLowerCase().startsWith('test-');
}

/**
 * Clean up test buyer profiles
 */
export async function cleanupTestBuyers(): Promise<CleanupResult> {
  console.log('[CLEANUP] Starting test buyer cleanup...');

  const result: CleanupResult = {
    success: false,
    itemsDeleted: 0,
    errors: [],
    details: [],
  };

  try {
    // Step 1: Find all test buyers
    const { data: testBuyers, error: fetchError } = await supabase
      .from('user_buyers')
      .select('email')
      .ilike('email', 'test-%');

    if (fetchError) {
      result.errors.push(`Failed to fetch test buyers: ${fetchError.message}`);
      return result;
    }

    if (!testBuyers || testBuyers.length === 0) {
      console.log('[CLEANUP] No test buyers found');
      result.success = true;
      result.details.push('No test buyers to clean up');
      return result;
    }

    console.log(`[CLEANUP] Found ${testBuyers.length} test buyers`);

    // Step 2: Delete test buyers (one by one for safety)
    for (const buyer of testBuyers) {
      if (!isTestEmail(buyer.email)) {
        result.errors.push(`Skipped non-test email: ${buyer.email}`);
        continue;
      }

      const { error: deleteError } = await supabase
        .from('user_buyers')
        .delete()
        .eq('email', buyer.email);

      if (deleteError) {
        result.errors.push(`Failed to delete ${buyer.email}: ${deleteError.message}`);
      } else {
        result.itemsDeleted++;
        result.details.push(`Deleted buyer: ${buyer.email}`);
        console.log(`[CLEANUP] ✅ Deleted buyer: ${buyer.email}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
}

/**
 * Clean up test creator profiles
 */
export async function cleanupTestCreators(): Promise<CleanupResult> {
  console.log('[CLEANUP] Starting test creator cleanup...');

  const result: CleanupResult = {
    success: false,
    itemsDeleted: 0,
    errors: [],
    details: [],
  };

  try {
    // Step 1: Find all test creators
    const { data: testCreators, error: fetchError } = await supabase
      .from('user_creators')
      .select('email')
      .ilike('email', 'test-%');

    if (fetchError) {
      result.errors.push(`Failed to fetch test creators: ${fetchError.message}`);
      return result;
    }

    if (!testCreators || testCreators.length === 0) {
      console.log('[CLEANUP] No test creators found');
      result.success = true;
      result.details.push('No test creators to clean up');
      return result;
    }

    console.log(`[CLEANUP] Found ${testCreators.length} test creators`);

    // Step 2: Delete test creators
    for (const creator of testCreators) {
      if (!isTestEmail(creator.email)) {
        result.errors.push(`Skipped non-test email: ${creator.email}`);
        continue;
      }

      const { error: deleteError } = await supabase
        .from('user_creators')
        .delete()
        .eq('email', creator.email);

      if (deleteError) {
        result.errors.push(`Failed to delete ${creator.email}: ${deleteError.message}`);
      } else {
        result.itemsDeleted++;
        result.details.push(`Deleted creator: ${creator.email}`);
        console.log(`[CLEANUP] ✅ Deleted creator: ${creator.email}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
}

/**
 * Clean up test chat sessions
 */
export async function cleanupTestChatSessions(): Promise<CleanupResult> {
  console.log('[CLEANUP] Starting test chat session cleanup...');

  const result: CleanupResult = {
    success: false,
    itemsDeleted: 0,
    errors: [],
    details: [],
  };

  try {
    // Find all chat sessions for test users
    const { data: testSessions, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('id, user_email')
      .ilike('user_email', 'test-%');

    if (fetchError) {
      result.errors.push(`Failed to fetch test sessions: ${fetchError.message}`);
      return result;
    }

    if (!testSessions || testSessions.length === 0) {
      console.log('[CLEANUP] No test chat sessions found');
      result.success = true;
      result.details.push('No test chat sessions to clean up');
      return result;
    }

    console.log(`[CLEANUP] Found ${testSessions.length} test chat sessions`);

    // Delete chat messages first (foreign key constraint)
    for (const session of testSessions) {
      if (!isTestEmail(session.user_email)) {
        result.errors.push(`Skipped non-test email: ${session.user_email}`);
        continue;
      }

      // Delete messages
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', session.id);

      if (messagesError) {
        result.errors.push(`Failed to delete messages for session ${session.id}: ${messagesError.message}`);
        continue;
      }

      // Delete session
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', session.id);

      if (sessionError) {
        result.errors.push(`Failed to delete session ${session.id}: ${sessionError.message}`);
      } else {
        result.itemsDeleted++;
        result.details.push(`Deleted chat session: ${session.id} (${session.user_email})`);
        console.log(`[CLEANUP] ✅ Deleted chat session: ${session.id}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
}

/**
 * Clean up test auth users (CAUTION: This deletes from auth.users)
 * Note: This requires service role key and should be used carefully
 */
export async function cleanupTestAuthUsers(): Promise<CleanupResult> {
  console.log('[CLEANUP] ⚠️  Test auth user cleanup requires service role key');
  console.log('[CLEANUP] This function should be run server-side only');

  const result: CleanupResult = {
    success: false,
    itemsDeleted: 0,
    errors: [],
    details: ['Auth user cleanup requires server-side execution with service role key'],
  };

  // This would need to be implemented server-side with service role key
  // For now, we just return a message
  result.errors.push('Auth user cleanup not implemented in client-side code');

  return result;
}

/**
 * Clean up all test users (buyers + creators)
 */
export async function cleanupTestUsers(): Promise<{
  buyers: CleanupResult;
  creators: CleanupResult;
}> {
  console.log('[CLEANUP] Starting comprehensive test user cleanup...');

  const buyers = await cleanupTestBuyers();
  const creators = await cleanupTestCreators();

  const totalDeleted = buyers.itemsDeleted + creators.itemsDeleted;
  const totalErrors = buyers.errors.length + creators.errors.length;

  console.log(`[CLEANUP] ✅ Cleanup complete:`);
  console.log(`  - Buyers deleted: ${buyers.itemsDeleted}`);
  console.log(`  - Creators deleted: ${creators.itemsDeleted}`);
  console.log(`  - Total deleted: ${totalDeleted}`);
  if (totalErrors > 0) {
    console.log(`  - Errors: ${totalErrors}`);
  }

  return { buyers, creators };
}

/**
 * Clean up ALL test data (users + chat sessions)
 */
export async function cleanupAllTestData(): Promise<{
  buyers: CleanupResult;
  creators: CleanupResult;
  chatSessions: CleanupResult;
  summary: {
    totalItemsDeleted: number;
    totalErrors: number;
    success: boolean;
  };
}> {
  console.log('[CLEANUP] 🧹 Starting FULL test data cleanup...');

  const buyers = await cleanupTestBuyers();
  const creators = await cleanupTestCreators();
  const chatSessions = await cleanupTestChatSessions();

  const totalItemsDeleted = buyers.itemsDeleted + creators.itemsDeleted + chatSessions.itemsDeleted;
  const totalErrors = buyers.errors.length + creators.errors.length + chatSessions.errors.length;

  const summary = {
    totalItemsDeleted,
    totalErrors,
    success: totalErrors === 0,
  };

  console.log(`[CLEANUP] ✅ Full cleanup complete:`);
  console.log(`  - Buyers deleted: ${buyers.itemsDeleted}`);
  console.log(`  - Creators deleted: ${creators.itemsDeleted}`);
  console.log(`  - Chat sessions deleted: ${chatSessions.itemsDeleted}`);
  console.log(`  - Total items deleted: ${totalItemsDeleted}`);
  if (totalErrors > 0) {
    console.log(`  - Total errors: ${totalErrors}`);
  }

  return {
    buyers,
    creators,
    chatSessions,
    summary,
  };
}

/**
 * Verify no test data remains
 */
export async function verifyTestDataCleanup(): Promise<{
  clean: boolean;
  remainingTestBuyers: number;
  remainingTestCreators: number;
  remainingTestSessions: number;
}> {
  console.log('[CLEANUP] Verifying cleanup...');

  const { data: buyers } = await supabase
    .from('user_buyers')
    .select('email', { count: 'exact', head: true })
    .ilike('email', 'test-%');

  const { data: creators } = await supabase
    .from('user_creators')
    .select('email', { count: 'exact', head: true })
    .ilike('email', 'test-%');

  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('id', { count: 'exact', head: true })
    .ilike('user_email', 'test-%');

  const remainingTestBuyers = buyers?.length || 0;
  const remainingTestCreators = creators?.length || 0;
  const remainingTestSessions = sessions?.length || 0;

  const clean = remainingTestBuyers === 0 && remainingTestCreators === 0 && remainingTestSessions === 0;

  if (clean) {
    console.log('[CLEANUP] ✅ All test data cleaned up successfully');
  } else {
    console.log('[CLEANUP] ⚠️  Some test data remains:');
    if (remainingTestBuyers > 0) console.log(`  - ${remainingTestBuyers} test buyers`);
    if (remainingTestCreators > 0) console.log(`  - ${remainingTestCreators} test creators`);
    if (remainingTestSessions > 0) console.log(`  - ${remainingTestSessions} test sessions`);
  }

  return {
    clean,
    remainingTestBuyers,
    remainingTestCreators,
    remainingTestSessions,
  };
}

/**
 * Safe cleanup with confirmation (for CLI use)
 */
export async function cleanupWithConfirmation(autoConfirm: boolean = false): Promise<void> {
  if (!autoConfirm) {
    console.log('[CLEANUP] ⚠️  This will delete ALL test data (test-* users and their data)');
    console.log('[CLEANUP] To proceed, call cleanupAllTestData() directly');
    return;
  }

  const result = await cleanupAllTestData();

  if (result.summary.success) {
    console.log('[CLEANUP] ✅ Cleanup completed successfully');
  } else {
    console.log('[CLEANUP] ❌ Cleanup completed with errors');
    console.log('[CLEANUP] Check logs above for details');
  }

  await verifyTestDataCleanup();
}
