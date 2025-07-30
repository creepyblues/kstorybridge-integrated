#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzNzk5MTAsImV4cCI6MjAzNjk1NTkxMH0.NyqLnAmjzKE8-dXBTuVkQ7QhJLUJw-sC3YW0f-gW3mY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSignedURL() {
  console.log('🔐 Testing Signed URL Access for Authenticated Users\n');
  
  try {
    // Test creating signed URL with anon key (this should work if policies are correct)
    console.log('1️⃣ Testing signed URL creation...');
    const { data, error } = await supabase.storage
      .from('pitch-pdfs')
      .createSignedUrl('2448b5ea-8222-4bd7-a559-30d194f9d322/pitch.pdf', 3600);
    
    if (error) {
      console.log('❌ Error creating signed URL:', error.message);
      console.log('💡 This means the storage policies need to be updated');
      return;
    }
    
    if (!data?.signedUrl) {
      console.log('❌ No signed URL returned');
      return;
    }
    
    console.log('✅ Signed URL created successfully!');
    console.log('🔗 URL (first 100 chars):', data.signedUrl.substring(0, 100) + '...');
    
    // Test accessing the signed URL
    console.log('\n2️⃣ Testing signed URL access...');
    const response = await fetch(data.signedUrl);
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const contentType = response.headers.get('content-type');
      console.log('✅ Signed URL access successful!');
      console.log(`📄 Content-Type: ${contentType}`);
      console.log('🎉 Authenticated PDF access is working correctly');
    } else {
      console.log('❌ Signed URL access failed');
      console.log('💡 Check storage policies in Supabase');
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

testSignedURL();