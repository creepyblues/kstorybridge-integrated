/**
 * Test Script: generate-asset Edge Function
 * Feature: Creative Asset Generation System - Image Generation
 *
 * Usage:
 *   node scripts/test-generate-asset.js [--validation-only]
 *
 * Flags:
 *   --validation-only: Skip expensive DALL-E API calls (free tests only)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const VALIDATION_ONLY = process.argv.includes('--validation-only');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// VALIDATION TESTS (FREE - NO API CALLS)
// ============================================================================

async function testMissingAssetId() {
  console.log('\n🧪 Test 1: Missing asset_id');
  console.log('='.repeat(60));

  try {
    const { data, error } = await supabase.functions.invoke('generate-asset', {
      body: {
        // Missing asset_id
        admin_email: 'sungho@kstorybridge.com'
      }
    });

    if (error && error.context && error.context.status === 400) {
      const responseText = await error.context.text();
      const responseData = JSON.parse(responseText);

      if (responseData && !responseData.success && responseData.error.code === 'INVALID_INPUT') {
        console.log('✅ PASSED - Correctly rejected missing asset_id');
        console.log(`   Error code: ${responseData.error.code}`);
        return { success: true };
      }
    }

    console.error('❌ FAILED - Should have rejected missing asset_id');
    return { success: false };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false };
  }
}

async function testUnauthorizedAdmin() {
  console.log('\n🧪 Test 2: Unauthorized admin');
  console.log('='.repeat(60));

  try {
    const { data, error } = await supabase.functions.invoke('generate-asset', {
      body: {
        asset_id: 'test-asset-123',
        admin_email: 'unauthorized@example.com'
      }
    });

    if (error && error.context && error.context.status === 400) {
      const responseText = await error.context.text();
      const responseData = JSON.parse(responseText);

      if (responseData && !responseData.success && responseData.error.code === 'UNAUTHORIZED') {
        console.log('✅ PASSED - Correctly rejected unauthorized admin');
        console.log(`   Error code: ${responseData.error.code}`);
        return { success: true };
      }
    }

    console.error('❌ FAILED - Should have rejected unauthorized admin');
    return { success: false };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false };
  }
}

async function testAssetNotFound() {
  console.log('\n🧪 Test 3: Asset not found');
  console.log('='.repeat(60));

  try {
    const { data, error } = await supabase.functions.invoke('generate-asset', {
      body: {
        asset_id: '00000000-0000-0000-0000-000000000000',
        admin_email: 'sungho@kstorybridge.com'
      }
    });

    if (error && error.context && error.context.status === 404) {
      const responseText = await error.context.text();
      const responseData = JSON.parse(responseText);

      if (responseData && !responseData.success && responseData.error.code === 'ASSET_NOT_FOUND') {
        console.log('✅ PASSED - Correctly handled asset not found');
        console.log(`   Error code: ${responseData.error.code}`);
        return { success: true };
      }
    }

    console.error('❌ FAILED - Should have returned asset not found');
    return { success: false };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false };
  }
}

// ============================================================================
// INTEGRATION TESTS (EXPENSIVE - REQUIRES DALL-E API CALLS)
// ============================================================================

async function testFullGeneration() {
  console.log('\n🧪 Test 4: Full generation workflow');
  console.log('='.repeat(60));
  console.log('⚠️  This test will make a DALL-E API call (~$0.04-0.08 cost)');

  try {
    // First, create a test asset in the database
    console.log('\n📝 Creating test asset...');

    const testAsset = {
      title_id: 'test-' + Date.now(),
      title_name: 'Test Title',
      asset_category: 'social_media',
      asset_type: 'instagram_story',
      asset_format: '1080x1920',
      description: 'Test image for validation',
      prompt_template: 'A photorealistic image of a serene Japanese garden with cherry blossoms in full bloom, koi fish swimming in a crystal-clear pond, traditional wooden bridges, and soft sunlight filtering through the trees. Vertical composition (9:16 aspect ratio). Peaceful and tranquil atmosphere.',
      generation_api: 'dall-e-3',
      generation_model: 'dall-e-3',
      generation_cost: 0,
      generation_attempts: 0,
      status: 'pending'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('title_marketing_assets')
      .insert([testAsset])
      .select()
      .single();

    if (insertError || !insertData) {
      console.error('❌ FAILED - Could not create test asset:', insertError);
      return { success: false };
    }

    const assetId = insertData.id;
    console.log(`✅ Test asset created: ${assetId}`);

    // Now generate the image
    console.log('\n🎨 Generating image with DALL-E 3...');
    console.log('   This may take 10-20 seconds...');

    const startTime = Date.now();

    const { data, error } = await supabase.functions.invoke('generate-asset', {
      body: {
        asset_id: assetId,
        admin_email: 'sungho@kstorybridge.com',
        use_hd: false  // Use standard quality to save cost
      }
    });

    const duration = Date.now() - startTime;

    if (error) {
      console.error(`❌ FAILED - Function error:`, error.message);

      // Clean up test asset
      await supabase.from('title_marketing_assets').delete().eq('id', assetId);

      return { success: false };
    }

    if (!data.success) {
      console.error(`❌ FAILED - ${data.error.code}: ${data.error.message}`);

      // Clean up test asset
      await supabase.from('title_marketing_assets').delete().eq('id', assetId);

      return { success: false };
    }

    console.log(`✅ PASSED - Image generated successfully`);
    console.log(`\n📊 Results:`);
    console.log(`   - Duration: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
    console.log(`   - Cost: $${data.data.generation_cost.toFixed(4)}`);
    console.log(`   - Model: ${data.data.generation_model}`);
    console.log(`   - Attempts: ${data.data.generation_attempts}`);
    console.log(`   - Storage path: ${data.data.storage_path}`);
    console.log(`   - Image URL: ${data.data.image_url.substring(0, 80)}...`);
    console.log(`   - Signed URL: ${data.data.signed_url.substring(0, 80)}...`);

    // Verify database was updated
    const { data: verifyData } = await supabase
      .from('title_marketing_assets')
      .select('status, image_url, generation_cost')
      .eq('id', assetId)
      .single();

    if (verifyData && verifyData.status === 'completed' && verifyData.image_url) {
      console.log(`\n✅ Database verification: Asset record updated correctly`);
      console.log(`   - Status: ${verifyData.status}`);
      console.log(`   - Image URL set: ${!!verifyData.image_url}`);
      console.log(`   - Cost recorded: $${verifyData.generation_cost}`);
    } else {
      console.log(`\n⚠️  Database verification failed`);
    }

    // Clean up test asset (optional - keep for manual inspection)
    console.log(`\n🧹 Cleaning up test asset...`);
    await supabase.from('title_marketing_assets').delete().eq('id', assetId);
    console.log(`✅ Test asset deleted`);

    return { success: true, data: data.data };
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return { success: false };
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing: generate-asset Edge Function');
  console.log('='.repeat(60));

  if (VALIDATION_ONLY) {
    console.log('💰 Mode: VALIDATION ONLY (Free - no DALL-E calls)');
  } else {
    console.log('💰 Mode: FULL INTEGRATION (Will cost ~$0.04-0.08)');
  }

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Validation tests (always run - free)
  const validationTests = [
    { name: 'Missing asset_id', fn: testMissingAssetId },
    { name: 'Unauthorized admin', fn: testUnauthorizedAdmin },
    { name: 'Asset not found', fn: testAssetNotFound }
  ];

  for (const test of validationTests) {
    results.total++;
    const result = await test.fn();
    results.tests.push({ name: test.name, ...result });

    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Integration tests (only run if not validation-only)
  if (!VALIDATION_ONLY) {
    const integrationTests = [
      { name: 'Full generation workflow', fn: testFullGeneration }
    ];

    for (const test of integrationTests) {
      results.total++;
      const result = await test.fn();
      results.tests.push({ name: test.name, ...result });

      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (VALIDATION_ONLY) {
    console.log(`💰 Total cost: $0.00 (validation only)`);
    console.log(`\n💡 To run full integration tests: node scripts/test-generate-asset.js`);
  } else {
    console.log(`💰 Estimated cost: ~$0.04-0.08`);
  }

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => !t.success).forEach(t => {
      console.log(`   - ${t.name}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
