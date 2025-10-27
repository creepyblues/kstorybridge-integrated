/**
 * Apply DELETE policy to chat_sessions table
 *
 * Uses Supabase REST API to execute SQL
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const SQL = `
-- Add DELETE policies for chat tables to allow users to delete their own data
CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chat messages" ON chat_messages
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chat interactions" ON chat_interactions
  FOR DELETE USING (user_id = auth.uid());
`;

async function applyPolicy() {
  console.log('📝 Applying DELETE policies to chat tables...\n');

  // This won't work via REST API - policies can only be created via database admin
  console.log('❌ Cannot create policies via Supabase client (requires database admin)');
  console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/sql/new\n');
  console.log('Copy and paste this SQL:\n');
  console.log('━'.repeat(80));
  console.log(SQL);
  console.log('━'.repeat(80));
  console.log('\nAfter running, execute: TEST_EMAIL="sungho@dadble.com" TEST_PASSWORD="abcdefGH1234%" node clear-chat-history.js');
}

applyPolicy();
