#!/usr/bin/env node

// Script to create the marketing-assets storage bucket in Supabase
// Run this to fix the "Bucket not found" error

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc5MjMzNCwiZXhwIjoyMDY3MzY4MzM0fQ.oH7yaQVjLonLPjtVl0P7JwApqa5Zyy9y36CIx5qjl_s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createStorageBucket() {
  console.log('🪣 Creating Supabase Storage Bucket\n');
  console.log('=' .repeat(80));

  // Step 1: Check if bucket already exists
  console.log('\n📊 Step 1: Checking if marketing-assets bucket exists...\n');

  const { data: buckets, error: listError } = await supabase
    .storage
    .listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    return;
  }

  console.log(`✅ Found ${buckets.length} existing bucket(s):`);
  buckets.forEach(bucket => {
    console.log(`   - ${bucket.id} (public: ${bucket.public})`);
  });

  const bucketExists = buckets.some(b => b.id === 'marketing-assets');

  if (bucketExists) {
    console.log('\n✅ marketing-assets bucket already exists!');
    console.log('   Skipping creation...\n');
  } else {
    // Step 2: Create the bucket
    console.log('\n📊 Step 2: Creating marketing-assets bucket...\n');

    const { data: newBucket, error: createError } = await supabase
      .storage
      .createBucket('marketing-assets', {
        public: true,  // Make it publicly accessible
        fileSizeLimit: 10485760,  // 10 MB limit
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
      });

    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      return;
    }

    console.log('✅ Bucket created successfully!');
    console.log(`   Bucket ID: ${newBucket.name}`);
    console.log(`   Public: true`);
    console.log(`   File size limit: 10 MB`);
    console.log(`   Allowed types: PNG, JPEG, WebP\n`);
  }

  // Step 3: Verify bucket configuration
  console.log('\n📊 Step 3: Verifying bucket configuration...\n');

  const { data: verifyBuckets, error: verifyError } = await supabase
    .storage
    .listBuckets();

  if (verifyError) {
    console.error('❌ Error verifying buckets:', verifyError);
    return;
  }

  const marketingBucket = verifyBuckets.find(b => b.id === 'marketing-assets');

  if (marketingBucket) {
    console.log('✅ Bucket verified:');
    console.log(`   ID: ${marketingBucket.id}`);
    console.log(`   Name: ${marketingBucket.name}`);
    console.log(`   Public: ${marketingBucket.public}`);
    console.log(`   Created: ${marketingBucket.created_at}`);
    console.log(`   Updated: ${marketingBucket.updated_at}`);
  } else {
    console.error('❌ Bucket not found after creation!');
  }

  // Step 4: Test upload
  console.log('\n📊 Step 4: Testing bucket with a sample upload...\n');

  // Create a small test image (1x1 pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const testImageBuffer = Buffer.from(testImageBase64, 'base64');
  const testFilename = `test-${Date.now()}.png`;

  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('marketing-assets')
    .upload(testFilename, testImageBuffer, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('❌ Test upload failed:', uploadError);
    console.log('\n⚠️  The bucket was created, but uploads are failing.');
    console.log('   This might be due to RLS policies or permissions.');
    console.log('   Please check the Supabase dashboard: Storage → Policies');
    return;
  }

  console.log('✅ Test upload successful!');
  console.log(`   File path: ${uploadData.path}`);

  // Get public URL
  const { data: publicUrlData } = supabase
    .storage
    .from('marketing-assets')
    .getPublicUrl(testFilename);

  console.log(`   Public URL: ${publicUrlData.publicUrl}`);

  // Verify the file is accessible
  console.log('\n📊 Step 5: Verifying public access...\n');

  try {
    const response = await fetch(publicUrlData.publicUrl);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('   ✅ File is publicly accessible!');

      // Clean up test file
      const { error: deleteError } = await supabase
        .storage
        .from('marketing-assets')
        .remove([testFilename]);

      if (!deleteError) {
        console.log('   ✅ Test file cleaned up');
      }
    } else {
      console.log('   ❌ File is not publicly accessible');
      console.log('   This might be due to bucket configuration or RLS policies');
    }
  } catch (err) {
    console.error('   ❌ Error testing public access:', err.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Storage bucket setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Go to Supabase Dashboard → Storage → marketing-assets');
  console.log('  2. Verify bucket policies allow public read access');
  console.log('  3. Try regenerating the failed asset image\n');
}

// Run the setup
createStorageBucket().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
