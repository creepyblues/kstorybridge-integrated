#!/usr/bin/env node

// Script to make the marketing-assets bucket public
// This fixes the "Bucket not found" error which is actually a permissions issue

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var. Set it before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function makeBucketPublic() {
  console.log('🔓 Making marketing-assets Bucket Public\n');
  console.log('='.repeat(80));

  // Step 1: Check current bucket configuration
  console.log('\n📊 Step 1: Checking current bucket configuration...\n');

  const { data: buckets, error: listError } = await supabase
    .storage
    .listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    return;
  }

  const bucket = buckets.find(b => b.id === 'marketing-assets');

  if (!bucket) {
    console.error('❌ marketing-assets bucket not found!');
    console.log('\n   Run create-storage-bucket.js first to create the bucket.');
    return;
  }

  console.log('✅ Current bucket configuration:');
  console.log(`   ID: ${bucket.id}`);
  console.log(`   Name: ${bucket.name}`);
  console.log(`   Public: ${bucket.public} ${bucket.public ? '✅' : '❌'}`);
  console.log(`   Created: ${bucket.created_at}`);

  if (bucket.public) {
    console.log('\n✅ Bucket is already public! No action needed.\n');
    return;
  }

  // Step 2: Update bucket to make it public
  console.log('\n📊 Step 2: Updating bucket to public...\n');

  const { data: updateData, error: updateError } = await supabase
    .storage
    .updateBucket('marketing-assets', {
      public: true
    });

  if (updateError) {
    console.error('❌ Error updating bucket:', updateError);
    console.log('\n⚠️  You may need to update this manually in the Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/storage/buckets');
    console.log('   2. Find "marketing-assets" bucket');
    console.log('   3. Click the three-dot menu → Edit');
    console.log('   4. Toggle "Public bucket" to ON');
    console.log('   5. Save changes\n');
    return;
  }

  console.log('✅ Bucket updated to public!');

  // Step 3: Verify the update
  console.log('\n📊 Step 3: Verifying update...\n');

  const { data: verifyBuckets, error: verifyError } = await supabase
    .storage
    .listBuckets();

  if (verifyError) {
    console.error('❌ Error verifying update:', verifyError);
    return;
  }

  const updatedBucket = verifyBuckets.find(b => b.id === 'marketing-assets');

  if (updatedBucket) {
    console.log('✅ Updated bucket configuration:');
    console.log(`   ID: ${updatedBucket.id}`);
    console.log(`   Public: ${updatedBucket.public} ${updatedBucket.public ? '✅' : '❌'}`);
    console.log(`   Updated: ${updatedBucket.updated_at}`);
  }

  // Step 4: Test access to an existing file
  console.log('\n📊 Step 4: Testing access to existing files...\n');

  const testUrl = 'https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/marketing-assets/66760b36-fdda-49cd-8720-f855384d5505/instagram_story-1762561660191.png';

  console.log(`Testing URL: ${testUrl.substring(0, 80)}...`);

  try {
    const response = await fetch(testUrl);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    if (response.ok) {
      const blob = await response.blob();
      console.log(`   ✅ File is now accessible!`);
      console.log(`   File size: ${blob.size} bytes`);
      console.log(`   File type: ${blob.type}`);
    } else {
      console.log(`   ❌ File still not accessible`);
      const errorBody = await response.text();
      console.log(`   Error: ${errorBody}`);
    }
  } catch (err) {
    console.error(`   ❌ Error testing access:`, err.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Bucket is now public!\n');
  console.log('Next steps:');
  console.log('  1. Refresh the asset generation page');
  console.log('  2. The previously corrupted image should now be viewable');
  console.log('  3. New asset generations will work correctly\n');
}

// Run the update
makeBucketPublic().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
