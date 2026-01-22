/**
 * Test if edge function properly caches "This Is Us" embedding
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCacheAfterSearch() {
  console.log('🔍 Testing cache behavior after search...\n');

  // 1. Check cache before search
  console.log('Step 1: Checking cache BEFORE search...');
  let { data: beforeCache } = await supabase
    .from('comp_title_cache')
    .select('comp_title, created_at')
    .eq('comp_title', 'this is us')
    .maybeSingle();

  if (beforeCache) {
    console.log('  ✅ Found in cache (created:', beforeCache.created_at, ')');
  } else {
    console.log('  ❌ Not in cache');
  }

  // 2. Run search
  console.log('\nStep 2: Running search for "This Is Us"...');
  const searchStart = Date.now();

  const { data, error } = await supabase.functions.invoke('comp-navigator', {
    body: {
      comp_titles: ['This Is Us'],
      user_email: 'sungho@kstorybridge.com',
      save_search: false
    },
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const searchDuration = Date.now() - searchStart;

  if (error) {
    console.error('  ❌ Error:', error);
    return;
  }

  console.log(`  ✅ Search completed (${searchDuration}ms)`);
  console.log(`  Results: ${data.results.length}`);

  // 3. Check cache immediately after search
  console.log('\nStep 3: Checking cache AFTER search (immediate)...');

  let { data: afterCache } = await supabase
    .from('comp_title_cache')
    .select('comp_title, embedding, created_at, source')
    .eq('comp_title', 'this is us')
    .maybeSingle();

  if (afterCache) {
    console.log('  ✅ Found in cache!');
    console.log('    Created:', afterCache.created_at);
    console.log('    Source:', afterCache.source);
    console.log('    Embedding length:', afterCache.embedding ? afterCache.embedding.length : 0);

    // Validate embedding
    if (afterCache.embedding) {
      const nullCount = afterCache.embedding.filter(v => v === null || v === undefined).length;
      if (nullCount > 0) {
        console.log(`    ⚠️  WARNING: Embedding contains ${nullCount} null values!`);
      } else if (afterCache.embedding.length !== 1536) {
        console.log(`    ⚠️  WARNING: Invalid dimension (${afterCache.embedding.length}, expected 1536)`);
      } else {
        console.log('    ✅ Embedding is valid');
      }
    }
  } else {
    console.log('  ❌ Still not in cache - edge function may have failed to cache it');
  }

  // 4. Wait a bit and check again (in case of async caching)
  console.log('\nStep 4: Waiting 2 seconds and checking again...');
  await wait(2000);

  let { data: delayedCache } = await supabase
    .from('comp_title_cache')
    .select('comp_title, embedding, created_at')
    .eq('comp_title', 'this is us')
    .maybeSingle();

  if (delayedCache) {
    console.log('  ✅ Found in cache');
  } else {
    console.log('  ❌ Still not in cache after delay');
  }

  // 5. Check all cache entries
  console.log('\nStep 5: Checking all cache entries...');
  const { data: allCache } = await supabase
    .from('comp_title_cache')
    .select('comp_title, created_at, source')
    .order('created_at', { ascending: false })
    .limit(10);

  if (allCache) {
    console.log(`  Found ${allCache.length} cache entries:`);
    allCache.forEach(c => {
      console.log(`    - "${c.comp_title}" (${c.source}, ${c.created_at})`);
    });
  }
}

testCacheAfterSearch();
