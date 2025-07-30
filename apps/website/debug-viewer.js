#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzNzk5MTAsImV4cCI6MjAzNjk1NTkxMH0.NyqLnAmjzKE8-dXBTuVkQ7QhJLUJw-sC3YW0f-gW3mY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugViewer() {
  console.log('🔍 Debug PDF Viewer Issue');
  console.log('🎯 Target PDF: d6cdcc3a-b7a0-446b-97e0-1310d672c6aa/pitch.pdf\n');
  
  // Test 1: Check if title exists in database
  console.log('1️⃣ Checking title in database...');
  const { data: titleData, error: titleError } = await supabase
    .from('titles')
    .select('title_id, title, pitch')
    .eq('title_id', 'd6cdcc3a-b7a0-446b-97e0-1310d672c6aa')
    .single();
  
  if (titleError) {
    console.log('❌ Title not found in database:', titleError.message);
    console.log('💡 This could be why the viewer fails');
    return;
  }
  
  console.log('✅ Title found:', {
    title_id: titleData.title_id,
    title: titleData.title,
    pitch_url: titleData.pitch
  });
  
  // Test 2: Check the pitch URL format
  console.log('\n2️⃣ Analyzing pitch URL...');
  if (!titleData.pitch) {
    console.log('❌ No pitch URL in database');
    return;
  }
  
  const pitchUrl = titleData.pitch;
  console.log('📋 Stored pitch URL:', pitchUrl);
  
  // Check if it matches our expected format
  const pathMatch = pitchUrl.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
  if (pathMatch) {
    const [, bucketName, filePath] = pathMatch;
    console.log('✅ URL format valid:', {
      bucket: bucketName,
      path: filePath
    });
    
    // Check if path matches UUID/pitch.pdf format
    const pathRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/pitch\.pdf$/;
    if (pathRegex.test(filePath)) {
      console.log('✅ Path format matches UUID/pitch.pdf pattern');
    } else {
      console.log('❌ Path format doesn\'t match expected pattern');
      console.log('💡 Expected: UUID/pitch.pdf, Got:', filePath);
    }
  } else {
    console.log('❌ URL format doesn\'t match Supabase storage pattern');
  }
  
  // Test 3: Try to access with current storage API
  console.log('\n3️⃣ Testing storage API access...');
  const { data: listData, error: listError } = await supabase.storage
    .from('pitch-pdfs')
    .list('d6cdcc3a-b7a0-446b-97e0-1310d672c6aa', { limit: 5 });
  
  if (listError) {
    console.log('❌ Cannot list files in directory:', listError.message);
  } else {
    console.log('✅ Can list directory, found files:', listData.map(f => f.name));
  }
  
  // Test 4: Check bucket status
  console.log('\n4️⃣ Checking bucket configuration...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.log('❌ Cannot check bucket status:', bucketError.message);
  } else {
    const pitchBucket = buckets.find(b => b.id === 'pitch-pdfs');
    if (pitchBucket) {
      console.log('✅ Bucket found:', {
        id: pitchBucket.id,
        public: pitchBucket.public,
        file_size_limit: pitchBucket.file_size_limit
      });
    } else {
      console.log('❌ pitch-pdfs bucket not found');
    }
  }
}

debugViewer().catch(console.error);