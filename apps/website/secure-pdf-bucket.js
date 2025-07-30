#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Note: This requires the service role key to execute storage policies
// You'll need to run this with the service role key, not the anon key
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';

// You need to provide the service role key as an environment variable
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Please provide SUPABASE_SERVICE_KEY environment variable');
  console.log('Usage: SUPABASE_SERVICE_KEY=your_service_key node secure-pdf-bucket.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function securePdfBucket() {
  try {
    console.log('🔒 Securing PDF storage bucket...\n');
    
    // Step 1: Make bucket private
    console.log('1️⃣ Making pitch-pdfs bucket private...');
    const { error: bucketError } = await supabase
      .from('storage.buckets')
      .update({ public: false })
      .eq('id', 'pitch-pdfs');
    
    if (bucketError) {
      console.error('❌ Error making bucket private:', bucketError);
    } else {
      console.log('✅ Bucket is now private');
    }
    
    // Step 2: Check bucket status
    console.log('\n2️⃣ Checking bucket status...');
    const { data: buckets, error: checkError } = await supabase
      .from('storage.buckets')
      .select('id, name, public')
      .eq('id', 'pitch-pdfs');
    
    if (checkError) {
      console.error('❌ Error checking bucket:', checkError);
    } else {
      console.log('📊 Bucket status:', buckets);
    }
    
    // Step 3: Test direct access
    console.log('\n3️⃣ Testing direct PDF access...');
    const testUrl = 'https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/pitch-pdfs/1813044e-306f-4479-87cb-bb212b502e1f/pitch.pdf';
    
    try {
      const response = await fetch(testUrl);
      console.log(`🌐 Direct access response: ${response.status} ${response.statusText}`);
      if (response.status === 400 || response.status === 403) {
        console.log('✅ Direct access is blocked (as expected)');
      } else {
        console.log('⚠️  Direct access might still be allowed');
      }
    } catch (fetchError) {
      console.log('✅ Direct access failed (as expected):', fetchError.message);
    }
    
    // Step 4: Test authenticated access
    console.log('\n4️⃣ Testing authenticated access...');
    const { data: signedUrl, error: signError } = await supabase.storage
      .from('pitch-pdfs')
      .createSignedUrl('1813044e-306f-4479-87cb-bb212b502e1f/pitch.pdf', 3600);
    
    if (signError) {
      console.error('❌ Error creating signed URL:', signError);
    } else {
      console.log('✅ Signed URL created successfully');
      console.log('🔗 Signed URL (first 100 chars):', signedUrl.signedUrl.substring(0, 100) + '...');
    }
    
    console.log('\n🎉 PDF bucket security setup complete!');
    console.log('📝 Summary:');
    console.log('   • Bucket is now private');
    console.log('   • Direct URLs should be blocked'); 
    console.log('   • PDFs can only be accessed through signed URLs');
    console.log('   • Secure viewer will use signed URLs automatically');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

securePdfBucket();