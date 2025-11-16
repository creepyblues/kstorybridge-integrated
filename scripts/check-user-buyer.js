#!/usr/bin/env node

/**
 * Check if user_buyers record exists for a specific user
 * Usage: node check-user-buyer.js [email or user_id]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from dashboard app
dotenv.config({ path: join(__dirname, '../apps/dashboard/.env.local') });
dotenv.config({ path: join(__dirname, '../apps/dashboard/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserBuyer(identifier) {
  console.log(`\n🔍 Checking user_buyers record for: ${identifier}\n`);

  // Try both email and ID queries
  const queries = [
    { field: 'email', value: identifier },
    { field: 'id', value: identifier }
  ];

  for (const { field, value } of queries) {
    console.log(`📊 Querying by ${field}...`);

    const { data, error } = await supabase
      .from('user_buyers')
      .select('*')
      .eq(field, value)
      .maybeSingle();

    if (error) {
      console.error(`❌ Error querying by ${field}:`, error.message);
      continue;
    }

    if (data) {
      console.log(`✅ Found record (via ${field}):\n`);
      console.log(JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log(`⚠️  No record found by ${field}`);
    }
  }

  console.log('\n❌ User not found in user_buyers table\n');
  console.log('💡 Note: Cannot check auth.users table with anon key (requires service role key)\n');

  return null;
}

// Get identifier from command line or use default test user
const identifier = process.argv[2] || 'sungho@kstorybridge.com';

checkUserBuyer(identifier)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script error:', err);
    process.exit(1);
  });
