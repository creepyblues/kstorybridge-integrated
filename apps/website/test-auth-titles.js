#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthTitles() {
  try {
    console.log('🔍 Testing titles access with different approaches...');
    
    // Test 1: Raw count query
    console.log('\n1️⃣ Testing count query...');
    const { count, error: countError } = await supabase
      .from('titles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Count error:', countError.message);
    } else {
      console.log(`📊 Count result: ${count}`);
    }
    
    // Test 2: Simple select without filters
    console.log('\n2️⃣ Testing simple select...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('titles')
      .select('title_id, title_name_en')
      .limit(1);
    
    if (simpleError) {
      console.log('❌ Simple select error:', simpleError.message);
    } else {
      console.log(`📊 Simple select result: ${simpleData?.length || 0} rows`);
      if (simpleData && simpleData.length > 0) {
        console.log('   First row:', simpleData[0]);
      }
    }
    
    // Test 3: Try with explicit schema
    console.log('\n3️⃣ Testing with explicit schema...');
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .schema('public')
        .from('titles')
        .select('title_id, title_name_en')
        .limit(1);
      
      if (schemaError) {
        console.log('❌ Schema error:', schemaError.message);
      } else {
        console.log(`📊 Schema result: ${schemaData?.length || 0} rows`);
      }
    } catch (e) {
      console.log('❌ Schema method not available');
    }
    
    // Test 4: Try the featured query without titles join
    console.log('\n4️⃣ Testing featured table only...');
    const { data: featuredOnly, error: featuredOnlyError } = await supabase
      .from('featured')
      .select('*')
      .limit(3);
    
    if (featuredOnlyError) {
      console.log('❌ Featured only error:', featuredOnlyError.message);
    } else {
      console.log(`📊 Featured only result: ${featuredOnly?.length || 0} rows`);
      if (featuredOnly && featuredOnly.length > 0) {
        featuredOnly.forEach((f, i) => {
          console.log(`   ${i + 1}. ID: ${f.title_id}, Note: ${f.note}`);
        });
      }
    }
    
    // Test 5: Check RLS policies info if possible
    console.log('\n5️⃣ Testing current user context...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Not authenticated, using anonymous access');
    } else {
      console.log('✅ Authenticated user:', userData.user?.email || 'No email');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAuthTitles();