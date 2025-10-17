/**
 * Clear Chat History Script
 *
 * Deletes all chat sessions and messages for a specific test user
 * to ensure clean baseline for A/B testing.
 *
 * Uses user authentication (not service role) for secure deletion.
 *
 * Usage:
 *   TEST_EMAIL="sungho@dadble.com" TEST_PASSWORD="password" node clear-chat-history.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

async function clearChatHistory() {
  console.log('🗑️  Clear Chat History Script');
  console.log('=============================\n');

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables are required');
  }

  console.log(`📧 Target user: ${TEST_EMAIL}\n`);

  // Create Supabase client with anon key
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Step 1: Authenticate as the user
    console.log('🔐 Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError) {
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    console.log(`✅ Authenticated as: ${authData.user.email}\n`);
    const userId = authData.user.id;

    // Step 2: Count existing chat sessions
    console.log('📊 Counting chat sessions...');
    const { count: sessionCount, error: countError } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      throw new Error(`Failed to count sessions: ${countError.message}`);
    }

    console.log(`   Found ${sessionCount || 0} chat session(s) to delete\n`);

    if (!sessionCount || sessionCount === 0) {
      console.log('✅ No chat history found. Database is clean.');
      return;
    }

    // Step 3: Delete all chat sessions for this user
    // CASCADE will automatically delete:
    // - chat_messages
    // - chat_title_recommendations
    // - chat_interactions
    // - chat_suggested_queries
    console.log('🗑️  Deleting chat sessions (CASCADE will delete related data)...');

    const { error: deleteError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      throw new Error(`Failed to delete sessions: ${deleteError.message}`);
    }

    console.log(`✅ Successfully deleted ${sessionCount} session(s) and all related data\n`);

    // Step 4: Verify deletion
    console.log('🔍 Verifying deletion...');
    const { count: verifyCount, error: verifyError } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (verifyError) {
      throw new Error(`Failed to verify deletion: ${verifyError.message}`);
    }

    if (verifyCount === 0) {
      console.log('✅ Verification: Chat history successfully cleared');
      console.log('   Database is clean and ready for fresh FORMAL baseline testing\n');
    } else {
      console.warn(`⚠️  Warning: ${verifyCount} session(s) still remain after deletion`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
clearChatHistory();
