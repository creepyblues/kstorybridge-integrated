#!/usr/bin/env node

// Diagnostic script for corrupted asset image
// Checks database record to see asset status and image URL

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTc5MjMzNCwiZXhwIjoyMDY3MzY4MzM0fQ.oH7yaQVjLonLPjtVl0P7JwApqa5Zyy9y36CIx5qjl_s';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnoseAsset() {
  console.log('🔍 Asset Generation Diagnostic Tool\n');
  console.log('='.repeat(80));

  // Query 1: Find the specific asset with ID starting with 'cbbaa14d'
  console.log('\n📊 Query 1: Searching for asset ID cbbaa14d...\n');

  // First, get recent Instagram Story assets
  const { data: specificAsset, error: error1 } = await supabase
    .from('title_marketing_assets')
    .select('*')
    .eq('asset_type', 'instagram_story')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error1) {
    console.error('❌ Error querying specific asset:', error1);
  } else if (!specificAsset || specificAsset.length === 0) {
    console.log('⚠️  No asset found with ID starting with "cbbaa14d"');
  } else {
    const asset = specificAsset[0];
    console.log('✅ Asset Found:');
    console.log(`   ID: ${asset.id}`);
    console.log(`   Title: ${asset.title_name}`);
    console.log(`   Type: ${asset.asset_type} (${asset.asset_format})`);
    console.log(`   Status: ${asset.status}`);
    console.log(`   Image URL: ${asset.image_url || '❌ NULL/EMPTY'}`);
    console.log(`   Video URL: ${asset.video_url || 'NULL'}`);
    console.log(`   Generation API: ${asset.generation_api}`);
    console.log(`   Generation Model: ${asset.generation_model}`);
    console.log(`   Generation Cost: $${asset.generation_cost || 0}`);
    console.log(`   Generation Attempts: ${asset.generation_attempts}`);
    console.log(`   Error Message: ${asset.error_message || 'None'}`);
    console.log(`   Approved: ${asset.approved}`);
    console.log(`   Created: ${asset.created_at}`);
    console.log(`   Updated: ${asset.updated_at}`);

    // Analyze the image URL
    if (asset.image_url) {
      console.log(`\n📸 Image URL Analysis:`);
      console.log(`   Length: ${asset.image_url.length} characters`);
      console.log(`   Type: ${asset.image_url.includes('supabase') ? 'Supabase Storage' : 'External URL'}`);
      console.log(`   Full URL: ${asset.image_url}`);

      // Try to fetch the image to see if it's accessible
      console.log(`\n🔗 Testing image accessibility...`);
      try {
        const response = await fetch(asset.image_url);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`);

        if (response.ok) {
          const blob = await response.blob();
          console.log(`   ✅ Image is accessible`);
          console.log(`   Blob size: ${blob.size} bytes`);
          console.log(`   Blob type: ${blob.type}`);

          if (blob.size < 1000) {
            console.log(`   ⚠️  WARNING: Image is very small (< 1KB), may be corrupted`);
          }
        } else {
          console.log(`   ❌ Image URL returned error status`);
          // Try to get the error message
          try {
            const errorBody = await response.text();
            console.log(`   Error body: ${errorBody}`);
          } catch (e) {
            console.log(`   Could not read error body`);
          }
        }
      } catch (err) {
        console.log(`   ❌ Error fetching image:`, err.message);
      }
    }
  }

  // Query 2: Check recent assets
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Query 2: Recent assets (last hour)\n');

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentAssets, error: error2 } = await supabase
    .from('title_marketing_assets')
    .select('id, asset_type, status, image_url, generation_attempts, error_message, created_at')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error2) {
    console.error('❌ Error querying recent assets:', error2);
  } else if (!recentAssets || recentAssets.length === 0) {
    console.log('⚠️  No assets created in the last hour');
  } else {
    console.log(`✅ Found ${recentAssets.length} recent asset(s):\n`);
    recentAssets.forEach((asset, index) => {
      const urlStatus = !asset.image_url ? '❌ NULL' :
                       asset.image_url.length < 50 ? '⚠️  TOO SHORT' :
                       '✅ HAS URL';
      console.log(`   ${index + 1}. ${asset.asset_type}`);
      console.log(`      ID: ${asset.id.substring(0, 12)}...`);
      console.log(`      Status: ${asset.status}`);
      console.log(`      URL Status: ${urlStatus}`);
      console.log(`      Attempts: ${asset.generation_attempts}`);
      console.log(`      Error: ${asset.error_message || 'None'}`);
      console.log(`      Created: ${new Date(asset.created_at).toLocaleString()}`);
      console.log('');
    });
  }

  console.log('='.repeat(80));
  console.log('\n✅ Diagnostic complete\n');
}

// Run the diagnostic
diagnoseAsset().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
