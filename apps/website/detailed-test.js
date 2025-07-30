#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzNzk5MTAsImV4cCI6MjAzNjk1NTkxMH0.NyqLnAmjzKE8-dXBTuVkQ7QhJLUJw-sC3YW0f-gW3mY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function detailedTest() {
  console.log('🔍 Detailed Storage Access Test\n');
  
  try {
    // Test 1: Check if we can list files in the bucket
    console.log('1️⃣ Testing bucket access...');
    const { data: listData, error: listError } = await supabase.storage
      .from('pitch-pdfs')
      .list('', { limit: 1 });
    
    if (listError) {
      console.log('❌ Cannot list bucket contents:', listError.message);
    } else {
      console.log('✅ Can access bucket, found', listData?.length || 0, 'items');
    }
    
    // Test 2: Try to create signed URL with different expiry times
    console.log('\n2️⃣ Testing signed URL creation with different settings...');
    
    const testCases = [
      { expiry: 60, desc: '1 minute' },
      { expiry: 3600, desc: '1 hour' },
      { expiry: 86400, desc: '24 hours' }
    ];
    
    for (const testCase of testCases) {
      console.log(`   Testing ${testCase.desc} expiry...`);
      const { data, error } = await supabase.storage
        .from('pitch-pdfs')
        .createSignedUrl('2448b5ea-8222-4bd7-a559-30d194f9d322/pitch.pdf', testCase.expiry);
      
      if (error) {
        console.log(`   ❌ ${testCase.desc}: ${error.message}`);
      } else {
        console.log(`   ✅ ${testCase.desc}: Success!`);
        
        // Test the actual URL
        try {
          const response = await fetch(data.signedUrl, { method: 'HEAD' });
          console.log(`   📊 URL test: ${response.status} ${response.statusText}`);
        } catch (fetchError) {
          console.log(`   🌐 URL fetch error: ${fetchError.message}`);
        }
        break; // If one works, no need to test others
      }
    }
    
    // Test 3: Check bucket info
    console.log('\n3️⃣ Checking bucket configuration...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Cannot list buckets:', bucketError.message);
    } else {
      const pitchBucket = buckets.find(b => b.id === 'pitch-pdfs');
      if (pitchBucket) {
        console.log('✅ Bucket found:', {
          id: pitchBucket.id,
          name: pitchBucket.name,
          public: pitchBucket.public,
          fileSizeLimit: pitchBucket.file_size_limit,
          allowedMimeTypes: pitchBucket.allowed_mime_types
        });
      } else {
        console.log('❌ pitch-pdfs bucket not found');
      }
    }
    
  } catch (error) {
    console.error('🚨 Unexpected error:', error);
  }
}

detailedTest();