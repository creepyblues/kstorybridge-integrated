#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzNzk5MTAsImV4cCI6MjAzNjk1NTkxMH0.NyqLnAmjzKE8-dXBTuVkQ7QhJLUJw-sC3YW0f-gW3mY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugStorageIssue() {
  console.log('🔍 Comprehensive PDF Storage Debug\n');
  
  // Test 1: Check if bucket exists and is accessible
  console.log('1️⃣ Testing bucket access...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('❌ Cannot list buckets:', error.message);
    } else {
      const pitchBucket = buckets.find(b => b.id === 'pitch-pdfs');
      if (pitchBucket) {
        console.log('✅ pitch-pdfs bucket found:', {
          name: pitchBucket.name,
          public: pitchBucket.public,
          created_at: pitchBucket.created_at
        });
      } else {
        console.log('❌ pitch-pdfs bucket not found');
        console.log('Available buckets:', buckets.map(b => b.id));
      }
    }
  } catch (err) {
    console.log('💥 Exception listing buckets:', err.message);
  }
  
  // Test 2: Check if specific file exists
  console.log('\n2️⃣ Testing file existence...');
  const testFilePath = 'd6cdcc3a-b7a0-446b-97e0-1310d672c6aa/pitch.pdf';
  try {
    const { data, error } = await supabase.storage
      .from('pitch-pdfs')
      .list('d6cdcc3a-b7a0-446b-97e0-1310d672c6aa');
    
    if (error) {
      console.log('❌ Cannot list directory:', error.message);
    } else {
      console.log('✅ Directory contents:', data.map(f => f.name));
      const pdfFile = data.find(f => f.name === 'pitch.pdf');
      if (pdfFile) {
        console.log('✅ pitch.pdf found:', {
          name: pdfFile.name,
          size: pdfFile.metadata?.size || 'unknown',
          lastModified: pdfFile.updated_at
        });
      } else {
        console.log('❌ pitch.pdf not found in directory');
      }
    }
  } catch (err) {
    console.log('💥 Exception listing files:', err.message);
  }
  
  // Test 3: Try different approaches to access the file
  console.log('\n3️⃣ Testing different access methods...');
  
  // Method A: Direct public URL (should fail)
  console.log('   Testing direct public URL...');
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/pitch-pdfs/${testFilePath}`;
  try {
    const response = await fetch(publicUrl);
    console.log(`   📊 Direct public: ${response.status} ${response.statusText}`);
  } catch (err) {
    console.log('   💥 Direct public failed:', err.message);
  }
  
  // Method B: Signed URL (should work if policies are correct)
  console.log('   Testing signed URL...');
  try {
    const { data: signedData, error: signedError } = await supabase.storage
      .from('pitch-pdfs')
      .createSignedUrl(testFilePath, 60);
    
    if (signedError) {
      console.log('   ❌ Signed URL creation failed:', signedError.message);
    } else {
      console.log('   ✅ Signed URL created successfully');
      
      // Test the signed URL
      try {
        const response = await fetch(signedData.signedUrl);
        console.log(`   📊 Signed URL: ${response.status} ${response.statusText}`);
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          console.log(`   📄 Content-Type: ${contentType}`);
        }
      } catch (fetchErr) {
        console.log('   💥 Signed URL fetch failed:', fetchErr.message);
      }
    }
  } catch (err) {
    console.log('   💥 Signed URL exception:', err.message);
  }
  
  // Test 4: Check if we can download the file
  console.log('\n4️⃣ Testing file download...');
  try {
    const { data, error } = await supabase.storage
      .from('pitch-pdfs')
      .download(testFilePath);
    
    if (error) {
      console.log('❌ Download failed:', error.message);
    } else {
      console.log('✅ Download successful:', {
        size: data.size,
        type: data.type
      });
    }
  } catch (err) {
    console.log('💥 Download exception:', err.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSIS:');
  console.log('If bucket exists but signed URLs fail → Policy issue');
  console.log('If file not found → Upload issue');
  console.log('If all fail → Bucket configuration issue');
  console.log('If download works but signed URL fails → CORS/Policy issue');
}

debugStorageIssue().catch(console.error);