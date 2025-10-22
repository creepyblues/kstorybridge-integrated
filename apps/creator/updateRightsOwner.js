#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Please set it with: export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateAllRightsOwner() {
  try {
    console.log('🔄 Updating all titles with rights_owner = "RIDI"...');
    
    // Update all records in the titles table
    const { data, error, count } = await supabase
      .from('titles')
      .update({ rights_owner: 'RIDI' })
      .select('title_id, title_name_en, title_name_kr, rights_owner');

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      console.log(`✅ Successfully updated ${data.length} titles with rights_owner = "RIDI"`);
      console.log('\n📋 Updated titles:');
      data.forEach((title, index) => {
        console.log(`   ${index + 1}. ${title.title_name_en || title.title_name_kr} - Rights Owner: ${title.rights_owner}`);
      });
    } else {
      console.log('ℹ️  No titles found to update');
    }

  } catch (error) {
    console.error('❌ Error updating rights owner:', error.message);
    process.exit(1);
  }
}

// Run the script
updateAllRightsOwner();