#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEzNzk5MTAsImV4cCI6MjAzNjk1NTkxMH0.NyqLnAmjzKE8-dXBTuVkQ7QhJLUJw-sC3YW0f-gW3mY';

async function testDifferentApproach() {
  console.log('🔍 Testing Different Approaches\n');
  
  // Test 1: Try with different client configurations
  console.log('1️⃣ Testing with different client config...');
  
  const clients = [
    { 
      name: 'Standard client',
      client: createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    },
    {
      name: 'Client with auth config', 
      client: createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    },
    {
      name: 'Client with storage config',
      client: createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        storage: {
          allowedMimeTypes: ['application/pdf']
        }
      })
    }
  ];
  
  for (const { name, client } of clients) {
    console.log(`\n   Testing ${name}...`);
    
    try {
      // Test basic auth first
      const { data: authData, error: authError } = await client.auth.getSession();
      console.log(`   📋 Auth status: ${authError ? 'Error' : 'OK'}`);
      
      // Test storage
      const { data, error } = await client.storage
        .from('pitch-pdfs')
        .createSignedUrl('2448b5ea-8222-4bd7-a559-30d194f9d322/pitch.pdf', 60);
      
      if (error) {
        console.log(`   ❌ ${error.message}`);
      } else {
        console.log(`   ✅ Success with ${name}!`);
        console.log(`   🔗 URL: ${data.signedUrl.substring(0, 100)}...`);
        return; // Stop if we find one that works
      }
    } catch (err) {
      console.log(`   💥 Exception: ${err.message}`);
    }
  }
  
  // Test 2: Check if it's a file-specific issue
  console.log('\n2️⃣ Testing with different file paths...');
  const testPaths = [
    '2448b5ea-8222-4bd7-a559-30d194f9d322/pitch.pdf',
    '1813044e-306f-4479-87cb-bb212b502e1f/pitch.pdf',
    'test.pdf',  // Simple path
    'nonexistent.pdf'  // Non-existent file
  ];
  
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  for (const path of testPaths) {
    console.log(`   Testing path: ${path}...`);
    const { data, error } = await client.storage
      .from('pitch-pdfs')
      .createSignedUrl(path, 60);
    
    if (error) {
      console.log(`   ❌ ${error.message}`);
    } else {
      console.log(`   ✅ Success!`);
    }
  }
  
  // Test 3: Try with the public bucket (title-images) for comparison
  console.log('\n3️⃣ Testing with public bucket for comparison...');
  const { data: publicData, error: publicError } = await client.storage
    .from('title-images')
    .createSignedUrl('test.jpg', 60);
  
  if (publicError) {
    console.log(`   ❌ Public bucket also fails: ${publicError.message}`);
    console.log('   💡 This suggests a broader storage configuration issue');
  } else {
    console.log(`   ✅ Public bucket works fine`);
    console.log('   💡 This confirms the issue is specific to pitch-pdfs bucket');
  }
}

testDifferentApproach();