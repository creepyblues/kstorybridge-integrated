#!/usr/bin/env node

// Test with service role key to isolate the issue
// You'll need to set SUPABASE_SERVICE_KEY environment variable

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.log('⚠️  SUPABASE_SERVICE_KEY not provided');
  console.log('💡 This test needs the service role key to verify if the issue is with anon key');
  console.log('');
  console.log('Usage: SUPABASE_SERVICE_KEY=your_service_key node test-with-service-key.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testWithServiceKey() {
  console.log('🔐 Testing with Service Role Key\n');
  
  try {
    console.log('1️⃣ Testing bucket access with service key...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Service key bucket access failed:', bucketError.message);
      return;
    }
    
    console.log('✅ Service key can access storage');
    const pitchBucket = buckets.find(b => b.id === 'pitch-pdfs');
    if (pitchBucket) {
      console.log('📋 Bucket status:', {
        public: pitchBucket.public,
        name: pitchBucket.name
      });
    }
    
    console.log('\n2️⃣ Testing signed URL creation with service key...');
    const { data, error } = await supabase.storage
      .from('pitch-pdfs')
      .createSignedUrl('2448b5ea-8222-4bd7-a559-30d194f9d322/pitch.pdf', 3600);
    
    if (error) {
      console.log('❌ Service key signed URL failed:', error.message);
    } else {
      console.log('✅ Service key signed URL created successfully!');
      console.log('🔗 URL (first 100 chars):', data.signedUrl.substring(0, 100) + '...');
      
      // Test the URL
      const response = await fetch(data.signedUrl, { method: 'HEAD' });
      console.log(`📊 URL Response: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('🚨 Error:', error.message);
  }
}

testWithServiceKey();